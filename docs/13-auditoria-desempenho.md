# Auditoria de desempenho — painel

Data: 07/11/2026.

A auditoria identificou trabalho repetido de CPU nas interações e excesso de dados na abertura das telas. O seletor de horários é o candidato mais forte para os travamentos ao tocar em dias, horários e serviços. As consultas amplas e as dependências entre consultas são candidatas para a demora ao abrir e trocar telas.

## Execução das correções — 07/11/2026

O diagnóstico abaixo foi preservado como registro do estado anterior. Nesta etapa foram implementadas as seguintes correções:

- **P0:** formatador de dia reutilizado; índice de atendimentos por dia; disponibilidade memorizada nos seletores de agendamento/remarcação e no quadro de horários livres. Selecionar um horário ou copiar uma mensagem não recalcula toda a disponibilidade.
- **P1 — formulários:** janela inicial de 14 dias. Datas distantes usam outra janela de 14 dias, sem carregar todo o intervalo intermediário. Preferências são buscadas por cliente selecionada, com proteção para respostas atrasadas não substituírem escolhas manuais. Horários livres não consulta mais a lista de clientes.
- **P1 — agenda:** duas consultas para o dia e o resumo semanal, preservando cancelamentos e faltas. Os avisos de confirmação e retorno carregam em Suspense separado. Ao todo são cinco consultas de dados no fluxo diário (antes eram sete), das quais apenas duas são necessárias para o conteúdo principal.
- **P1 — retornos:** a consulta busca a última visita relevante e o próximo agendamento, em vez de até 400 dias de visitas por cliente. Mantém o critério anterior para atendimentos passados ainda não concluídos. Deduplicação por renderização, sem cache público de dados privados.
- **P1 — clientes:** 40 clientes por página, com no máximo a última visita e o próximo agendamento por linha. A busca na agenda também deixa de carregar visitas históricas desnecessárias.
- **P1 — ficha:** histórico com 20 atendimentos por página; cadastro, histórico e estatísticas carregam separadamente. As estatísticas consultam os campos necessários das visitas concluídas em lotes de 500 e o próximo agendamento, preservando totais e preferências de todo o histórico. A agregação desses números diretamente no banco continua sendo uma otimização futura para volumes maiores.
- **P2:** autenticação deduplicada por renderização; nomes normalizados uma vez no seletor de clientes; indicação de busca/navegação em andamento; opção de tentar novamente ao falhar a consulta de outra data. A textura, MotionProvider e o JSON-LD do negócio ficaram restritos ao site público.

Verificações concluídas nesta etapa: `npm test` (9 testes), `npm run lint`, `tsc --noEmit` e `npm run build`, todas com sucesso. O build final gerou 37 páginas. `git diff --check` também passou.

Validação automatizada: `npm test` cobre nove cenários, incluindo virada do dia em Brasília, disponibilidade e bloqueios, exclusão do próprio atendimento ao remarcar, compatibilidade do resumo de retornos, consultas paginadas e estatísticas com 501 visitas. As consultas são executadas pelo SDK real do Supabase com transporte HTTP simulado: isso verifica filtros, ordenação, paginação e tratamento dos resultados sem acessar ou alterar dados da cliente; não substitui um teste integrado no PostgREST de produção.

O experimento em [performance-audit.mjs](./performance-audit.mjs) foi atualizado para manter o comportamento anterior como comparação em memória e medir o formatador atual. Uma execução desta etapa registrou medianas de 1.976 ms antes e 21 ms depois, com resultados iguais. É um microbenchmark variável da parte de cálculo, não um tempo de abertura do aplicativo no celular.

Não houve alteração de schema, aplicação de migrações, commit ou publicação. Permanecem para validação operacional: fluxo autenticado no aparelho da cliente, latências e planos reais das consultas, região das funções/banco, dimensionamento e telemetria de campo. O seletor de cliente ainda recebe as opções cadastradas; busca remota paginada pode ser adotada se esse cadastro crescer significativamente. Índices ou cache persistente não foram adicionados sem evidência de necessidade.

## Escopo e limites

Inspeção da agenda, agendamento, horários livres, clientes, resumo, autenticação, layouts e migrações. Consulta aos guias distribuídos com a versão instalada do Next.js, incluindo Partial Prefetching e autenticação com Cache Components, e às referências de desempenho de Postgres da skill Supabase.

Foi realizado um experimento sintético com as funções reais de datas e disponibilidade. Não houve acesso ao painel autenticado em produção, ao aparelho da cliente, aos planos de execução do banco ou às métricas da Vercel. Assim, as estruturas de código abaixo estão confirmadas; sua contribuição exata para a reclamação ainda exige medição no fluxo real. Não foram alteradas regras de negócio, componentes da aplicação, banco ou configuração de produção.

## Achados priorizados

| Prioridade | Achado | Evidência | Melhoria recomendada |
| --- | --- | --- | --- |
| P0 | Formatação de datas dentro de varreduras repetidas em cada interação | `todayISO` cria um `Intl.DateTimeFormat` em cada chamada; `dayOf` chama `todayISO`; o seletor percorre os mesmos dados para cada um dos 14 dias e repete o cálculo de vagas | Reutilizar o formatador; agrupar atendimentos por dia uma vez; memorizar disponibilidade por dados, duração, intervalo e referência temporal |
| P1 | Agendamento espera dados auxiliares volumosos antes de mostrar o formulário | Carrega todas as clientes, serviços, ocupação de pelo menos 61 dias no caso comum, configurações e atendimentos concluídos do último ano | Carregar inicialmente os 14 dias visíveis e o dia selecionado; buscar outras janelas sob demanda; buscar hábitos apenas da cliente escolhida |
| P1 | Lista e busca carregam históricos completos | A lista traz até 200 clientes com todos os atendimentos relacionados; limite de clientes não limita o histórico de cada uma | Paginar clientes; retornar apenas a próxima visita e a última concluída; paginar histórico na ficha |
| P1 | Aviso de retornos processa até 400 dias de histórico para mostrar contagens | `ReturnLink` usa `getReturnList`; essa consulta também roda ao renderizar Clientes | Fazer resumo no banco ou buscar somente registros necessários; separar o aviso da área principal com Suspense; avaliar cache com escopo e invalidação adequados |
| P1 | Agenda diária consulta dados sobrepostos e aguarda dados secundários | O dia, os bloqueios e o resumo da semana consultam períodos sobrepostos; confirmação também entra no mesmo `Promise.all` | Derivar dia e semana de uma base comum preservando cancelamentos/faltas; renderizar confirmação e retornos separadamente |
| P2 | Busca por digitação depende de nova renderização do servidor e não indica progresso | Navegação com `router.replace` após 250 ms; ausência de estado de busca pendente | Usar transição e indicador acessível, preservar rolagem com `scroll: false`, reduzir dados consultados e evitar recomputar retornos em cada termo |
| P2 | Dependências do site público também chegam ao painel | Layout raiz inclui MotionProvider, textura SVG de ruído e JSON-LD que depende dos serviços públicos | Separar responsabilidades por layouts; medir bundle e pintura antes/depois de retirar essas dependências do painel |
| P2 | Autenticação é reinicializada por helper de dados | Cada helper cria cliente SSR e chama `getClaims`, além do proxy | Compartilhar cliente/verificação dentro da mesma requisição com memoização apropriada; manter autenticação nas actions; medir antes de alterar |

### 1. CPU nas interações — evidência mais forte

Referências: [todayISO e dayOf](../lib/agenda.ts), [DayTimePicker](../app/painel/agenda/day-time-picker.tsx), [FreeBoard](../app/painel/agenda/livres/free-board.tsx).

O seletor usa `itemsOf` para filtrar todo o período carregado. Cada filtro converte novamente a data de cada atendimento. O mesmo processo é chamado ao calcular os horários do dia, procurar o próximo dia com vaga e montar cada um dos 14 botões de dias. Escolher um horário altera estado e executa tudo novamente; alterar valor ou serviço no formulário pai também pode renderizar o seletor novamente.

No cenário sintético com 183 atendimentos (61 dias × 3), a sequência modelada faz 31 varreduras da agenda, ou 5.673 conversões de dia, além dos cálculos de disponibilidade. Não inclui HTML, React, hidratação ou banco. O custo cresce mesmo quando a alteração é apenas a seleção visual de um horário.

Na execução final do script, o cenário atual levou 685 / 679 / 686 ms (mediana: 685 ms). Reaproveitar apenas o formatador levou 23 / 16 / 15 ms (mediana: 16 ms), com igualdade dos resultados verificada automaticamente para todos os dias calculados. Uma execução anterior, com maior carga local, registrou medianas de 4.106 ms e 147 ms, respectivamente, evidenciando a variabilidade do ambiente. Esses números são ilustrativos e variaram com a carga local; não são latência medida em produção nem promessa de aceleração. O experimento reproduzível está em [performance-audit.mjs](./performance-audit.mjs): `node docs/performance-audit.mjs`. Ele transpila os módulos reais em memória, compara três amostras por versão e verifica a igualdade dos resultados de todos os 14 dias e do dia selecionado. A alteração experimental não modifica os arquivos da aplicação.

A correção completa deve combinar reaproveitamento do formatador, índice por dia e memoização. Validar horários na virada do dia e no fuso de Brasília, bloqueios, encaixes, duração de vários serviços e escolha de datas fora da janela inicial. Evitar memorizar o relógio indefinidamente.

### 2. Dados demais antes do formulário

Referências: [novo agendamento](../app/painel/agenda/novo/page.tsx), [getFormOptions, getBusy e getClientHabits](../app/painel/agenda/data.ts).

O formulário aguarda seis consultas de dados: clientes, serviços, atendimentos, bloqueios, configurações e histórico para hábitos. Elas são parcialmente paralelas; seis consultas não significam seis viagens sequenciais. Ainda assim, o formulário depende da mais lenta e do processamento dos hábitos.

`PRELOAD_DAYS = 60` gera 61 dias inclusivos no caso padrão. Quando a data escolhida fica muito distante de hoje, a janela cresce para incluir o intervalo inteiro até essa data mais 60 dias. O componente inicialmente mostra apenas 14 dias e já possui carregamento sob demanda para outras datas.

O quadro de horários livres também chama `getFormOptions`, que consulta clientes, embora use apenas os serviços. Separar esse helper elimina uma consulta desnecessária nesse fluxo.

### 3. Clientes e histórico

Referências: [consultas de clientes](../app/painel/clientes/data.ts), [lista](../app/painel/clientes/page.tsx), [busca na agenda](../app/painel/agenda/data.ts), [seletor de cliente](../app/painel/agenda/client-picker.tsx).

A lista carrega histórico completo apenas para produzir um contexto curto de próxima/última visita. A busca na agenda limita clientes a 20, mas também embute todos os atendimentos dessas clientes. A ficha não pagina seu histórico. O seletor local normaliza e percorre todas as clientes a cada digitação, apesar de mostrar só oito resultados.

As consultas sem paginação explícita também dependem do limite configurado na API do Supabase. Não foi verificado qual é esse limite em produção. Ao ultrapassá-lo, além de desempenho pode haver resultados incompletos. Paginar ou agregar conforme a finalidade de cada tela; não resolver apenas aumentando o limite global.

### 4. Agenda diária e retornos

Referências: [DayView](../app/painel/agenda/views/day-view.tsx), [ReturnLink](../app/painel/agenda/return-link.tsx), [getReturnList](../app/painel/agenda/data.ts).

Uma renderização diária chama cinco consultas iniciais de dados: atendimentos do dia, bloqueios do dia, atendimentos da semana, bloqueios da semana e confirmações de amanhã. Depois desse grupo, o componente filho `ReturnLink` inicia mais duas: histórico de retornos e configurações. Total: sete consultas lógicas, sem contar autenticação, cache interno ou novas renderizações.

Há uma dependência sequencial entre o grupo inicial e o aviso de retornos. Sem Suspense próprio ao redor desse aviso no DayView, a área da agenda depende também dessa consulta auxiliar para se revelar. Em Clientes, o aviso já tem Suspense separado, mas continua fazendo a consulta volumosa.

Não compartilhar diretamente os resultados atuais da semana sem ajuste: `getBusy` exclui cancelamentos e faltas que a visão diária precisa exibir. Projetar uma consulta comum preservando esses estados.

### 5. Banco: índices e infraestrutura precisam de medição

Referências: [migração inicial](../supabase/migrations/20261009120000_fase2_tabelas.sql), [pagamentos](../supabase/migrations/20261009170000_pagamentos.sql), [bloqueios](../supabase/migrations/20261027120000_bloqueios.sql).

Já existem índices para data dos atendimentos, cliente/data, data de pagamentos e bloqueios. Não há evidência para atribuir a lentidão genericamente à falta de índices.

As buscas usam `ILIKE '%termo%'`. Os índices B-tree de nome e telefone registrados nas migrações não são adequados, em geral, para acelerar busca por qualquer trecho. Avaliar trigramas ou busca por prefixo somente com volume e planos reais; tabelas pequenas podem ser rápidas sem outro índice.

Confirmar região efetiva das funções na Vercel e do banco: a documentação do projeto cita São Paulo para Supabase, mas isso não comprova a configuração implantada. Medir chamadas frias e quentes, CPU/memória do banco e duração das consultas. Não recomendar upgrade de plano sem esses dados.

`getClaims` pode validar JWT localmente ou usar rede conforme chave, sessão e renovação; a repetição no código não comprova uma chamada remota em cada uso. A oportunidade aqui é deduplicar trabalho por requisição, mantendo as garantias de autenticação. Não colocar dados autenticados em cache público para ganhar velocidade.

### 6. Navegação e acabamento

Referências: [configuração Next.js](../next.config.ts), [navegação](../app/painel/painel-nav.tsx), [busca](../app/painel/clientes/search-input.tsx), [layout raiz](../app/layout.tsx), [animações](../components/motion.tsx), [CSS](../app/globals.css).

Cache Components e Partial Prefetching já estão habilitados. Os guias desta versão distinguem o shell compartilhado do conteúdo dependente da URL e de leituras sem cache. Por isso, links e skeletons existentes não garantem que os dados da próxima tela estejam prontos antes do toque. Avaliar cache e prefetch seletivamente após reduzir o custo das consultas; não ativar prefetch completo indiscriminadamente em listas grandes.

Existem skeletons e estados pendentes em diversas ações. A melhoria recomendada é completar o retorno visual em links e busca com base nos fluxos lentos observados. Não tratar a ausência de `loading.tsx` como prova isolada de problema: já existem fronteiras Suspense nas páginas.

A textura de ruído e Motion no layout raiz são oportunidades de simplificação; seu peso real no bundle e na GPU não foi medido. O JSON-LD usa serviços em cache, então não é correto afirmar que provoca consulta remota em toda navegação.

## Ordem recomendada de execução

1. Corrigir o custo de datas, agrupar agenda por dia e reaproveitar resultados de disponibilidade. Repetir o experimento e medir toques no navegador.
2. Reduzir a janela inicial e adiar hábitos por cliente; remover a busca de clientes de Horários livres.
3. Otimizar os resumos de retornos e próxima/última visita, paginar listagens e históricos e separar avisos da agenda principal.
4. Deduplicar consultas e autenticação dentro da requisição; completar indicadores de navegação/busca; simplificar o layout do painel.
5. Ajustar índices, cache e infraestrutura somente após comparar métricas reais.

## Validação necessária após as correções

- Comparar a mesma versão de produção, aparelho e massa de dados: abrir Agenda, trocar dia, escolher cliente/serviço/horário, salvar, buscar cliente e selecionar horários para compartilhar.
- Gravar perfil de CPU e tarefas longas; medir INP de campo (meta p75 ≤ 200 ms), LCP de campo (meta p75 ≤ 2,5 s), duração das transições, bytes e chamadas por fluxo. Não confundir microbenchmark com Core Web Vitals.
- Registrar duração de cada consulta e etapa de servidor sem nomes, telefones, tokens ou outros dados pessoais.
- Analisar consultas suspeitas com EXPLAIN (ANALYZE, BUFFERS) em contexto autorizado e representativo. EXPLAIN ANALYZE executa a consulta.
- Conferir disponibilidade e consistência imediatamente após criar, editar, cancelar, concluir, reabrir, remarcar e bloquear horários, principalmente se houver cache novo.
- Verificar busca com teclado móvel, preservação de rolagem, estados pendentes e conexão lenta.

No diagnóstico inicial, os achados foram atribuídos a padrões da aplicação. Na implementação, a passagem de feedback do Next.js foi consultada conforme as instruções do projeto; nenhum feedback é enviado automaticamente.
