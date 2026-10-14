# Plano de design do painel

Criado em 2026-10-14. Objetivo: deixar o painel **bonito e agradável de abrir todo dia**, com a mesma personalidade da landing page, sem perder a facilidade de uso (o requisito principal).

Complementa o [plano de UI/UX](10-plano-ui-ux.md): aquele cuida de *como funciona*, este de *como parece*.

## Princípios

1. **Mesma marca da landing page:** preto, branco e bordô, cantos retos, Playfair nos títulos. O painel é o "lado funcional" do mesmo [design system](07-design-system.md), não um sistema genérico.
2. **Hierarquia antes de enfeite:** em cada tela, uma coisa principal em destaque (o próximo atendimento, quanto sobrou, o nome da cliente). O resto fica mais calmo.
3. **Cor com significado:** o bordô continua sendo "esmalte", usado pouco. Cada cor de status quer dizer sempre a mesma coisa.
4. **Bonito não pode atrapalhar:** texto com 16 px ou mais, contraste AA, botões de 44 px ou mais. Nenhuma decoração entra se dificultar a leitura no celular.
5. **Movimento discreto:** entradas suaves e curtas, desligadas em "reduzir movimento".

## Diagnóstico

| O que se vê hoje | Onde | Efeito |
| --- | --- | --- |
| Quase tudo é linha fina + rótulo cinza em maiúsculas | Todas as telas | Parece planilha; nada chama o olho |
| Fundo `#FAFAFA` e cartões `#FFFFFF` quase iguais | Todas as telas | Os cartões "somem", tela sem profundidade |
| Cabeçalho só com o nome e "Sair" | Topo | Frio; não diz em que dia ou tela ela está |
| Aba ativa só muda a cor do texto | Barra de baixo | Difícil ver onde está |
| Dia selecionado é um bloco bordô cheio | Faixa da semana | Pesado; o bordô vira fundo grande, contra a regra da marca |
| Atendimentos são linhas iguais, separadas por traço | Agenda | Difícil bater o olho e achar o próximo |
| Status em etiqueta pequena, maiúscula e espaçada | Agenda, ficha | Pouco legível; "Agendado" e "Concluído" se parecem |
| "Quanto sobrou" tem o mesmo peso dos outros cartões | Resumo | O número mais importante do mês não se destaca |
| Barra de progresso fina e cinza | Resumo | Meta parece pouco importante |
| Ficha da cliente: 8 caixas iguais | Clientes | Tudo com o mesmo peso; nada se lê primeiro |
| Lista de clientes só com nome | Clientes | Sem rosto, monótona |
| Telas vazias com uma frase cinza | Várias | Parece que falta algo |
| Formulários longos sem agrupamento | Cliente, serviço, despesa | Cansativo de preencher |

## Etapas

### Etapa 1: fundação visual ✅

Entregue em 2026-10-14, junto com a etapa 2, depois da aprovação do protótipo. As cores novas valem só no painel e no login (classe `.painel-theme`): a landing page não muda. Os estilos de rótulo e cartão ficam em `app/painel/styles.ts`. O fundo `primary-soft` e a cor de "Concluído" já estão em uso; a bolinha de status (3.3) vem na etapa 3.

Ajustes nos tokens de `app/globals.css`. Mudam o sistema inteiro de uma vez, sem mexer em tela por tela.

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 1.1 Fundo alabastro | Fundo levemente quente (por exemplo `#F6F4F1`) e cartões brancos: os cartões passam a se destacar | P |
| 1.2 Bordô claro | Novo token `primary-soft` (bordô a ~6%, por exemplo `#F7ECEE`) para fundos de destaque pequenos: dia selecionado, aba ativa, aviso | P |
| 1.3 Cores de status | Tokens próprios: agendado (bordô), concluído (verde-oliva escuro, que combina com a paleta), falta (vermelho), cancelado (cinza) | P |
| 1.4 Números | Números com largura fixa (`tabular-nums`) e valores grandes em Playfair: horários e valores alinham na coluna | P |
| 1.5 Sombra única | Uma sombra bem suave para cartões em destaque e janelas, como já prevê o design system | P |
| 1.6 Rótulos | Menos maiúsculas espaçadas: só em títulos de seção. Rótulos de dados passam a ser texto normal, cinza, 14 px | P |

### Etapa 2: cabeçalho e navegação ✅

"Sair" ficou com ícone **e** palavra: ícone sozinho seria mais difícil de achar.

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 2.1 Cabeçalho com monograma | "G" em Playfair num quadrado preto (o mesmo do ícone do app) + "Gabriela Probst". "Sair" vira ícone discreto | P |
| 2.2 Aba ativa clara | Traço bordô em cima da aba, ícone mais forte e fundo `primary-soft` | P |
| 2.3 Títulos de tela | Padrão único: título em Playfair, uma linha de apoio embaixo ("12 clientes", "outubro de 2026") e a ação principal à direita | P |

### Etapa 3: agenda ✅

A tela que ela mais abre. Prioridade de beleza.

Entregue em 2026-10-14, junto com os itens 3.1 e 3.2 do plano de UI/UX. Ajustes em relação ao protótipo:
- Com mais de 3 atendimentos no dia, a faixa da semana mostra o número no lugar das bolinhas, para não esconder a quantidade.
- O atendimento em andamento ganha a etiqueta "Em atendimento", para não repetir a palavra da linha "Agora".
- O atendimento que passou sem conclusão mostra "Não concluído". Isso vale também em dias passados.
- O botão "Concluir atendimento", na tela do atendimento, também ficou verde-oliva.
- A lógica fica em `lib/agenda-now.ts`.

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 3.1 Faixa da semana leve | Dia selecionado com borda preta e fundo branco; hoje com um ponto bordô; quantidade de atendimentos em bolinhas (até 3) no lugar do número | P |
| 3.2 Cartão de atendimento | Cada atendimento vira um cartão branco com uma barra fina na cor do status à esquerda; horário grande à esquerda, cliente e serviço à direita | M |
| 3.3 Status com bolinha | Etiqueta trocada por bolinha colorida + palavra em texto normal ("● Agendado"). As bolinhas são a exceção redonda já prevista no design system | P |
| 3.4 Resumo do dia | Linha de topo vira um bloco: "4 atendimentos · R$ 380 previstos" com o botão Agendar | P |
| 3.5 Dia vazio bonito | Ícone fino + "Dia livre" + botão Agendar, centralizados | P |

O "agora" e o "Concluir pela agenda" (etapa 3 do plano de UI/UX) entram nesse mesmo cartão novo.

### Etapa 4: resumo do mês ✅

Entregue em 2026-10-14. Detalhes que não estavam no protótipo:
- Quando a meta é batida, a barra fica verde-oliva e aparece o selo "Meta batida!".
- Se sair mais do que entrou, o cartão escuro mostra o aviso "Saiu mais do que entrou".
- A queda em relação ao mês anterior aparece em preto, não em vermelho, para não assustar.
- "Ticket médio" continua com esse nome até a revisão de textos (item 4.1 do plano de UI/UX).

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 4.1 "Quanto sobrou" em destaque | Cartão escuro (preto ou bordô escuro, como a seção de contato da landing), número grande em Playfair branco, "Entrou" e "Saiu" embaixo | P |
| 4.2 Metas com barra forte | Barra mais grossa em bordô, com a marca de 100%; meta batida ganha um selo | P |
| 4.3 Formas de pagamento em barras | Cada forma com uma barra horizontal proporcional ao valor (Pix, dinheiro, cartão) | P |
| 4.4 Rankings com posição | 1º, 2º e 3º com o número em Playfair; a 1ª cliente com destaque leve | P |

### Etapa 5: clientes

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 5.1 Iniciais | Quadradinho com as iniciais da cliente (cor neutra, varia de tom pelo nome) na lista e na ficha | P |
| 5.2 Lista com contexto | Abaixo do nome: "última visita há 12 dias" ou "próximo: sex 14:00" | P |
| 5.3 Ficha com hierarquia | Topo com iniciais, nome e botões; 3 números grandes (total gasto, atendimentos, última visita); o resto em lista menor | M |
| 5.4 Histórico em linha do tempo | Atendimentos numa linha vertical com bolinhas de status | P |

### Etapa 6: formulários, estados e acabamento

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 6.1 Formulários em blocos | Campos agrupados em cartões com título ("Quem", "Quando", "Valor"); botão salvar fixo embaixo nas telas longas | M |
| 6.2 Estados vazios ilustrados | Ícone de traço fino + frase + botão em todas as telas vazias (junto com o item 4.2 do plano de UI/UX) | P |
| 6.3 Transições | Entrada suave das listas (opacidade e leve subida, 150 ms), toque com resposta visual nos cartões | P |
| 6.4 Login e ícone do app | Login com o fundo escuro e o grão da landing; ícone do app instalável combinando com o monograma do cabeçalho | P |

## Como vamos trabalhar

1. **Protótipo antes do código:** primeiro uma página de prévia com a Agenda e o Resumo no visual novo, lado a lado com o atual. Você aprova a direção (cores, cartões, status) antes de mexer no sistema.
2. **Uma etapa por PR**, com fotos de antes e depois no celular.
3. **Conferência no navegador** em largura de celular a cada etapa.
4. **Atualizar o [design system](07-design-system.md)** com os tokens e padrões novos, para a landing e o painel continuarem falando a mesma língua.

## Ordem sugerida

1. **Protótipo** da Agenda e do Resumo, para aprovar a direção.
2. **Etapas 1 e 2:** mudam o sistema inteiro com pouco código.
3. **Etapa 3 (agenda)**, junto com a etapa 3 do plano de UI/UX, porque mexem no mesmo cartão.
4. **Etapas 4 e 5.**
5. **Etapa 6**, como acabamento.

Tudo isso pode vir antes ou depois do treinamento: nada muda o lugar dos botões, só a aparência. Se for antes, ela já aprende no visual final.

Tamanho: **P** = até meio dia, **M** = cerca de um dia, **G** = mais de um dia.
