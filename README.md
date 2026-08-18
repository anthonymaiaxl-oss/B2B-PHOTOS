# Conexões B2B — Digital Experience

Plataforma web das fotos do evento **Conexões B2B**. As fotos vivem no Google Drive; o site lê as pastas em modo somente leitura. Sem banco de dados, sem login, sem painel administrativo.

Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Framer Motion · Lucide · Google Drive API · Vercel.

---

## 1. Instalação

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3000. Sem `GOOGLE_DRIVE_API_KEY` o site roda com **dados de desenvolvimento** (12+ fotos por álbum), então dá para ver a experiência completa antes de configurar o Drive.

## 2. Desenvolvimento

| Comando | O que faz |
| --- | --- |
| `npm run dev` | ambiente local |
| `npm run build` | build de produção (precisa passar sem erros antes do deploy) |
| `npm start` | roda o build localmente |
| `npm run lint` | checagem de lint |

## 3. Google Cloud

1. Acesse https://console.cloud.google.com e crie um projeto (ex.: `conexoes-b2b`).
2. Menu **APIs e Serviços → Biblioteca**.

## 4. Habilitar a Drive API

1. Busque **Google Drive API**.
2. Clique em **Ativar**.

## 5. Criar a API Key

1. **APIs e Serviços → Credenciais → Criar credenciais → Chave de API**.
2. Copie a chave e clique em **Restringir chave**:
   - **Restrições de API**: somente *Google Drive API*.
   - **Restrições de aplicativo**: nenhuma (a chave é usada no servidor).
3. Coloque em `.env.local`:

```bash
GOOGLE_DRIVE_API_KEY=sua_chave_aqui
NEXT_PUBLIC_USE_MOCK=false
```

A chave **nunca** vai para o código nem para o repositório.

## 6. Folder IDs

No Drive, monte a estrutura:

```
CONEXÕES B2B 2026
├── 01 - PALESTRAS
├── 02 - NETWORKING
├── 03 - PARTICIPANTES
├── 04 - MOMENTOS ESPECIAIS
└── 05 - BASTIDORES
```

Para cada pasta:

1. Botão direito → **Compartilhar** → *Qualquer pessoa com o link* → **Leitor**. (Obrigatório: a API Key só lê o que é público.)
2. Abra a pasta e copie o ID da URL:
   `https://drive.google.com/drive/folders/`**`1AbC...xyz`** ← este é o `folderId`.

## 7. Configuração do evento

Tudo fica em **`src/config/event.ts`**: nome, data, local, textos do hero, números da seção de estatísticas, capítulos do storytelling e os álbuns:

```ts
albums: [
  { id: "palestras", name: "Palestras", caption: "Palco principal", folderId: "1AbC...xyz" },
]
```

O `id` vira a URL (`/album/palestras`). Nenhum outro arquivo precisa ser editado.

## 8. Deploy na Vercel

1. Suba o repositório no GitHub.
2. Em https://vercel.com → **Add New → Project** → importe o repo.
3. Em **Environment Variables**, adicione `GOOGLE_DRIVE_API_KEY` e `NEXT_PUBLIC_SITE_URL`.
4. **Deploy**. Gere o QR Code apontando para a URL final.

## 9. Gerenciamento das fotos

```
Google Drive → abrir a pasta do álbum → arrastar as fotos → pronto
```

O site revalida o cache a cada **10 minutos**, então fotos novas aparecem em poucos minutos sem tocar em código nem refazer deploy. Isso também mantém o consumo da API baixo.

Para mudar esse intervalo é preciso alterar **três** lugares, porque o Next não aceita constante importada no export `revalidate` de uma rota: `REVALIDATE_SECONDS` em `src/config/event.ts` (usado no fetch do Drive) e o literal `600` em `src/app/page.tsx` e `src/app/album/[slug]/page.tsx`.

Para forçar atualização imediata: na Vercel, **Deployments → ⋯ → Redeploy**.

---

## Arquitetura

```
src/
├── app/
│   ├── layout.tsx          preloader, cursor, fontes, SEO/OG
│   ├── page.tsx            home (hero → story → números → álbuns → destaques → CTA)
│   ├── album/[slug]/       galeria do álbum (grid + carregar mais + lightbox)
│   └── not-found.tsx
├── components/             Hero, ScrollStory, AlbumCard, AlbumGrid, PhotoGrid,
│                           PhotoCard, PhotoLightbox, AnimatedCounter, ParallaxImage,
│                           CustomCursor, Header, Footer, Preloader, CTASection, Reveal
├── config/event.ts         única fonte de configuração
├── lib/google-drive.ts     leitura do Drive + cache/revalidação
├── lib/mock-data.ts        dados de desenvolvimento
└── types/
```

### Decisões

- **Performance primeiro**: `next/image` com thumbnails do Drive, lazy loading, paginação de 24 fotos, parallax por transform (sem layout thrash).
- **Acessibilidade**: `prefers-reduced-motion` desliga as animações, foco visível, `aria-label` nos controles, alvos de toque ≥ 44px.
- **Erros**: álbum vazio mostra mensagem; foto que falha mostra fallback; Drive fora do ar não quebra a página.
- **Mobile é prioridade**: composição vertical própria, sem overflow horizontal em 360/390/412px.

Digital Experience by Gabriel Maia.
