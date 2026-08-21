/**
 * Declaração local do `heic2any`.
 *
 * O pacote é UMD e publica os próprios tipos com `export =`, o que gera atrito
 * com `moduleResolution: "bundler"` + `import()` dinâmico. Declarando aqui, o
 * projeto compila do mesmo jeito independentemente da versão instalada — e o
 * `src/lib/heic.ts` continua tratando `.default` e o módulo direto, para não
 * depender de qual formato o bundler entrega em tempo de execução.
 */
declare module "heic2any" {
  interface Heic2AnyOptions {
    blob: Blob;
    /** "image/jpeg" | "image/png" | "image/gif" */
    toType?: string;
    /** 0 a 1 */
    quality?: number;
    multiple?: boolean;
    gifInterval?: number;
  }

  export default function heic2any(options: Heic2AnyOptions): Promise<Blob | Blob[]>;
}
