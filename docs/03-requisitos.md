# Requisitos

Legenda: **MVP** = entra na primeira versão de cada módulo. **Futuro** = fora do escopo atual.

## Landing page (pública)

| ID | Requisito | Fase | Status |
| --- | --- | --- | --- |
| LP-01 | Apresentação do studio (quem é a Gabriela) | MVP | ✅ |
| LP-02 | Lista de serviços com preço e duração | MVP | ✅ |
| LP-03 | Galeria de fotos dos trabalhos | MVP | ✅ |
| LP-04 | Endereço e como chegar (link para o mapa) | MVP | ✅ |
| LP-05 | Botão de WhatsApp com mensagem inicial pronta | MVP | ✅ também por serviço |
| LP-06 | Layout responsivo, rápido, com SEO básico | MVP | ✅ |
| LP-07 | Preços da página vêm dos serviços cadastrados no painel | MVP | ⏳ Fase 2, hoje em `lib/site.ts` |
| LP-08 | Perguntas frequentes | MVP | ⏳ aguardando respostas da Gabriela |

## Autenticação

| ID | Requisito | Fase |
| --- | --- | --- |
| AU-01 | Login único da Gabriela (e-mail e senha) | MVP |
| AU-02 | Todas as telas do painel exigem login | MVP |
| AU-03 | Dados protegidos no banco (RLS), só a Gabriela lê e escreve | MVP |

## Serviços

| ID | Requisito | Fase |
| --- | --- | --- |
| SV-01 | Cadastrar, editar e desativar serviços (nome, valor, duração) | MVP |
| SV-02 | Carga inicial com os 7 serviços atuais | MVP |

## Clientes

| ID | Requisito | Fase |
| --- | --- | --- |
| CL-01 | Cadastro com nome, telefone e preferências | MVP |
| CL-02 | Busca por nome ou telefone | MVP |
| CL-03 | Histórico de atendimentos da cliente (data, serviço, valor) | MVP |
| CL-04 | Indicar clientes "sumidas" (sem atendimento há X dias) | MVP |
| CL-05 | Atalho para chamar a cliente no WhatsApp | MVP |

## Agenda

| ID | Requisito | Fase |
| --- | --- | --- |
| AG-01 | Ver a agenda por dia e por semana | MVP |
| AG-02 | Criar agendamento (cliente, serviço, data, hora) | MVP |
| AG-03 | Duração calculada pelo serviço, com horário de término | MVP |
| AG-04 | Impedir ou avisar sobre conflito de horário | MVP |
| AG-05 | Respeitar o intervalo entre atendimentos | MVP |
| AG-06 | Remarcar e cancelar | MVP |
| AG-07 | Status: agendado, concluído, cancelado, faltou | MVP |
| AG-08 | Gerar mensagem de confirmação/lembrete pronta para WhatsApp (`wa.me`) | MVP |
| AG-09 | Marcar sábado como atendimento excepcional | MVP |
| AG-10 | Agendamento feito pela própria cliente, com aprovação | Futuro |

## Financeiro

| ID | Requisito | Fase |
| --- | --- | --- |
| FN-01 | Ao concluir um atendimento, registrar valor e forma de pagamento (Pix, dinheiro, débito, crédito) | MVP |
| FN-02 | Cadastrar despesas (descrição, valor, categoria, data) | MVP |
| FN-03 | Despesas fixas recorrentes (aluguel, MEI, materiais) | MVP |
| FN-04 | Resumo mensal: entrou, saiu, sobrou | MVP |
| FN-05 | Comparar com a meta mensal (R$ 3.600) | MVP |

## Relatórios

| ID | Requisito | Fase |
| --- | --- | --- |
| RL-01 | Faturamento por mês | MVP |
| RL-02 | Serviços mais vendidos | MVP |
| RL-03 | Melhores clientes (por valor e por visitas) | MVP |
| RL-04 | Progresso da meta de atendimentos (30/mês) | MVP |

## Requisitos não funcionais

- **Mobile first:** usável com uma mão, botões grandes, telas curtas.
- **Desempenho:** landing page com carregamento rápido (boas notas no Lighthouse).
- **Custo:** apenas planos gratuitos.
- **Segurança:** senha forte, RLS no banco, nenhuma chave secreta no código.
- **Dados:** backup periódico (exportação do Supabase) e nenhum dado de clientes público.
- **Idioma:** português do Brasil, valores em R$, datas em formato dd/mm/aaaa, fuso America/Sao_Paulo.
