# Master Class Reforma Tributária — Fotos

Site das fotos oficiais do evento. A organização envia as fotos por uma área
protegida por senha; o público navega, amplia e baixa em alta — sem cadastro.

Marca do site: **B2B Conexões**. Evento da home: **Master Class Reforma Tributária**.

Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Framer Motion ·
Google Drive API (OAuth) · Vercel.

---

## Como funciona

```
/admin  →  envia as fotos  →  Google Drive (pasta privada)
                                    ↓
  público  ←  /api/photo (miniatura) e /api/download (arquivo original)
```

**As fotos ficam privadas no Drive.** O site nunca usa link público: quem busca
o arquivo no Google é o servidor, com credencial própria. Isso resolve dois
problemas de conta institucional de uma vez — a política do domínio que bloqueia
“qualquer pessoa com o link” não atrapalha, e nenhuma pasta sua fica exposta.

**Cada subpasta da pasta raiz é um álbum.** Criou a pasta, o álbum aparece.
Não existe lista de álbuns no código.

**A otimização no envio existe por causa da cota.** Ligada (padrão), a foto é
redimensionada para 2560 px e salva em JPEG 88% ainda no navegador: uma foto de
6 MB da câmera vira algo em torno de 700 KB, sem diferença visível na tela.
Desligue a opção no painel quando precisar preservar o arquivo original.

---

## 1. Instalar e rodar

```bash
npm install
```

```bash
npm run dev
```

Abra http://localhost:3000. Sem nenhuma variável configurada o site roda em
**modo demonstração** (fotos de exemplo), então dá para ver tudo funcionando
antes de tocar no Google.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | ambiente local |
| `npm run build` | build de produção (precisa passar antes do deploy) |
| `npm start` | roda o build localmente |
| `npm run lint` | checagem de lint |

---

## 2. Criar as credenciais no Google Cloud

1. Acesse https://console.cloud.google.com e crie (ou escolha) um projeto.
2. **APIs e Serviços → Biblioteca** → busque **Google Drive API** → **Ativar**.
3. **APIs e Serviços → Tela de permissão OAuth**:
   - Se a conta é institucional (Google Workspace), escolha **Interno**.
     Importante: em app *Externo* com status *Teste*, o Google expira o refresh
     token em **7 dias** e o site para de funcionar sozinho. Em app *Interno*
     isso não acontece. Se só existir a opção *Externo*, publique o app
     (**Publicar app → Em produção**) antes de continuar.
   - Preencha nome do app e e-mail de contato.
4. **Credenciais → Criar credenciais → ID do cliente OAuth**:
   - Tipo: **Aplicativo da Web**.
   - **URIs de redirecionamento autorizados** — adicione as duas:
     - `https://SEU-SITE.vercel.app/api/google/callback`
     - `http://localhost:3000/api/google/callback` (só se for testar local)
5. Guarde o **ID do cliente** e a **Chave secreta do cliente**.

> Service Account não serve aqui: em Drive pessoal/institucional sem Drive
> compartilhado ela não tem cota própria e o upload falha com
> `storageQuotaExceeded`. Por isso o site usa OAuth da sua própria conta —
> os arquivos ficam com você como dono.

---

## 3. Variáveis de ambiente na Vercel

**Settings → Environment Variables.** Primeira rodada, três valores:

| Nome | Valor |
| --- | --- |
| `ADMIN_PASSWORD` | a senha da área `/admin` (escolha uma longa) |
| `GOOGLE_CLIENT_ID` | do passo 2 |
| `GOOGLE_CLIENT_SECRET` | do passo 2 |

Faça **Redeploy**.

---

## 4. Conectar o Drive (uma única vez)

1. Abra `https://SEU-SITE.vercel.app/admin` e entre com a senha.
2. Clique em **CONECTAR GOOGLE DRIVE** e autorize com a conta que vai guardar
   as fotos.
3. A tela devolve um **refresh token**. Cole na Vercel como
   `GOOGLE_REFRESH_TOKEN` → **Redeploy**.
4. Volte ao `/admin` e clique em **CRIAR A PASTA RAIZ**. Cole o ID que aparece
   na Vercel como `GOOGLE_DRIVE_ROOT_FOLDER_ID` → **Redeploy**.

Pronto. O painel deixa de mostrar o aviso de configuração.

> Se preferir usar uma pasta que já existe no seu Drive, pegue o ID na URL dela
> — `drive.google.com/drive/folders/`**`ESTE-PEDAÇO`** — em vez de criar uma nova.
> Funciona também com pasta dentro de Drive compartilhado.

---

## 5. Uso no dia a dia

No `/admin`:

1. **Criar álbum** — vira uma subpasta no Drive. Prefixo numérico controla a
   ordem: `01 - Palestras`, `02 - Networking`. O site mostra “Palestras”,
   sem o número.
2. **Enviar fotos** — arraste para a área tracejada e clique em **ENVIAR TUDO**.
   A barra mostra o progresso real de cada arquivo.
3. As fotos aparecem no site **na hora** (o painel limpa o cache sozinho ao
   terminar o envio).
4. **Remover** uma foto manda ela para a lixeira do Drive — dá para restaurar
   por lá em até 30 dias.

A barra de espaço no topo do painel mostra quanto do seu Drive já foi usado.

> **HEIC (iPhone):** o navegador não sabe abrir esse formato, então a otimização
> é pulada e o arquivo sobe como veio — e o site não consegue exibir a miniatura.
> Converta para JPG antes de enviar (no iPhone: Ajustes → Câmera → Formatos →
> *Mais compatível*).

### O que o público vê

- Home com o selo do evento, os capítulos e os álbuns.
- Página do álbum: grade, ampliar, **baixar uma foto** ou **SELECIONAR VÁRIAS →
  BAIXAR .ZIP** (até 60 por pacote; o zip é montado no próprio navegador).

---

## 6. Personalizar o conteúdo

Tudo em **`src/config/event.ts`**: nome do evento, data, local, textos do hero,
os quatro capítulos, os realizadores e as legendas dos álbuns.

- `date` e `location` vazios simplesmente não aparecem no site.
- `albumCaptions` liga o slug do álbum a uma legenda (`palestras` →
  “Palco principal”). Álbum sem legenda funciona igual.
- `sealImage`: para usar a arte circular original em vez do selo desenhado em
  SVG, coloque o arquivo em `public/selo.png` e troque para `"/selo.png"`.

---

## Arquitetura

```
src/
├── app/
│   ├── layout.tsx              fontes, preloader, cursor, SEO/OG
│   ├── page.tsx                home
│   ├── album/[slug]/           galeria do álbum
│   ├── admin/                  login + painel de envio
│   └── api/
│       ├── photo/[id]          miniatura redimensionada (sharp) + cache de 1 ano
│       ├── download/[id]       arquivo original com Content-Disposition
│       ├── admin/*             login, álbuns, envio, exclusão, cota, revalidação
│       └── google/*            fluxo OAuth para gerar o refresh token
├── components/                 Hero, EventSeal, PartnerRow, AlbumCard, PhotoGrid,
│                               PhotoLightbox, ScrollStory, StatsSection, …
├── config/event.ts             única fonte de conteúdo
├── lib/
│   ├── google-auth.ts          refresh token → access token (com cache)
│   ├── drive.ts                listar, enviar, apagar, cota
│   ├── admin-auth.ts           cookie de sessão assinado (HMAC)
│   ├── upload-client.ts        envio resumível direto do navegador
│   ├── optimize-image.ts       redimensiona antes de enviar
│   └── download.ts             download individual e .zip
└── types/
```

### Decisões

- **Envio resumível direto para o Google.** O servidor abre a sessão e devolve
  só a URL dela; os bytes vão do navegador para o Google. O token nunca chega ao
  cliente, o limite de 4,5 MB das functions da Vercel não se aplica e o
  progresso é real. Se essa chamada direta falhar (rede que bloqueia
  `googleapis.com`), o arquivo sobe pelo servidor automaticamente.
- **Miniaturas pelo próprio site.** `/api/photo/[id]` redimensiona com `sharp` e
  responde com cache de um ano e `immutable`, então o CDN da Vercel serve as
  visitas seguintes sem tocar no Drive.
- **Sessão do `/admin`** é um cookie `httpOnly` assinado com HMAC, válido por
  12 horas. A senha é comparada em tempo constante.
- **Acessibilidade**: `prefers-reduced-motion` desliga as animações, foco
  visível, `aria-label` nos controles, alvos de toque ≥ 44 px.
- **Mobile primeiro**: sem rolagem horizontal em 360/375/412 px; no celular o
  botão de baixar fica sempre visível (não existe hover no toque).

### Custo e limites

- O tráfego das fotos passa pela Vercel. No plano Hobby são 100 GB/mês; com a
  otimização ligada e o cache do CDN, um evento normal fica bem abaixo disso.
- O espaço ocupado é o do seu Google Drive — acompanhe pela barra no `/admin`.

Digital Experience by Gabriel Maia.
