# Plano de UI/UX do painel

Criado em 2026-10-14, depois de concluídas as Fases 2 a 4. Objetivo: deixar o painel **fácil para a Gabriela usar sozinha**, que é o requisito principal do projeto.

## Princípios

1. **Poucos toques nas tarefas do dia:** agendar, concluir, remarcar e avisar a cliente.
2. **Sempre dizer o que aconteceu:** depois de salvar, mostrar que salvou. Quando der erro, explicar o que fazer.
3. **Linguagem dela, não de sistema:** "média por atendimento" em vez de "ticket médio".
4. **Nada que pareça quebrado:** sem telas em inglês, sem janelas do navegador, sem tela em branco carregando.
5. **Feito para o polegar:** alvos de toque de 44 px ou mais, ações principais embaixo, textos com pelo menos 16 px.

## Diagnóstico

| Problema | Onde | Impacto |
| --- | --- | --- |
| Erros e páginas não encontradas aparecem na tela padrão do Next, em inglês | Todo o painel | Alto: parece que o sistema quebrou |
| Confirmações usam `confirm()` do navegador ("...vercel.app diz:") | Cancelar, faltou, excluir, reabrir, encerrar | Alto: assusta e parece golpe |
| Salvar volta para a tela anterior sem aviso | 16 ações | Médio: ela fica sem saber se salvou |
| "Carregando..." em texto puro | 15 telas | Médio: tela "pula" quando os dados chegam |
| Login com cores fixas e sem "mostrar senha" | `/login` | Médio: primeira impressão, e senha errada no celular |
| Painel só abre pelo navegador | Celular | Médio: mais passos para abrir |
| Atendimento que passou sem conclusão só aparece no Resumo | Agenda | Médio: o faturamento fica errado sem ela notar |
| Para concluir, precisa abrir o atendimento | Agenda | Baixo: um toque a mais na tarefa mais repetida |
| Termos técnicos: "ticket médio", "avulsa", "fixa" | Resumo, Despesas | Baixo: hesitação |
| Primeira vez com tudo vazio, sem orientação | Todas as telas | Médio no treinamento |

## Etapas

### Etapa 1: nada parece quebrado (antes do treinamento) ✅

Entregue em 2026-10-14. De bônus, corrigido um bug em que links com estilo de botão ("Enviar confirmação", "Remarcar") perdiam a borda.

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 1.1 Erro e 404 próprios | `error.tsx` e `not-found.tsx` do painel em português, no visual da marca, com "Tentar de novo" e "Voltar para a agenda" | P |
| 1.2 Confirmação própria | Janela do próprio sistema (shadcn `AlertDialog`), com o texto da ação e botões grandes "Cancelar atendimento" / "Voltar" | M |
| 1.3 Aviso de "salvo" | Mensagem curta embaixo da tela ("Atendimento concluído", "Cliente salva"), que some sozinha | M |
| 1.4 Carregamento com esqueleto | Blocos cinza no formato da lista enquanto os dados chegam, no lugar de "Carregando..." | M |
| 1.5 Login polido | Mesmo visual do painel, nome em Playfair, "mostrar senha", mensagem de erro clara | P |

### Etapa 2: o painel vira um app

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 2.1 Instalar no celular (PWA) | Manifesto com nome "Gabriela Probst", ícone "G", cor da barra e abertura direto na agenda, em tela cheia | P |
| 2.2 Sessão longa | Conferir que o login dura semanas e que, se expirar, ela volta para a tela onde estava | P |

### Etapa 3: o dia a dia mais rápido

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 3.1 Agenda com "agora" | Destaque do próximo atendimento de hoje e marcação dos que já passaram | P |
| 3.2 Concluir pela agenda | Atendimento passado e ainda agendado mostra "Concluir" direto na lista | M |
| 3.3 Datas rápidas ao agendar | Botões "Hoje", "Amanhã" e "Próxima semana" acima do campo de data | P |
| 3.4 Agendar no horário vago | Na agenda do dia, os intervalos livres aparecem com "Agendar às 14:00" | G |

### Etapa 4: linguagem e primeira vez

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 4.1 Revisão de textos | Trocar jargões ("ticket médio" → "média por atendimento", "avulsa" → "do dia a dia", "fixa" → "todo mês"), padronizar botões e mensagens | P |
| 4.2 Estados vazios que ensinam | Cada tela vazia diz o que fazer e tem o botão da ação ("Nenhuma cliente ainda. Cadastre a primeira") | P |
| 4.3 Primeiros passos | Na primeira vez, uma lista curta: conferir serviços, cadastrar despesas fixas, agendar o primeiro atendimento. Some quando tudo estiver feito | M |

### Etapa 5: acessibilidade e acabamento

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 5.1 Foco visível | Contorno bordô claro em todo elemento focado (teclado e leitores de tela) | P |
| 5.2 Revisão de contraste e tamanhos | Conferir textos cinza sobre branco, rótulos de 12 px e a barra de navegação | P |
| 5.3 Transições suaves | Entrada leve das telas e da faixa da semana, respeitando "reduzir movimento" | P |

### Etapa 6: testar com a Gabriela

Teste de uso real, no celular dela, **sem ajudar**: só observar e anotar onde ela hesita.

Tarefas:
1. Agendar uma cliente nova para amanhã às 14h.
2. Avisar a cliente pelo WhatsApp.
3. Remarcar para depois de amanhã.
4. Concluir um atendimento recebido no Pix.
5. Ver quanto entrou e quanto sobrou no mês.
6. Lançar uma compra de materiais.

Para cada tarefa: conseguiu sozinha? Quanto tempo levou? Onde parou? O que disse? Cada dificuldade vira um item deste plano.

## Ordem sugerida

1. **Etapas 1 e 2**, antes do treinamento: o sistema não pode parecer quebrado na frente dela.
2. **Etapa 4.1 e 4.2**, também antes do treinamento: são rápidas e evitam dúvidas.
3. **Treinamento e Etapa 6**, juntos.
4. **Etapa 3**, guiada pelo que aparecer no teste.
5. **Etapas 4.3 e 5**, como acabamento.

Tamanho: **P** = até meio dia, **M** = cerca de um dia, **G** = mais de um dia.
