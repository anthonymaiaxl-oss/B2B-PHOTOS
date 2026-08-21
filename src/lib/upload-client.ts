/**
 * Envio de um arquivo para o Google Drive a partir do navegador.
 *
 * Caminho principal: o servidor abre uma sessão resumível e devolve só a URL
 * dela; os bytes vão direto do navegador para o Google. Assim o token nunca
 * chega ao cliente, não existe o limite de 4,5 MB das functions da Vercel e
 * dá para mostrar progresso real.
 *
 * Caminho reserva: se essa chamada direta falhar (rede corporativa que bloqueia
 * googleapis.com, por exemplo), o arquivo sobe pela própria API do site.
 *
 * ------------------------------------------------------------------------
 * CORREÇÃO DE DUPLICAÇÃO
 *
 * Antes, QUALQUER falha do envio direto disparava o caminho reserva na hora.
 * O problema: o XHR também falha em situações em que o Google JÁ recebeu o
 * arquivo inteiro (queda de rede depois do último byte, timeout na resposta,
 * aba em segundo plano no celular). Nesses casos o reenvio criava uma segunda
 * cópia no Drive — a foto aparecia duas vezes no álbum.
 *
 * Agora, antes de reenviar, perguntamos ao Google o que ele tem da sessão:
 * um PUT com `Content-Range: bytes *\/TOTAL` e corpo vazio. É o mecanismo
 * padrão do protocolo resumível.
 *   200/201 → o arquivo está lá. Não reenvia nada.
 *   308     → incompleto. Aí sim vale o caminho reserva.
 * ------------------------------------------------------------------------
 */
export async function uploadToDrive(
  blob: Blob,
  options: { name: string; mimeType: string; folderId: string },
  onProgress: (fraction: number) => void,
): Promise<{ viaFallback: boolean }> {
  const sessionResponse = await fetch("/api/admin/upload-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: options.name,
      mimeType: options.mimeType,
      size: blob.size,
      folderId: options.folderId,
    }),
  });

  if (!sessionResponse.ok) {
    const data = await sessionResponse.json().catch(() => ({}));
    throw new Error(data.error ?? "Não foi possível iniciar o envio.");
  }

  const { uploadUrl } = (await sessionResponse.json()) as { uploadUrl: string };

  try {
    await putWithProgress(uploadUrl, blob, options.mimeType, onProgress);
    return { viaFallback: false };
  } catch (error) {
    console.warn("[upload] envio direto falhou", error);

    // Antes de reenviar: o Google chegou a guardar o arquivo?
    const status = await queryResumableStatus(uploadUrl, blob.size);
    if (status === "completo") {
      console.info("[upload] o arquivo já estava no Drive — reenvio cancelado", options.name);
      onProgress(1);
      return { viaFallback: false };
    }

    await uploadViaServer(blob, options, onProgress);
    return { viaFallback: true };
  }
}

/**
 * Pergunta ao Google quanto da sessão resumível já foi recebido.
 * Se a própria consulta falhar (rede bloqueada), devolve "desconhecido" e o
 * chamador segue para o caminho reserva — melhor uma cópia extra do que uma
 * foto perdida.
 */
async function queryResumableStatus(
  url: string,
  size: number,
): Promise<"completo" | "incompleto" | "desconhecido"> {
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Range": `bytes */${size}` },
    });

    if (response.status === 200 || response.status === 201) return "completo";
    if (response.status === 308) return "incompleto";
    // 404: a sessão expirou sem nunca ter sido concluída.
    if (response.status === 404) return "incompleto";
    return "desconhecido";
  } catch (error) {
    console.warn("[upload] não foi possível consultar a sessão", error);
    return "desconhecido";
  }
}

/** XMLHttpRequest porque `fetch` não reporta progresso de upload. */
function putWithProgress(
  url: string,
  blob: Blob,
  mimeType: string,
  onProgress: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url, true);
    request.setRequestHeader("Content-Type", mimeType);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(1);
        resolve();
      } else {
        reject(new Error(`Google respondeu ${request.status}`));
      }
    };
    request.onerror = () => reject(new Error("Falha de rede no envio direto."));
    request.ontimeout = () => reject(new Error("Tempo esgotado no envio direto."));
    request.send(blob);
  });
}

async function uploadViaServer(
  blob: Blob,
  options: { name: string; mimeType: string; folderId: string },
  onProgress: (fraction: number) => void,
): Promise<void> {
  const form = new FormData();
  form.append("file", new File([blob], options.name, { type: options.mimeType }));
  form.append("name", options.name);
  form.append("folderId", options.folderId);

  onProgress(0.15);
  const response = await fetch("/api/admin/upload", { method: "POST", body: form });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Falha no envio.");
  }
  onProgress(1);
}
