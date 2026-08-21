"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CloudUpload,
  ExternalLink,
  FileText,
  Film,
  FolderPlus,
  HardDrive,
  Loader2,
  LogOut,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ACCEPT_ATTRIBUTE,
  MAX_UPLOAD_BYTES,
  kindOf,
  labelOf,
  primaryMimeFor,
  validateUpload,
  type FileKind,
} from "@/config/uploads";
import { formatBytes } from "@/lib/format";
import { prepareUpload } from "@/lib/prepare-upload";
import { makeThumbnail, releaseThumbnail } from "@/lib/thumbnail";
import { uploadToDrive } from "@/lib/upload-client";

/** Envios simultâneos. Mais que isso e o navegador começa a enfileirar sozinho. */
const CONCURRENCY = 3;

/**
 * Miniaturas geradas por seleção. Acima disso os itens mostram só o bloco com
 * a extensão: com 300 fotos na fila, gerar 300 miniaturas trava a interface e
 * o ganho visual é nenhum (ninguém rola 300 linhas conferindo thumbnail).
 */
const THUMBNAIL_BUDGET = 80;
/** Miniaturas geradas em paralelo. Duas já saturam o decodificador. */
const THUMBNAIL_CONCURRENCY = 2;

interface AlbumRow {
  id: string;
  name: string;
  folderId: string;
  count: number;
}

interface Status {
  hasClient: boolean;
  connected: boolean;
  ready: boolean;
  rootFolderId: string;
  missing: string[];
  quota: { limit: number | null; usage: number; usageInDrive: number } | null;
}

type ItemState = "aguardando" | "convertendo" | "enviando" | "concluido" | "erro";

const STATE_LABEL: Record<ItemState, string> = {
  aguardando: "Aguardando",
  convertendo: "Convertendo…",
  enviando: "Enviando…",
  concluido: "Concluído",
  erro: "Erro",
};

interface QueueItem {
  key: string;
  file: File;
  kind: FileKind;
  label: string;
  progress: number;
  state: ItemState;
  error?: string;
  finalSize?: number;
  thumbUrl?: string | null;
  convertedFromHeic?: boolean;
  /** O arquivo já existia na pasta e não foi reenviado. */
  duplicate?: boolean;
}

interface AdminFile {
  id: string;
  name: string;
  size: number;
  kind: FileKind;
  thumbnailUrl: string | null;
}

export default function AdminPanel() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status | null>(null);
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [albumId, setAlbumId] = useState("");
  const [files, setFiles] = useState<AdminFile[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [optimize, setOptimize] = useState(true);
  const [keepOriginals, setKeepOriginals] = useState(true);
  const [newAlbum, setNewAlbum] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);

  /** Espelho da fila para os workers lerem o estado atual sem closure velha. */
  const queueRef = useRef<QueueItem[]>([]);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  /** Todo object URL criado precisa ser revogado — aqui ficam os pendentes. */
  const objectUrls = useRef<Set<string>>(new Set());
  /** Id da subpasta `_originais` já resolvida, por álbum. */
  const originalsCache = useRef<Map<string, string>>(new Map());
  /** Evita contar entrada/saída de elementos filhos no drag and drop. */
  const dragDepth = useRef(0);
  /**
   * Trava SÍNCRONA de envio.
   *
   * `setRunning(true)` só vira `running === true` no próximo render. Dois
   * cliques rápidos em "ENVIAR" (ou um clique repetido porque nada pareceu
   * acontecer) passavam os dois pela checagem e a fila inteira era percorrida
   * duas vezes — cada foto subia duas vezes para o Drive. Um ref muda no
   * mesmo instante e fecha essa janela.
   */
  const runningRef = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const urls = objectUrls.current;
    return () => {
      mounted.current = false;
      // Libera a memória das miniaturas ao sair do painel.
      for (const url of urls) releaseThumbnail(url);
      urls.clear();
    };
  }, []);

  const album = useMemo(
    () => albums.find((item) => item.folderId === albumId) ?? null,
    [albums, albumId],
  );

  const totals = useMemo(() => {
    const total = queue.length;
    const done = queue.filter((item) => item.state === "concluido").length;
    const failed = queue.filter((item) => item.state === "erro").length;
    const pending = queue.filter(
      (item) => item.state === "aguardando" || item.state === "erro",
    ).length;
    // Progresso geral: item concluído vale 1, item com erro vale 0, o resto
    // entra com a fração real de bytes já enviados.
    const fraction = total
      ? queue.reduce((sum, item) => {
          if (item.state === "concluido") return sum + 1;
          if (item.state === "erro") return sum;
          return sum + item.progress;
        }, 0) / total
      : 0;
    return { total, done, failed, pending, fraction };
  }, [queue]);

  /* ------------------------------------------------------------- carregamento */

  const loadStatus = useCallback(async () => {
    const response = await fetch("/api/admin/status");
    if (response.status === 401) {
      router.refresh();
      return null;
    }
    const data = (await response.json()) as Status;
    setStatus(data);
    return data;
  }, [router]);

  const loadAlbums = useCallback(async () => {
    const response = await fetch("/api/admin/albums");
    if (!response.ok) return;
    const data = (await response.json()) as { albums?: AlbumRow[] };
    const list = data.albums ?? [];
    setAlbums(list);
    setAlbumId((current) =>
      current && list.some((item) => item.folderId === current)
        ? current
        : (list[0]?.folderId ?? ""),
    );
  }, []);

  const loadFiles = useCallback(async (folderId: string) => {
    if (!folderId) {
      setFiles([]);
      return;
    }
    const response = await fetch(`/api/admin/photos?folderId=${folderId}`);
    if (!response.ok) return;
    const data = (await response.json()) as { photos?: AdminFile[] };
    setFiles(data.photos ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      const data = await loadStatus();
      if (data?.ready) await loadAlbums();
    })();
  }, [loadStatus, loadAlbums]);

  useEffect(() => {
    void loadFiles(albumId);
  }, [albumId, loadFiles]);

  /* ------------------------------------------------------------------- ações */

  const createRootFolder = async () => {
    setBusy("root");
    setError(null);
    try {
      const response = await fetch("/api/admin/root-folder", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNotice(
        `Pasta criada. Cole este ID na Vercel como GOOGLE_DRIVE_ROOT_FOLDER_ID e faça Redeploy: ${data.folder.id}`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao criar a pasta.");
    } finally {
      setBusy(null);
    }
  };

  const createAlbum = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newAlbum.trim();
    if (name.length < 2 || busy) return;

    setBusy("album");
    setError(null);
    try {
      const response = await fetch("/api/admin/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNewAlbum("");
      await loadAlbums();
      setAlbumId(data.folder.id);
      setNotice(`Álbum “${data.folder.name}” criado.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao criar o álbum.");
    } finally {
      setBusy(null);
    }
  };

  const patch = useCallback((key: string, changes: Partial<QueueItem>) => {
    setQueue((current) =>
      current.map((item) => (item.key === key ? { ...item, ...changes } : item)),
    );
  }, []);

  /* -------------------------------------------------------------- miniaturas */

  /**
   * Gera as miniaturas em segundo plano, de poucas em poucas, para a seleção de
   * dezenas de arquivos não travar a página.
   */
  const generateThumbnails = useCallback(async (keys: string[]) => {
    let cursor = 0;
    const worker = async () => {
      while (cursor < keys.length) {
        const key = keys[cursor++];
        if (!mounted.current) return;
        const item = queueRef.current.find((entry) => entry.key === key);
        if (!item || item.thumbUrl !== undefined) continue;

        const url = await makeThumbnail(item.file, item.kind);
        if (!mounted.current) {
          releaseThumbnail(url);
          return;
        }
        if (url) objectUrls.current.add(url);
        patch(key, { thumbUrl: url });
      }
    };
    await Promise.all(Array.from({ length: THUMBNAIL_CONCURRENCY }, worker));
  }, [patch]);

  const dropThumbnail = (item: QueueItem) => {
    if (item.thumbUrl) {
      objectUrls.current.delete(item.thumbUrl);
      releaseThumbnail(item.thumbUrl);
    }
  };

  /* ------------------------------------------------------------------- fila */

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      if (list.length === 0) return;

      const existing = new Set(
        queueRef.current.map((item) => `${item.file.name}:${item.file.size}`),
      );

      const accepted: QueueItem[] = [];
      const rejected: string[] = [];
      let duplicates = 0;
      const stamp = Date.now();
      // Quantas miniaturas ainda cabem no orçamento, contando o que já está na fila.
      const room = Math.max(0, THUMBNAIL_BUDGET - queueRef.current.length);

      list.forEach((file, index) => {
        const signature = `${file.name}:${file.size}`;
        if (existing.has(signature)) {
          duplicates += 1;
          return;
        }

        const check = validateUpload(file.name, file.type, file.size, MAX_UPLOAD_BYTES);
        if (!check.ok) {
          rejected.push(`${file.name} — ${check.reason}`);
          return;
        }

        existing.add(signature);
        accepted.push({
          key: `${stamp}-${index}-${file.name}`,
          file,
          kind: check.kind ?? kindOf(file.name) ?? "documento",
          label: labelOf(file.name),
          progress: 0,
          state: "aguardando",
          // undefined = miniatura ainda não tentada; null = não terá miniatura.
          thumbUrl: accepted.length < room ? undefined : null,
        });
      });

      if (accepted.length > 0) {
        setQueue((current) => [...current, ...accepted]);

        const withThumbs = accepted
          .filter((item) => item.thumbUrl === undefined)
          .map((item) => item.key);
        if (withThumbs.length > 0) {
          // Sem await: a fila já aparece na tela e as miniaturas vão chegando.
          void generateThumbnails(withThumbs);
        }
      }

      const problems: string[] = [];
      if (rejected.length > 0) {
        problems.push(
          rejected.length === 1
            ? rejected[0]
            : `${rejected.length} arquivos recusados — ${rejected.slice(0, 2).join("; ")}${
                rejected.length > 2 ? "…" : ""
              }`,
        );
      }
      if (accepted.length === 0 && duplicates > 0) {
        problems.push("Esses arquivos já estão na fila.");
      }
      setError(problems.length > 0 ? problems.join(" ") : null);
    },
    [generateThumbnails],
  );

  /** Resolve (uma vez por álbum) a subpasta onde o HEIC original é guardado. */
  const ensureOriginalsFolder = useCallback(async (albumFolderId: string) => {
    const cached = originalsCache.current.get(albumFolderId);
    if (cached) return cached;

    const response = await fetch("/api/admin/originals-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumFolderId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Falha ao preparar a pasta de originais.");

    originalsCache.current.set(albumFolderId, data.folderId);
    return data.folderId as string;
  }, []);

  const processItem = useCallback(
    async (key: string, folderId: string): Promise<boolean> => {
      const item = queueRef.current.find((entry) => entry.key === key);
      if (!item) return false;

      try {
        // Vídeo e documento não passam por nenhum processamento: mostrar
        // "Convertendo…" para eles seria mentira na tela.
        patch(key, {
          state: item.kind === "imagem" ? "convertendo" : "enviando",
          progress: 0,
          error: undefined,
        });

        const prepared = await prepareUpload(item.file, {
          optimize,
          keepHeicOriginal: keepOriginals,
        });

        // Depois da conversão o HEIC virou JPEG: agora dá para ter miniatura.
        if (item.thumbUrl == null && prepared.kind === "imagem" && prepared.convertedFromHeic) {
          const url = await makeThumbnail(prepared.blob, "imagem");
          if (url) {
            if (mounted.current) {
              objectUrls.current.add(url);
              patch(key, { thumbUrl: url });
            } else {
              releaseThumbnail(url);
            }
          }
        }

        patch(key, { state: "enviando", convertedFromHeic: prepared.convertedFromHeic });

        const result = await uploadToDrive(
          prepared.blob,
          { name: prepared.name, mimeType: prepared.mimeType, folderId },
          (fraction) => patch(key, { progress: fraction }),
        );

        // O .HEIC original vai para `_originais`, fora da galeria.
        if (prepared.preserveOriginal) {
          const original = prepared.preserveOriginal;
          try {
            const originalsId = await ensureOriginalsFolder(folderId);
            await uploadToDrive(
              original,
              {
                name: original.name,
                mimeType: original.type || primaryMimeFor(original.name),
                folderId: originalsId,
              },
              () => {},
            );
          } catch (caught) {
            // A foto visível já subiu: guardar o original é um extra, não pode
            // transformar um envio bem-sucedido em erro.
            console.warn("[upload] não foi possível guardar o original", original.name, caught);
          }
        }

        patch(key, {
          state: "concluido",
          progress: 1,
          finalSize: prepared.blob.size,
          duplicate: result.duplicate,
        });
        return true;
      } catch (caught) {
        patch(key, {
          state: "erro",
          progress: 0,
          error: caught instanceof Error ? caught.message : "Falha no envio.",
        });
        return false;
      }
    },
    [ensureOriginalsFolder, keepOriginals, optimize, patch],
  );

  /** Roda um conjunto de itens com paralelismo controlado. */
  const runKeys = useCallback(
    async (keys: string[]) => {
      if (!album || keys.length === 0) return;
      if (runningRef.current) return;
      runningRef.current = true;

      setRunning(true);
      setError(null);
      setNotice(null);

      // Segunda rede de proteção contra duplicata: nunca processa a mesma
      // chave duas vezes na mesma rodada, nem um item que já concluiu.
      const pending = Array.from(new Set(keys)).filter((key) => {
        const item = queueRef.current.find((entry) => entry.key === key);
        return item !== undefined && item.state !== "concluido";
      });

      const folderId = album.folderId;
      let cursor = 0;
      // Contagem local: `queueRef` pode estar um render atrás quando o loop
      // termina, e a mensagem final precisa do número certo.
      let sent = 0;
      let failed = 0;

      const worker = async () => {
        while (cursor < pending.length) {
          const key = pending[cursor++];
          const ok = await processItem(key, folderId);
          if (ok) sent += 1;
          else failed += 1;
        }
      };

      try {
        await Promise.all(Array.from({ length: CONCURRENCY }, worker));

        // Publica na hora, sem esperar o cache de 10 minutos vencer.
        await fetch("/api/admin/revalidate", { method: "POST" }).catch(() => null);
        await Promise.all([loadAlbums(), loadFiles(folderId), loadStatus()]);

        setNotice(
          failed > 0
            ? `${sent} arquivo(s) enviado(s). ${failed} não foi(ram) enviado(s) — use “Tentar novamente”.`
            : `${sent} arquivo${sent === 1 ? "" : "s"} enviado${sent === 1 ? "" : "s"} com sucesso.`,
        );
      } finally {
        runningRef.current = false;
        setRunning(false);
      }
    },
    [album, loadAlbums, loadFiles, loadStatus, processItem],
  );

  const sendAll = () =>
    runKeys(
      queueRef.current
        .filter((item) => item.state === "aguardando" || item.state === "erro")
        .map((item) => item.key),
    );

  const retryFailed = () =>
    runKeys(queueRef.current.filter((item) => item.state === "erro").map((item) => item.key));

  const retryOne = (key: string) => runKeys([key]);

  const removeItem = (key: string) => {
    const item = queueRef.current.find((entry) => entry.key === key);
    if (item) dropThumbnail(item);
    setQueue((current) => current.filter((entry) => entry.key !== key));
  };

  const clearDone = () => {
    for (const item of queueRef.current) {
      if (item.state === "concluido") dropThumbnail(item);
    }
    setQueue((current) => current.filter((item) => item.state !== "concluido"));
  };

  const removeFile = async (file: AdminFile) => {
    if (
      !window.confirm(
        `Remover “${file.name}” do site?\n\nO arquivo vai para a lixeira do Google Drive e pode ser restaurado por lá.`,
      )
    ) {
      return;
    }
    setBusy(file.id);
    try {
      const response = await fetch(`/api/admin/photos?id=${file.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error);
      setFiles((current) => current.filter((item) => item.id !== file.id));
      await fetch("/api/admin/revalidate", { method: "POST" }).catch(() => null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao remover.");
    } finally {
      setBusy(null);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  };

  /* ------------------------------------------------------------------- render */

  const card = "gold-border rounded-xl bg-navy/40 p-6";
  const chip =
    "flex min-h-11 items-center gap-2 rounded-full border px-5 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.16em] transition-colors duration-300";

  if (!status) {
    return (
      <div className="flex items-center gap-3 py-16 text-sm text-muted">
        <Loader2 size={16} className="animate-spin text-gold" />
        Carregando o painel…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* ------------------------------------------------ configuração pendente */}
      {!status.ready && (
        <section className={`${card} flex flex-col gap-4`}>
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={17} className="text-gold" />
            <h2 className="m-0 text-lg font-bold text-white">Conecte o Google Drive</h2>
          </div>

          <ol className="m-0 flex list-decimal flex-col gap-3 pl-5 text-sm leading-relaxed text-muted">
            <li>
              No Google Cloud, crie um <b className="text-white">ID do cliente OAuth</b> (tipo
              “Aplicativo da Web”) e coloque{" "}
              <code className="text-gold">GOOGLE_CLIENT_ID</code> e{" "}
              <code className="text-gold">GOOGLE_CLIENT_SECRET</code> na Vercel.
            </li>
            <li>
              Clique em <b className="text-white">Conectar Google Drive</b> abaixo, autorize com
              a conta que vai guardar as fotos e cole o token gerado em{" "}
              <code className="text-gold">GOOGLE_REFRESH_TOKEN</code>.
            </li>
            <li>
              Crie a pasta raiz e cole o ID em{" "}
              <code className="text-gold">GOOGLE_DRIVE_ROOT_FOLDER_ID</code>.
            </li>
          </ol>

          {status.missing.length > 0 && (
            <p className="m-0 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.1em] text-[#ff9d9d]">
              FALTA: {status.missing.join(" · ")}
            </p>
          )}

          <div className="flex flex-wrap gap-2.5">
            <a
              href="/api/google/start"
              className={`${chip} border-gold bg-gradient-to-b from-gold-bright to-gold font-bold text-ink`}
            >
              <ExternalLink size={14} strokeWidth={2} /> CONECTAR GOOGLE DRIVE
            </a>
            {status.connected && !status.rootFolderId && (
              <button
                type="button"
                onClick={createRootFolder}
                disabled={busy === "root"}
                className={`${chip} border-gold/30 text-gold hover:border-gold`}
              >
                {busy === "root" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FolderPlus size={14} strokeWidth={1.8} />
                )}
                CRIAR A PASTA RAIZ
              </button>
            )}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ mensagens */}
      {notice && (
        <p className="m-0 flex items-start gap-2.5 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-[13px] leading-relaxed text-gold-bright">
          <Check size={15} className="mt-0.5 shrink-0" />
          <span className="break-all">{notice}</span>
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="m-0 flex items-start gap-2.5 rounded-lg border border-[#ff9d9d]/40 bg-[#ff9d9d]/10 px-4 py-3 text-[13px] leading-relaxed text-[#ffb4b4]"
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* ---------------------------------------------------------------- cota */}
      {status.quota && (
        <section className={`${card} flex flex-col gap-3`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-white">
              <HardDrive size={15} className="text-gold" />
              Espaço do Drive
            </span>
            <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.12em] text-muted">
              {formatBytes(status.quota.usage)}
              {status.quota.limit ? ` / ${formatBytes(status.quota.limit)}` : " usados"}
            </span>
          </div>
          {status.quota.limit && (
            <>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#101a33]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-bright transition-[width] duration-700"
                  style={{
                    width: `${Math.min(100, (status.quota.usage / status.quota.limit) * 100).toFixed(1)}%`,
                  }}
                />
              </div>
              <p className="m-0 text-[12px] leading-relaxed text-muted">
                Com a otimização ligada, cada foto ocupa cerca de 700 KB em vez de 5–8 MB.
              </p>
            </>
          )}
        </section>
      )}

      {status.ready && (
        <>
          {/* ------------------------------------------------------------ álbuns */}
          <section className={`${card} flex flex-col gap-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 text-lg font-bold text-white">Álbum de destino</h2>
              <button
                type="button"
                onClick={() => void loadAlbums()}
                aria-label="Atualizar a lista de álbuns"
                className={`${chip} border-gold/25 text-muted hover:border-gold/60 hover:text-white`}
              >
                <RefreshCw size={13} strokeWidth={1.8} /> ATUALIZAR
              </button>
            </div>

            {albums.length === 0 ? (
              <p className="m-0 text-sm text-muted">
                Nenhum álbum ainda. Crie o primeiro abaixo — cada álbum é uma pasta dentro
                da pasta raiz no seu Drive.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {albums.map((item) => (
                  <button
                    key={item.folderId}
                    type="button"
                    onClick={() => setAlbumId(item.folderId)}
                    className={`${chip} ${
                      item.folderId === albumId
                        ? "border-gold bg-gold/15 text-gold-bright"
                        : "border-gold/20 text-muted hover:border-gold/60 hover:text-white"
                    }`}
                  >
                    {item.name.toUpperCase()}
                    <span className="text-[9px] opacity-70">{item.count}</span>
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={createAlbum} className="flex flex-wrap gap-2.5">
              <input
                value={newAlbum}
                onChange={(event) => setNewAlbum(event.target.value)}
                placeholder="Nome do novo álbum (ex.: 01 - Palestras)"
                className="h-12 min-w-[240px] flex-1 rounded-full border border-gold/25 bg-ink/60 px-5 text-sm text-white outline-none transition-colors duration-300 placeholder:text-[#5b678a] focus:border-gold"
              />
              <button
                type="submit"
                disabled={newAlbum.trim().length < 2 || busy === "album"}
                className={`${chip} border-gold/40 text-gold hover:border-gold disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {busy === "album" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FolderPlus size={14} strokeWidth={1.8} />
                )}
                CRIAR ÁLBUM
              </button>
            </form>
          </section>

          {/* ------------------------------------------------------------ envio */}
          <section className={`${card} flex flex-col gap-5`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="m-0 text-lg font-bold text-white">
                Enviar arquivos{album ? ` para ${album.name}` : ""}
              </h2>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-muted">
                  <input
                    type="checkbox"
                    checked={optimize}
                    onChange={(event) => setOptimize(event.target.checked)}
                    className="h-4 w-4 accent-[#d4af37]"
                  />
                  Otimizar para a web
                </label>
                <label
                  className="flex cursor-pointer items-center gap-2.5 text-[13px] text-muted"
                  title="Além do JPEG que aparece na galeria, guarda o arquivo .HEIC original numa subpasta _originais. São dois arquivos por foto e o dobro de cota no Drive."
                >
                  <input
                    type="checkbox"
                    checked={keepOriginals}
                    onChange={(event) => setKeepOriginals(event.target.checked)}
                    className="h-4 w-4 accent-[#d4af37]"
                  />
                  Guardar HEIC original (2ª cópia)
                </label>
              </div>
            </div>

            {/* ------------------------------------------------ arraste e solte */}
            <div
              onDragEnter={(event) => {
                event.preventDefault();
                dragDepth.current += 1;
                setDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (!dragging) setDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                dragDepth.current = Math.max(0, dragDepth.current - 1);
                if (dragDepth.current === 0) setDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                dragDepth.current = 0;
                setDragging(false);
                addFiles(event.dataTransfer.files);
              }}
              className={`relative flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-all duration-300 ${
                dragging
                  ? "scale-[1.01] border-gold bg-gold/10 shadow-[0_0_60px_-20px_rgba(212,175,55,0.6)]"
                  : "border-gold/25 bg-ink/40"
              }`}
            >
              <CloudUpload
                size={32}
                strokeWidth={1.2}
                className={`text-gold transition-transform duration-300 ${
                  dragging ? "-translate-y-1 scale-110" : ""
                }`}
              />
              <p className="m-0 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.2em] text-white">
                ARRASTE SEUS ARQUIVOS AQUI
              </p>
              <p className="m-0 text-[13px] text-muted">ou clique para selecionar</p>

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT_ATTRIBUTE}
                multiple
                onChange={(event) => {
                  if (event.target.files) addFiles(event.target.files);
                  // Zera para permitir escolher o mesmo arquivo de novo.
                  event.target.value = "";
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={!album}
                className={`${chip} mt-1 border-gold/40 text-gold hover:border-gold disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {queue.length > 0 ? "ADICIONAR MAIS ARQUIVOS" : "ESCOLHER ARQUIVOS"}
              </button>

              <p className="m-0 font-[family-name:var(--font-mono)] text-[9px] tracking-[0.16em] text-[#5b678a]">
                FOTOS · VÍDEOS · DOCUMENTOS
              </p>
              <p className="m-0 max-w-[420px] text-[11px] leading-relaxed text-[#5b678a]">
                JPG · PNG · WEBP · HEIC · HEIF · MP4 · MOV · WEBM · PDF · DOC · DOCX · XLS ·
                XLSX · PPT · PPTX
              </p>

              {!album && (
                <span className="text-[12px] text-[#ffb4b4]">
                  Crie ou selecione um álbum antes de enviar.
                </span>
              )}
            </div>

            {/* ------------------------------------------------------- a fila */}
            {queue.length > 0 && (
              <div className="flex flex-col gap-4">
                {/* progresso geral */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.16em] text-muted">
                      {totals.done} / {totals.total} ARQUIVOS
                      {totals.failed > 0 && (
                        <span className="ml-2 text-[#ffb4b4]">· {totals.failed} COM ERRO</span>
                      )}
                    </span>

                    <div className="flex flex-wrap gap-2.5">
                      {totals.failed > 0 && !running && (
                        <button
                          type="button"
                          onClick={retryFailed}
                          className={`${chip} border-[#ff9d9d]/40 text-[#ffb4b4] hover:border-[#ff9d9d]`}
                        >
                          <RotateCcw size={13} strokeWidth={1.8} /> TENTAR NOVAMENTE
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={clearDone}
                        disabled={running || totals.done === 0}
                        className={`${chip} border-gold/20 text-muted hover:border-gold/60 hover:text-white disabled:opacity-40`}
                      >
                        LIMPAR CONCLUÍDAS
                      </button>
                      <button
                        type="button"
                        onClick={sendAll}
                        disabled={!album || running || totals.pending === 0}
                        className={`${chip} border-gold bg-gradient-to-b from-gold-bright to-gold font-bold text-ink disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        {running ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CloudUpload size={14} strokeWidth={2} />
                        )}
                        {running ? "ENVIANDO…" : `ENVIAR ${totals.pending}`}
                      </button>
                    </div>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#101a33]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-bright transition-[width] duration-300"
                      style={{ width: `${Math.round(totals.fraction * 100)}%` }}
                    />
                  </div>
                </div>

                {/* itens */}
                <ul className="m-0 flex max-h-[420px] list-none flex-col gap-2 overflow-y-auto p-0 pr-1">
                  {queue.map((item) => (
                    <li
                      key={item.key}
                      className={`flex items-center gap-3 rounded-lg border bg-ink/50 px-3 py-3 transition-colors duration-300 ${
                        item.state === "erro"
                          ? "border-[#ff9d9d]/35"
                          : item.state === "concluido"
                            ? "border-gold/25"
                            : "border-gold/12"
                      }`}
                    >
                      {/* miniatura ou bloco com a extensão */}
                      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gold/15 bg-navy">
                        {item.thumbUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.thumbUrl}
                            alt=""
                            aria-hidden="true"
                            className="h-full w-full object-cover"
                          />
                        ) : item.kind === "video" ? (
                          <Film size={16} strokeWidth={1.6} className="text-gold/70" />
                        ) : item.kind === "documento" ? (
                          <FileText size={16} strokeWidth={1.6} className="text-gold/70" />
                        ) : (
                          <span className="font-[family-name:var(--font-mono)] text-[8px] tracking-[0.08em] text-gold/70">
                            {item.label}
                          </span>
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-[13px] text-white">{item.file.name}</span>
                          <span className="shrink-0 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] text-muted">
                            {item.state === "concluido" && item.finalSize
                              ? `${formatBytes(item.file.size)} → ${formatBytes(item.finalSize)}`
                              : formatBytes(item.file.size)}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2 font-[family-name:var(--font-mono)] text-[9px] tracking-[0.14em] text-[#5b678a]">
                          <span className="text-gold/70">{item.label}</span>
                          <span aria-hidden="true">•</span>
                          <span
                            className={
                              item.state === "erro"
                                ? "text-[#ffb4b4]"
                                : item.state === "concluido"
                                  ? "text-gold"
                                  : ""
                            }
                          >
                            {STATE_LABEL[item.state]}
                          </span>
                          {item.duplicate && item.state === "concluido" && (
                            <>
                              <span aria-hidden="true">•</span>
                              <span className="text-gold/60">Já estava no álbum</span>
                            </>
                          )}
                          {item.convertedFromHeic && item.state === "concluido" && (
                            <>
                              <span aria-hidden="true">•</span>
                              <span className="text-gold/60">HEIC → JPG</span>
                            </>
                          )}
                        </div>

                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#101a33]">
                          <div
                            className={`h-full rounded-full transition-[width] duration-300 ${
                              item.state === "erro"
                                ? "bg-[#ff9d9d]"
                                : item.state === "convertendo"
                                  ? "animate-shimmer bg-gradient-to-r from-gold-deep via-gold-bright to-gold-deep"
                                  : "bg-gradient-to-r from-gold-deep via-gold to-gold-bright"
                            }`}
                            style={{
                              width:
                                item.state === "concluido" || item.state === "erro"
                                  ? "100%"
                                  : item.state === "convertendo"
                                    ? "100%"
                                    : `${Math.round(item.progress * 100)}%`,
                            }}
                          />
                        </div>

                        {item.error && (
                          <span className="mt-1.5 block text-[11px] leading-relaxed text-[#ffb4b4]">
                            {item.error}
                          </span>
                        )}
                      </div>

                      <span className="flex shrink-0 items-center gap-1.5">
                        {item.state === "concluido" ? (
                          <Check size={16} className="text-gold" />
                        ) : item.state === "erro" ? (
                          <button
                            type="button"
                            onClick={() => retryOne(item.key)}
                            disabled={running}
                            aria-label={`Tentar enviar ${item.file.name} novamente`}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ff9d9d]/40 text-[#ffb4b4] transition-colors hover:border-[#ff9d9d] hover:bg-[#ff9d9d]/10 disabled:opacity-40"
                          >
                            <RotateCcw size={13} strokeWidth={1.8} />
                          </button>
                        ) : item.state === "aguardando" ? (
                          <button
                            type="button"
                            aria-label={`Tirar ${item.file.name} da fila`}
                            onClick={() => removeItem(item.key)}
                            className="text-muted transition-colors hover:text-white"
                          >
                            <X size={15} />
                          </button>
                        ) : (
                          <Loader2 size={15} className="animate-spin text-gold" />
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* ------------------------------------------------ já publicado */}
          {album && (
            <section className={`${card} flex flex-col gap-4`}>
              <h2 className="m-0 text-lg font-bold text-white">
                No ar em {album.name}{" "}
                <span className="font-[family-name:var(--font-mono)] text-[11px] font-normal tracking-[0.14em] text-muted">
                  {files.length} ARQUIVO{files.length === 1 ? "" : "S"}
                </span>
              </h2>

              {files.length === 0 ? (
                <p className="m-0 text-sm text-muted">Este álbum ainda está vazio.</p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="group relative aspect-square overflow-hidden rounded-md border border-gold/12 bg-ink"
                    >
                      {file.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={file.thumbnailUrl}
                          alt={file.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full flex-col items-center justify-center gap-2 px-2 text-center">
                          {file.kind === "video" ? (
                            <Film size={20} strokeWidth={1.4} className="text-gold/70" />
                          ) : (
                            <FileText size={20} strokeWidth={1.4} className="text-gold/70" />
                          )}
                          <span className="w-full truncate font-[family-name:var(--font-mono)] text-[8px] tracking-[0.1em] text-muted">
                            {labelOf(file.name)}
                          </span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => removeFile(file)}
                        disabled={busy === file.id}
                        aria-label={`Remover ${file.name}`}
                        className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-[#ff9d9d]/50 bg-ink/80 text-[#ffb4b4] backdrop-blur-sm transition-all duration-300 hover:bg-[#ff9d9d] hover:text-ink md:opacity-0 md:group-hover:opacity-100"
                      >
                        {busy === file.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} strokeWidth={1.8} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={logout}
          className={`${chip} border-gold/20 text-muted hover:border-gold/60 hover:text-white`}
        >
          <LogOut size={14} strokeWidth={1.8} /> SAIR
        </button>
      </div>
    </div>
  );
}
