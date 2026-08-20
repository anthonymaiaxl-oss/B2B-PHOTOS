import { getFileStream } from "@/lib/drive";
import { isDriveConfigured } from "@/lib/google-auth";

// sharp precisa do runtime Node.
export const runtime = "nodejs";
export const maxDuration = 30;

/** Larguras permitidas — fixas para não explodir o cache do CDN. */
const WIDTHS = [400, 600, 900, 1400, 2000, 2600];
const YEAR = 60 * 60 * 24 * 365;

function pickWidth(raw: string | null): number {
  const wanted = Number(raw) || 900;
  return WIDTHS.find((w) => w >= wanted) ?? WIDTHS[WIDTHS.length - 1];
}

/**
 * Serve a foto do Drive pelo próprio site.
 *
 * Por que não usar o link público do Drive: em conta institucional o
 * compartilhamento externo costuma estar bloqueado por política do domínio.
 * Aqui a autenticação acontece no servidor, então a pasta pode continuar
 * 100% privada e mesmo assim as fotos aparecem para o público.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!isDriveConfigured()) {
    return new Response("Google Drive não configurado.", { status: 503 });
  }
  if (!/^[A-Za-z0-9_-]{10,}$/.test(id)) {
    return new Response("Id inválido.", { status: 400 });
  }

  const width = pickWidth(new URL(request.url).searchParams.get("w"));

  let upstream: Response;
  try {
    upstream = await getFileStream(id);
  } catch (error) {
    console.error("[photo] falha ao buscar", id, error);
    return new Response("Falha ao acessar o Drive.", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response("Foto não encontrada.", { status: upstream.status === 404 ? 404 : 502 });
  }

  const original = Buffer.from(await upstream.arrayBuffer());

  try {
    const sharp = (await import("sharp")).default;
    const output = await sharp(original)
      .rotate() // respeita a orientação EXIF
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    return new Response(new Uint8Array(output), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(output.length),
        "Cache-Control": `public, max-age=${YEAR}, s-maxage=${YEAR}, immutable`,
      },
    });
  } catch (error) {
    // Sem sharp (ou formato que ele não abre): devolve o original.
    console.error("[photo] redimensionamento indisponível, servindo original", error);
    return new Response(new Uint8Array(original), {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": `public, max-age=${YEAR}, s-maxage=${YEAR}, immutable`,
      },
    });
  }
}
