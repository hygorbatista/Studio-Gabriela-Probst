# Roadmap

Ordem definida com a Gabriela: **site primeiro**, depois o painel. Cada fase termina com uma entrega que pode ser mostrada a ela.

| Fase | Status |
| --- | --- |
| 0. Fundação | ✅ concluída, com RLS e migrações movidos para a Fase 2 |
| 1. Landing page | ✅ publicada em 2026-10-07 |
| 2. Uso diário (clientes, agenda, resumo do mês) | ✅ entregue em 2026-10-13 |
| 3. Despesas | ✅ entregue em 2026-10-14 (valores a cadastrar pela Gabriela) |
| 4. Refinamentos | ✅ entregue em 2026-10-14 |
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
- **Perguntas frequentes:** publicadas só com respostas confirmadas. Horário detalhado, remarcação e o resto aguardam o [questionário](09-questionario-faq.md).
- ✅ **Preços vindos do banco (LP-07):** entregue na Fase 2.
- **Domínio próprio:** opcional, decisão de custo.
- **Perfil no Google (Google Meu Negócio):** fora deste projeto, por decisão do Hygor.

## Fase 2: Uso diário ✅

Reordenada em 2026-10-09 para os números chegarem cedo: a prioridade nº 2 da Gabriela é "relatórios e números", e eles dependem de atendimentos registrados.

- ✅ **2.0 Base:** tabelas, RLS e migrações ([04-modelo-dados.md](04-modelo-dados.md)), estrutura do painel e cadastro de serviços ligado à landing page.
- ✅ **2.1 Clientes:** cadastro, busca, WhatsApp, aniversário e resumo calculado (gasto, favoritos).
- ✅ **2.2 Agenda essencial:** agenda do dia, marcar atendimento, concluir com valor e forma de pagamento, cancelar e faltou. **A Gabriela larga o papel aqui.**
- ✅ **2.3 Resumo do mês:** faturamento e atendimentos contra as metas (ajustáveis), comparação com o mês anterior, ticket médio, ainda agendado, por forma de pagamento e aviso de atendimentos passados sem conclusão.

## Fase 3: Despesas ✅

- ✅ Despesas fixas (aluguel, MEI), que entram em todo mês, com reajuste que não altera meses passados.
- ✅ Despesas avulsas (materiais, compras pontuais).
- ✅ Resumo mensal completo: entrou, saiu, **sobrou**.

**Falta:** a Gabriela cadastrar os valores das despesas.

## Fase 4: Refinamentos ✅

Prioridade: o que a Gabriela usa várias vezes por dia. **Facilidade de uso é o requisito principal.**

- ✅ Remarcação e busca de cliente ao agendar (2026-10-14).
- ✅ Semana de relance na agenda (2026-10-14).
- ✅ Mensagem de WhatsApp pronta (confirmação e aviso de remarcação).
- ✅ Histórico da cliente e aviso de clientes "sumidas", com convite pronto.
- ✅ Melhores clientes e serviços mais feitos no Resumo do mês.
- ✅ Planos de UI/UX e de design ([10](10-plano-ui-ux.md), [11](11-plano-design.md)), incluindo o painel instalável como app no celular (2026-10-14).
- ✅ Lançar atendimento que já aconteceu, só com o que ela lembrar (só o valor é obrigatório), e mais categorias de despesa (2026-10-24).

## Fase 5: Futuro (não comprometido)

- Agendamento pelas clientes, com aprovação da Gabriela.
- Lembretes automáticos por WhatsApp (API, tem custo).
- Outros itens que surgirem com o uso.

## Dependências e riscos

| Item | Risco | Mitigação |
| --- | --- | --- |
| Plano Hobby da Vercel | Os termos restringem uso comercial | Avaliar o plano Pro ou outra hospedagem antes de crescer |
| Limites dos planos gratuitos | Supabase pausa projetos inativos (aconteceu em 2026-10-24, depois de 9 dias sem uso; reativado pelo painel do Supabase, sem perda de dados) e o plano gratuito não guarda backups | Uso diário pelo painel mantém ativo; montar um backup próprio |
| Cadastro público no Supabase | Qualquer pessoa criaria conta pelo `/login` | Manter *Allow new users to sign up* desligado |
| Next.js 16 | Mudanças em relação ao que é conhecido | Ler a documentação em `node_modules/next/dist/docs/` antes de implementar |
| Pendências do roteiro | Respostas em aberto em [01-respostas-descoberta.md](01-respostas-descoberta.md) | Resolver antes da fase correspondente |
