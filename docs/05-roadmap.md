# Roadmap

Ordem definida com a Gabriela: **site primeiro**, depois o painel. Cada fase termina com uma entrega que pode ser mostrada a ela.

| Fase | Status |
| --- | --- |
| 0. Fundação | ✅ concluída, com RLS e migrações movidos para a Fase 2 |
| 1. Landing page | ✅ publicada em 2026-10-07 |
| 2. Agenda, clientes e serviços | ⏳ próxima |
| 3. Financeiro | ⬜ |
| 4. Relatórios | ⬜ |
| 5. Futuro | ⬜ não comprometido |

## Fase 0: Fundação ✅

- ✅ Projeto no Supabase (região São Paulo) e variáveis de ambiente.
- ✅ Deploy contínuo na Vercel a partir do GitHub: cada push na `main` publica.
- ✅ Estrutura do projeto, Tailwind, lint e convenções ([06-convencoes.md](06-convencoes.md)).
- ✅ Login da Gabriela (Supabase Auth) e proxy que protege `/painel`.
- ➡️ RLS, migração inicial e carga dos serviços: movidos para a Fase 2, quando as tabelas forem criadas.

## Fase 1: Landing page ✅

Publicada em **https://studio-gabriela-probst.vercel.app**.

Entregue:
- Design system aplicado ([07-design-system.md](07-design-system.md)) e posicionamento da marca ([08-posicionamento-marca.md](08-posicionamento-marca.md)).
- Topo em tela cheia com fotos trocando, serviços e valores com agendamento por serviço, sobre e formação, galeria, contato e menu no celular.
- WhatsApp sempre visível: botão no topo, barra fixa no celular e botão flutuante no computador.
- Animações ao rolar, respeitando quem desativa animações no aparelho.
- SEO: título, descrição, dados de negócio local (JSON-LD), sitemap, robots, favicon e imagem de compartilhamento.

Ficou para depois:
- **Perguntas frequentes:** aguardando as respostas da Gabriela ([09-questionario-faq.md](09-questionario-faq.md)).
- **Preços vindos do banco (LP-07):** hoje ficam em `lib/site.ts`. Passam para o banco na Fase 2, quando existir o cadastro de serviços.
- **Domínio próprio:** opcional, decisão de custo.
- **Perfil no Google (Google Meu Negócio):** fora deste projeto, por decisão do Hygor.

## Fase 2: Agenda, clientes e serviços ⏳

- Tabelas, RLS e migrações versionadas ([04-modelo-dados.md](04-modelo-dados.md)).
- Cadastro e edição de serviços, que passam a alimentar a landing page.
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
| Plano Hobby da Vercel | Os termos restringem uso comercial | Avaliar o plano Pro ou outra hospedagem antes de crescer |
| Limites dos planos gratuitos | Supabase pausa projetos inativos | Uso diário pelo painel mantém ativo; fazer backup |
| Cadastro público no Supabase | Qualquer pessoa criaria conta pelo `/login` | Manter *Allow new users to sign up* desligado |
| Next.js 16 | Mudanças em relação ao que é conhecido | Ler a documentação em `node_modules/next/dist/docs/` antes de implementar |
| Pendências do roteiro | Respostas em aberto em [01-respostas-descoberta.md](01-respostas-descoberta.md) | Resolver antes da fase correspondente |
