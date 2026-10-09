# Roadmap

Ordem definida com a Gabriela: **site primeiro**, depois o painel. Cada fase termina com uma entrega que pode ser mostrada a ela.

| Fase | Status |
| --- | --- |
| 0. Fundação | ✅ concluída, com RLS e migrações movidos para a Fase 2 |
| 1. Landing page | ✅ publicada em 2026-10-07 |
| 2. Uso diário (clientes, agenda, resumo do mês) | ⏳ em andamento: base pronta, clientes em curso |
| 3. Despesas | ⬜ |
| 4. Refinamentos | ⬜ |
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

## Fase 2: Uso diário ⏳

Reordenada em 2026-10-09 para os números chegarem cedo: a prioridade nº 2 da Gabriela é "relatórios e números", e eles dependem de atendimentos registrados.

- ✅ **2.0 Base:** tabelas, RLS e migrações ([04-modelo-dados.md](04-modelo-dados.md)), estrutura do painel e cadastro de serviços ligado à landing page.
- ⏳ **2.1 Clientes:** cadastro, busca e atalho para o WhatsApp.
- **2.2 Agenda essencial:** agenda do dia, marcar atendimento, concluir com valor e forma de pagamento, cancelar e faltou. **A Gabriela larga o papel aqui.**
- **2.3 Resumo do mês:** quanto entrou, atendimentos contra a meta de 30 e faturamento contra a meta de R$ 3.600.

## Fase 3: Despesas

- Despesas avulsas e recorrentes (aluguel, MEI, materiais).
- Resumo mensal completo: entrou, saiu, **sobrou**.

**Depende de:** a Gabriela informar os valores das despesas.

## Fase 4: Refinamentos

- Agenda semanal e remarcação.
- Mensagem de WhatsApp pronta (confirmação e lembrete).
- Histórico da cliente e aviso de clientes "sumidas".
- Melhores clientes e serviços mais vendidos.

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
