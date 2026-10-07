# Roadmap

Ordem definida com a Gabriela: **site primeiro**, depois o painel. Cada fase termina com uma entrega que pode ser mostrada a ela.

## Fase 0: Fundação

- Criar projeto no Supabase e configurar variáveis de ambiente.
- Deploy contínuo na Vercel a partir do GitHub.
- Estrutura do projeto, Tailwind, lint e convenções ([06-convencoes.md](06-convencoes.md)).
- Autenticação da Gabriela (login) e RLS.
- Migração inicial e carga dos 7 serviços.

**Entrega:** projeto no ar (página simples) com login funcionando.

## Fase 1: Landing page

- Design mobile first com a identidade do studio.
- Serviços e preços vindos do banco, fotos, endereço e botão de WhatsApp.
- SEO básico e domínio (se houver).

**Entrega:** site público para divulgar no Instagram.

**Precisa da Gabriela:** fotos, endereço, Instagram, logo e cores.

## Fase 2: Agenda, clientes e serviços

- Cadastro e edição de serviços.
- Cadastro, busca e histórico de clientes.
- Agenda diária e semanal, com criação, remarcação, cancelamento e conflito de horário.
- Mensagem de WhatsApp pronta (confirmação e lembrete).
- Aviso de clientes "sumidas".

**Entrega:** a Gabriela larga a agenda de papel.

## Fase 3: Financeiro

- Registro de pagamento ao concluir o atendimento.
- Despesas avulsas e recorrentes.
- Resumo mensal: entrou, saiu, sobrou, com a meta.

**Entrega:** o caderno deixa de ser necessário. Os valores das despesas são preenchidos depois, na medida em que ela tiver.

## Fase 4: Relatórios

- Faturamento por mês, serviços mais vendidos, melhores clientes.
- Progresso das metas.

**Entrega:** painel inicial com os números do mês.

## Fase 5: Futuro (não comprometido)

- Agendamento pelas clientes, com aprovação da Gabriela.
- Lembretes automáticos por WhatsApp (API, tem custo).
- Instalar como app no celular (PWA).
- Outros itens que surgirem com o uso.

## Dependências e riscos

| Item | Risco | Mitigação |
| --- | --- | --- |
| Conteúdo da landing page | Fotos e textos atrasam a Fase 1 | Começar com placeholders |
| Limites dos planos gratuitos | Supabase pausa projetos inativos | Uso diário pelo painel mantém ativo; fazer backup |
| Next.js 16 | Mudanças em relação ao que é conhecido | Ler a documentação em `node_modules/next/dist/docs/` antes de implementar |
| Pendências do roteiro | Respostas em aberto em [01-respostas-descoberta.md](01-respostas-descoberta.md) | Resolver antes da fase correspondente |
