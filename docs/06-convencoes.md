# Convenções

## Git

- `main` é sempre estável e é o que vai para produção.
- Trabalho em branches curtas: `feat/agenda-semanal`, `fix/conflito-horario`, `docs/roadmap`.
- Entrega por Pull Request, mesmo trabalhando sozinho: serve de histórico e de revisão.
- Commits pequenos, no estilo Conventional Commits, em português ou inglês (escolher um e manter):
  `feat: lista de serviços na landing page`, `fix: ...`, `docs: ...`, `chore: ...`.

## Tarefas

- Cada item do [roadmap](05-roadmap.md) vira uma issue (GitHub Issues/Projects) com critério de aceite.
- Uma issue por PR sempre que possível.

## Código

- TypeScript estrito, sem `any` desnecessário.
- Antes de abrir PR: `npm run lint` e `npm run build` passando.
- Segredos só em variáveis de ambiente (`.env.local`, nunca no git). Manter um `.env.example`.
- Mudanças no banco apenas por migrações versionadas no repositório.

## Documentação

- Decisões técnicas relevantes viram um registro curto em `docs/adr/` (contexto, decisão, consequências).
- Mudou escopo ou regra de negócio: atualizar o documento correspondente na mesma PR.

## Ambientes

- **Local:** `npm run dev`.
- **Produção:** Vercel (deploy automático da `main`) e um projeto Supabase.
- Preview da Vercel em cada PR para revisar antes de entrar na `main`.
