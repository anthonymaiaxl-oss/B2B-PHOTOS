# B2B CONEXÕES — Fotos oficiais

Site das fotos da **Master Class Reforma Tributária**. Já está em produção:
https://b2-b-photos-ytr6.vercel.app · repo `anthonymaiaxl-oss/B2B-PHOTOS`

> **Contexto de handoff.** Este arquivo foi escrito por outra sessão do Claude
> que trabalhou no projeto sem conseguir rodar `npm install` nem `next build`
> (registro npm bloqueado naquele ambiente). Tudo aqui foi validado por
> checagem de sintaxe, `tsc --strict` parcial e renderização em Chromium —
> **nunca por um build real**. A primeira coisa útil a fazer é buildar.

---

## 1. O essencial da arquitetura

Next.js 15 (App Router) · React 19 · Tailwind v4 · framer-motion · sharp · jszip

**Não existe banco de dados. O Google Drive É o banco.**

```
GOOGLE_DRIVE_ROOT_FOLDER_ID
└── subpasta  = um álbum          (listAlbums)
    ├── arquivos de imagem = as fotos   (listFolderImages → galeria pública)
    └── _originais/  = HEIC originais preservados (invisível no site)
```

- Slug do álbum vem do nome da pasta (`src/lib/slug.ts`). Criar pasta no Drive
  já cria álbum no site, sem deploy.
- Fotos nunca são públicas no Drive. `/api/photo/[id]` autentica no servidor,
  redimensiona com sharp e serve WebP. É o que permite a pasta ficar privada.
- Autenticação do `/admin`: cookie HMAC, sem sessão em banco (`src/lib/admin-auth.ts`).

**Fluxo de upload** (o ponto mais delicado do projeto):

```
navegador → prepareUpload (HEIC→JPEG, otimização)
         → POST /api/admin/upload-session   ← checa duplicata no Drive
         → PUT direto no Google (bytes não passam pela Vercel)
         → se falhar: POST /api/admin/upload ← checa duplicata de novo
```

### Variáveis de ambiente (Vercel)
`ADMIN_PASSWORD` · `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` ·
`GOOGLE_REFRESH_TOKEN` · `GOOGLE_DRIVE_ROOT_FOLDER_ID` ·
`NEXT_PUBLIC_SITE_URL` (opcional) · `ADMIN_SESSION_SECRET` (opcional)

Nunca foram alteradas. Ver `.env.example`.

---

## 2. Regras que não podem ser quebradas

O briefing original é explícito: **o projeto já funciona, não recriar.**

- Não trocar o Google Drive por outro armazenamento
- Não mexer em autenticação, rotas existentes, variáveis de ambiente
- Não alterar a estrutura de pastas do Drive
- `listFolderImages` serve a galeria **pública** — mexer nela afeta visitante.
  O painel usa `listFolderFiles` (que inclui vídeo/documento). São propositalmente
  funções diferentes.
- `REVALIDATE_SECONDS` (600) está duplicado como literal `600` em
  `src/app/page.tsx` e `src/app/album/[slug]/page.tsx` — o Next exige literal no
  export `revalidate`. Mudar um exige mudar os três.

---

## 3. Bugs já resolvidos — e por quê (não repetir)

### Duplicação no upload (12 fotos viravam 24)
**Causa raiz:** o PUT direto chega ao Google, mas a resposta se perde (rede
oscila, aba dorme no celular). O XHR não distingue "falhou" de "deu certo e eu
não soube" e reporta erro → o caminho reserva subia o arquivo de novo.

Três tentativas de correção **no navegador falharam** (trava de clique síncrona,
deduplicação de fila, consulta de status da sessão resumível). O que resolveu foi
perguntar à fonte da verdade:

`findDuplicateInFolder(folderId, nome, tamanho)` em `src/lib/drive.ts`, chamada
pelas **duas** rotas de escrita antes de gravar qualquer byte. Compara nome **e**
tamanho — só nome bloquearia duas fotos diferentes chamadas `IMG_0001.jpg`.

> Lição: qualquer proteção contra duplicata precisa estar no servidor. O cliente
> não tem como saber o que o Drive tem.

### HEIC do iPhone virava foto quebrada na galeria
`sharp` usa libvips pré-compilado **sem decodificador HEIF**. Um `.heic` no álbum
entra na listagem (MIME começa com `image/`) mas nem sharp nem navegador exibem.

Conversão é feita no navegador (`src/lib/heic.ts`): `createImageBitmap` nativo
primeiro (Safari/iOS convertem de graça), `heic2any` (wasm, import dinâmico) como
reserva. Se os dois falharem, o arquivo vira ERRO — **de propósito**, para não
publicar foto quebrada.

### Frase cortada no selo (EventSeal.tsx)
A faixa de texto circular corre no raio 122 e, com o corpo da fonte, ocupa a coroa
entre os raios ~113 e ~124. **Todo conteúdo central precisa caber em r=110**, não
nos 156 da borda.

Regra para mexer no selo: um texto de largura L na altura y só cabe se
`L/2 ≤ √(110² − (y−160)²)`. Não existe "rodapé" dentro do selo.

Também tinha um degradê `objectBoundingBox` em traços de bbox zero (linha reta) —
não renderiza, a balança aparecia como dois triângulos soltos. Por isso existe
`seal-gold-abs` com `gradientUnits="userSpaceOnUse"`.

### Títulos CONHECIMENTO e NETWORKING cortados
Estavam numa coluna de ~460px; "CONHECIMENTO" em ExtraBold a 72px mede ~570px.
Agora o título ocupa largura total e texto+imagem ficam numa linha abaixo.
Verificado de 320px a 1920px com fonte mais larga que a Montserrat (pior caso).

### Seções sem qualidade
Usavam `photo.thumbnailUrl`, fixo em 900px, esticado para a largura do bloco e
ainda ampliado 12% pelo parallax. Agora `ParallaxImage` e o Hero emitem `srcSet`
(600/900/1400/2000/2600) — ver `src/lib/photo-src.ts`.

### Vídeo era recusado no envio
Duas causas somadas, ambas em `src/config/uploads.ts`:

1. **MIME exato demais.** A lista aceitava só `video/quicktime` para `.mov`,
   mas o mesmo arquivo sai como `video/mp4` em parte dos Androids e
   `video/x-m4v` em outros. O usuário via "o conteúdo do arquivo não
   corresponde à extensão" e não tinha o que fazer.
   Agora vale a **família** (`video/*`), além da lista exata. Continua sendo
   checagem real: um `.mov` que se declara `application/x-msdownload` é
   recusado. `application/octet-stream` conta como "não informado".

2. **Teto de 200 MB.** Era herança de quando só entrava foto. Um clipe de
   2 min em 4K passa de 300 MB. Vídeo agora tem `MAX_VIDEO_BYTES` = 2 GB;
   foto e documento seguem em 200 MB. Dá para subir porque o vídeo vai direto
   do navegador para o Google — a Vercel não vê esses bytes.

> Pendente: o envio é um `PUT` único, sem divisão em partes. Um arquivo de
> 1 GB numa conexão instável falha inteiro e recomeça do zero. Se vídeo grande
> virar rotina, implementar upload em blocos (o protocolo resumível do Drive
> já suporta; falta usar `Content-Range` por pedaço).

### Armadilha de CSS que custou uma rodada
Um valor de cor inválido (`#1b3straight`, typo) derruba a declaração `background`
**inteira**, não só aquela camada. O fundo ficou preto e demorou a achar.
Sempre renderizar e olhar.

---

## 4. Como imagens de seção funcionam

`sectionImages` em `src/config/event.ts`. Cada campo (hero, os 4 capítulos, cta)
aceita três formas:

| valor | efeito |
|---|---|
| `"IMG_1024.jpg"` | usa uma foto **real do álbum**, em alta. Melhor opção. |
| `"/secoes/hero.jpg"` | arquivo fixo em `public/secoes/` |
| `""` | automático: o site escolhe uma foto do álbum |

Resolução por nome acontece em `src/app/page.tsx` (server component, já tem os
álbuns) via `src/lib/section-photo.ts`. Nome inexistente cai no automático.

Hoje aponta para os fundos gráficos em `public/secoes/` — composições abstratas
(feixes de luz, arcos, malha de nós, curva ascendente, bokeh, horizonte), **não
fotografias**. Foram feitas assim de propósito: num site cujo objetivo é
"encontre a sua foto do evento", imagem que possa ser confundida com registro do
dia é problema.

> Hero e CTA nascem com contraste bem mais alto que o resto — o site os aplica a
> **34% de opacidade** sob gradiente escuro. Calibrar sempre olhando o resultado
> montado, nunca a imagem isolada.

---

## 5. Pendências

- [ ] **Link da Simbionte** — `credit.url` em `src/config/event.ts` está `""`.
      O rodapé mostra o nome sem link enquanto isso. Luiz mencionou Instagram.
- [ ] **Apagar `b2bconexoesredesign.patch`** da raiz do repo — subiu por engano.
- [ ] Trocar os fundos gráficos por fotos reais quando forem escolhidas.

---

## 6. Testes antes do evento

Nunca rodei o projeto. Prioridade por risco:

**Upload** (é o que mais mudou e o que vai ser usado)
1. 3 fotos → conferir **3**, não 6, no Drive e na galeria
2. 1 HEIC de iPhone → tem que virar JPG e aparecer
3. reenviar as mesmas 3 → deve dizer "Já estava no álbum"
4. lote de 30+ → navegador não pode travar

**Visitante**
5. abrir álbum, ampliar, baixar uma foto
6. selecionar várias → baixar .zip
7. tudo isso no celular

**Painel**
8. login, criar álbum, apagar foto
9. home no celular: títulos inteiros, sem scroll horizontal

---

## 7. Estado do repositório

A `main` recebeu as alterações por upload manual pela interface do GitHub
(a sessão anterior não tinha permissão de push). Conferir se `public/secoes/*.jpg`,
`src/lib/photo-src.ts` e `src/lib/section-photo.ts` existem — se não existirem,
a main está atrás e falta aplicar a última entrega.

```bash
npm install     # heic2any é dependência nova
npm run dev
npm run build   # nunca foi executado pela sessão anterior
```
