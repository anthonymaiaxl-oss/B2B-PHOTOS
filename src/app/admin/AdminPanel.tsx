"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CloudUpload,
  ExternalLink,
  FolderPlus,
  HardDrive,
  Loader2,
  LogOut,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatBytes } from "@/lib/format";
import { optimizeImage } from "@/lib/optimize-image";
import { uploadToDrive } from "@/lib/upload-client";

/** Envios simultâneos. Mais que isso e o navegador começa a enfileirar sozinho. */
const CONCURRENCY = 3;

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

type ItemState = "aguardando" | "otimizando" | "enviando" | "pronto" | "erro";

interface QueueItem {
  key: string;
  file: File;
  progress: number;
  state: ItemState;
  error?: string;
  finalSize?: number;
}

interface AdminPhoto {
  id: string;
  name: string;
  size: number;
  thumbnailUrl: string;
}

export default function AdminPanel() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status | null>(null);
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [albumId, setAlbumId] = useState("");
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [optimize, setOptimize] = useState(true);
  const [newAlbum, setNewAlbum] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const album = useMemo(
    () => albums.find((item) => item.folderId === albumId) ?? null,
    [albums, albumId],
  );
  const uploading = queue.some(
    (item) => item.state === "enviando" || item.state === "otimizando",
  );

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

  const loadPhotos = useCallback(async (folderId: string) => {
    if (!folderId) {
      setPhotos([]);
      return;
    }
    const response = await fetch(`/api/admin/photos?folderId=${folderId}`);
    if (!response.ok) return;
    const data = (await response.json()) as { photos?: AdminPhoto[] };
    setPhotos(data.photos ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      const data = await loadStatus();
      if (data?.ready) await loadAlbums();
    })();
  }, [loadStatus, loadAlbums]);

  useEffect(() => {
    void loadPhotos(albumId);
  }, [albumId, loadPhotos]);

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

  const patch = (key: string, changes: Partial<QueueItem>) =>
    setQueue((current) =>
      current.map((item) => (item.key === key ? { ...item, ...changes } : item)),
    );

  const addFiles = (files: FileList | File[]) => {
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) {
      setError("Selecione arquivos de imagem (JPG, PNG, HEIC…).");
      return;
    }
    setError(null);
    setQueue((current) => [
      ...current,
      ...images.map((file, index) => ({
        key: `${Date.now()}-${index}-${file.name}`,
        file,
        progress: 0,
        state: "aguardando" as ItemState,
      })),
    ]);
  };

  const sendAll = async () => {
    if (!album || uploading) return;
    const pending = queue.filter(
      (item) => item.state === "aguardando" || item.state === "erro",
    );
    if (pending.length === 0) return;

    setError(null);
    setNotice(null);

    let cursor = 0;
    const worker = async () => {
      while (cursor < pending.length) {
        const item = pending[cursor++];
        try {
          patch(item.key, { state: "otimizando", progress: 0, error: undefined });

          const original = {
            blob: item.file as Blob,
            name: item.file.name,
            mimeType: item.file.type,
            originalSize: item.file.size,
          };

          let prepared = original;
          if (optimize) {
            try {
              prepared = await optimizeImage(item.file);
            } catch (caught) {
              // Formato que o navegador não decodifica (HEIC do iPhone, por
              // exemplo): envia o arquivo como veio em vez de perder a foto.
              console.warn("[upload] otimização indisponível", item.file.name, caught);
            }
          }

          patch(item.key, { state: "enviando" });
          await uploadToDrive(
            prepared.blob,
            {
              name: prepared.name,
              mimeType: prepared.mimeType,
              folderId: album.folderId,
            },
            (fraction) => patch(item.key, { progress: fraction }),
          );

          patch(item.key, { state: "pronto", progress: 1, finalSize: prepared.blob.size });
        } catch (caught) {
          patch(item.key, {
            state: "erro",
            error: caught instanceof Error ? caught.message : "Falha no envio.",
          });
        }
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    // Publica na hora, sem esperar o cache de 10 minutos vencer.
    await fetch("/api/admin/revalidate", { method: "POST" }).catch(() => null);
    await Promise.all([loadAlbums(), loadPhotos(album.folderId), loadStatus()]);
    setNotice("Envio concluído. As fotos já estão no site.");
  };

  const removePhoto = async (photo: AdminPhoto) => {
    if (!window.confirm(`Remover “${photo.name}” do site?\n\nA foto vai para a lixeira do Google Drive e pode ser restaurada por lá.`)) {
      return;
    }
    setBusy(photo.id);
    try {
      const response = await fetch(`/api/admin/photos?id=${photo.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error);
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 text-lg font-bold text-white">
                Enviar fotos{album ? ` para ${album.name}` : ""}
              </h2>
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-muted">
                <input
                  type="checkbox"
                  checked={optimize}
                  onChange={(event) => setOptimize(event.target.checked)}
                  className="h-4 w-4 accent-[#d4af37]"
                />
                Otimizar para a web (recomendado)
              </label>
            </div>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                addFiles(event.dataTransfer.files);
              }}
              className={`flex flex-col items-center gap-4 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-300 ${
                dragging ? "border-gold bg-gold/10" : "border-gold/25 bg-ink/40"
              }`}
            >
              <CloudUpload size={30} strokeWidth={1.3} className="text-gold" />
              <p className="m-0 text-sm text-muted">
                Arraste as fotos aqui — ou selecione do computador.
              </p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  if (event.target.files) addFiles(event.target.files);
                  event.target.value = "";
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={!album}
                className={`${chip} border-gold/40 text-gold hover:border-gold disabled:cursor-not-allowed disabled:opacity-40`}
              >
                ESCOLHER ARQUIVOS
              </button>
              {!album && (
                <span className="text-[12px] text-[#ffb4b4]">
                  Crie ou selecione um álbum antes de enviar.
                </span>
              )}
            </div>

            {queue.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.16em] text-muted">
                    {queue.filter((item) => item.state === "pronto").length}/{queue.length}{" "}
                    ENVIADAS
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setQueue((current) =>
                          current.filter((item) => item.state !== "pronto"),
                        )
                      }
                      disabled={uploading}
                      className={`${chip} border-gold/20 text-muted hover:border-gold/60 hover:text-white disabled:opacity-40`}
                    >
                      LIMPAR CONCLUÍDAS
                    </button>
                    <button
                      type="button"
                      onClick={sendAll}
                      disabled={!album || uploading}
                      className={`${chip} border-gold bg-gradient-to-b from-gold-bright to-gold font-bold text-ink disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {uploading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CloudUpload size={14} strokeWidth={2} />
                      )}
                      {uploading ? "ENVIANDO…" : "ENVIAR TUDO"}
                    </button>
                  </div>
                </div>

                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {queue.map((item) => (
                    <li
                      key={item.key}
                      className="flex items-center gap-3 rounded-lg border border-gold/12 bg-ink/50 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-[13px] text-white">
                            {item.file.name}
                          </span>
                          <span className="shrink-0 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em] text-muted">
                            {item.state === "pronto" && item.finalSize
                              ? `${formatBytes(item.file.size)} → ${formatBytes(item.finalSize)}`
                              : formatBytes(item.file.size)}
                          </span>
                        </div>
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#101a33]">
                          <div
                            className={`h-full rounded-full transition-[width] duration-300 ${
                              item.state === "erro"
                                ? "bg-[#ff9d9d]"
                                : "bg-gradient-to-r from-gold-deep via-gold to-gold-bright"
                            }`}
                            style={{
                              width:
                                item.state === "pronto"
                                  ? "100%"
                                  : item.state === "erro"
                                    ? "100%"
                                    : `${Math.round(item.progress * 100)}%`,
                            }}
                          />
                        </div>
                        {item.error && (
                          <span className="mt-1.5 block text-[11px] text-[#ffb4b4]">
                            {item.error}
                          </span>
                        )}
                      </div>

                      <span className="shrink-0">
                        {item.state === "pronto" ? (
                          <Check size={16} className="text-gold" />
                        ) : item.state === "erro" ? (
                          <AlertTriangle size={16} className="text-[#ff9d9d]" />
                        ) : item.state === "aguardando" ? (
                          <button
                            type="button"
                            aria-label={`Tirar ${item.file.name} da fila`}
                            onClick={() =>
                              setQueue((current) =>
                                current.filter((entry) => entry.key !== item.key),
                              )
                            }
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

          {/* ------------------------------------------------ fotos já publicadas */}
          {album && (
            <section className={`${card} flex flex-col gap-4`}>
              <h2 className="m-0 text-lg font-bold text-white">
                No ar em {album.name}{" "}
                <span className="font-[family-name:var(--font-mono)] text-[11px] font-normal tracking-[0.14em] text-muted">
                  {photos.length} FOTOS
                </span>
              </h2>

              {photos.length === 0 ? (
                <p className="m-0 text-sm text-muted">Este álbum ainda está vazio.</p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-square overflow-hidden rounded-md border border-gold/12 bg-ink"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.thumbnailUrl}
                        alt={photo.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo)}
                        disabled={busy === photo.id}
                        aria-label={`Remover ${photo.name}`}
                        className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-[#ff9d9d]/50 bg-ink/80 text-[#ffb4b4] backdrop-blur-sm transition-all duration-300 hover:bg-[#ff9d9d] hover:text-ink md:opacity-0 md:group-hover:opacity-100"
                      >
                        {busy === photo.id ? (
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
