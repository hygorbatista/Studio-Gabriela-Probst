# Gabriela Probst · Nail Studio

Site e sistema de gestão do studio de unhas da Gabriela Probst (fibra de vidro, blindagem e gel), na Serraria, São José - SC.

- **Site no ar:** https://studio-gabriela-probst.vercel.app
- **Hoje:** landing page publicada; painel com cadastro de serviços.
- **Próximo:** painel privado com agenda, clientes e serviços. Depois, financeiro e relatórios.

## Stack

- Next.js 16 (React 19 + TypeScript), com Cache Components
- Tailwind CSS 4
- Motion (animações)
- Supabase (PostgreSQL e autenticação), região São Paulo
- Vercel (deploy automático a cada push na `main`)

## Como rodar localmente

1. Copie `.env.example` para `.env.local` e preencha com as chaves do Supabase (*Project Settings → API Keys*).
2. Rode:

```bash
npm install
npm run dev
```

3. Abra http://localhost:3000

Antes de abrir um PR, rode `npm run lint` e `npm run build`.

## Estrutura

```
app/              rotas: landing page (/), login, painel, ícones, imagem de compartilhamento, sitemap e robots
components/       componentes visuais e animações
app/painel/       painel da Gabriela (exige login)
lib/site.ts       conteúdo do site: contatos, fotos e FAQ
lib/services.ts   serviços do banco (em cache para o site)
lib/seo.ts        endereço do site e dados para o Google
lib/supabase/     conexão com o banco e tipos gerados (npm run db:types)
supabase/         migrações do banco (npx supabase db push)
proxy.ts          renova o login e protege /painel
public/images/    fotos dos trabalhos
assets/fonts/     fontes usadas para gerar as imagens
docs/             planejamento e decisões
```

**Preços e serviços** são alterados no painel (`/painel/servicos`), e o site se atualiza sozinho. **Telefone, endereço, fotos e FAQ** ficam em `lib/site.ts`.

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [00-roteiro-descoberta](docs/00-roteiro-descoberta.md) | Perguntas da entrevista com a Gabriela |
| [01-respostas-descoberta](docs/01-respostas-descoberta.md) | Respostas e decisões |
| [02-visao-produto](docs/02-visao-produto.md) | Problema, objetivos e fora de escopo |
| [03-requisitos](docs/03-requisitos.md) | Requisitos por módulo, com status |
| [04-modelo-dados](docs/04-modelo-dados.md) | Tabelas do banco e segurança |
| [05-roadmap](docs/05-roadmap.md) | Fases e o que já foi entregue |
| [06-convencoes](docs/06-convencoes.md) | Git, código e ambientes |
| [07-design-system](docs/07-design-system.md) | Cores, fontes, componentes e animações |
| [08-posicionamento-marca](docs/08-posicionamento-marca.md) | Posicionamento e voz da marca |
| [09-questionario-faq](docs/09-questionario-faq.md) | Perguntas para a seção de FAQ |
| [adr/](docs/adr/) | Registros de decisões técnicas |
