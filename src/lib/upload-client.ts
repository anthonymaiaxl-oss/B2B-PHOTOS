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
    console.warn("[upload] envio direto falhou, usando o caminho reserva", error);
    await uploadViaServer(blob, options, onProgress);
    return { viaFallback: true };
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
