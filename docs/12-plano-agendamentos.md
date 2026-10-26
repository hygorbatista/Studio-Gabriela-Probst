# Plano de agendamentos

Criado em 2026-10-24. Hoje a maior dor da Gabriela é agendar e consultar horários. Objetivo: deixar a agenda **mais rápida, sem erro e fácil de aprender sozinha**, principalmente no momento em que uma cliente pergunta pelo WhatsApp "tem horário quinta?".

Complementa o [plano de UI/UX](10-plano-ui-ux.md) (itens 3.3 e 3.4 entram aqui) e segue o [design](11-plano-design.md) já aplicado.

## Como ela agenda (o cenário a otimizar)

1. A cliente manda mensagem: "Oi, tem horário pra manutenção essa semana?".
2. A Gabriela precisa descobrir **quais horários cabem** a manutenção (duração + 15 min de intervalo) nos próximos dias.
3. Responde com as opções, a cliente escolhe, ela marca e confirma.
4. Na véspera, lembra a cliente. Depois do atendimento, a cliente precisa voltar em 15 a 30 dias.

Cada etapa abaixo encurta um desses passos.

## O que sabemos dela (respostas do Hygor, 2026-10-24)

- **Horário flexível:** ela não tem expediente fixo. Os horários livres são **sugestão, nunca regra**: sempre existe "Outro horário" para marcar qualquer hora, e a única trava continua sendo não encavalar dois atendimentos. As sugestões usam uma janela padrão (07:00 às 21:00), fácil de mudar num lugar só.
- **Retorno:** cada cliente agenda por volta de **uma vez por mês**. O retorno padrão é de 30 dias.
- **Visões de calendário** como no Google Agenda: dia, semana, mês e lista, com **cores de ocupação** (vazio, com espaço, cheio). Virou a etapa 3.

## Diagnóstico

| O que acontece hoje | Onde | Efeito |
| --- | --- | --- |
| Horário escolhido numa lista de 65 opções (06:00 a 22:00), **sem ver o que já está marcado** | Agendar, Remarcar | Ela tenta, dá conflito, tenta de novo. Principal fonte de erro e demora |
| Para saber "tem horário quinta?", precisa abrir dia a dia e calcular de cabeça | Agenda | Demora a responder a cliente no WhatsApp |
| Os espaços livres do dia não aparecem; só a lista do que está marcado | Agenda | Difícil enxergar onde cabe um encaixe |
| Data num campo de calendário do celular, sem atalhos | Agendar | Vários toques para chegar em "quinta que vem" |
| Para achar o próximo horário de uma cliente, precisa ir em Clientes | Agenda | Ela não pensa em "Clientes" quando a pergunta é sobre a agenda |
| Concluir uma manutenção não sugere a próxima | Concluir | A cliente esquece de voltar; a agenda fica com buracos |
| Não dá para bloquear um horário (folga, médico, almoço) | Agenda | Risco de marcar cliente onde ela não pode |
| Cancelou? Não há a quem oferecer o horário | Agenda | Horário perdido |
| Lembrete da véspera: abrir cada atendimento e tocar no WhatsApp | Atendimento | Trabalhoso, então acaba não sendo feito |

## O que a pesquisa mostrou

Apps de agenda para salões (Fresha, Booksy, Trinks, Mangomint) convergem em alguns padrões:

- **Agendar a partir do horário vago:** no Fresha, toca no espaço livre da agenda do dia e o agendamento já nasce naquele horário.
- **Conflito checado antes de confirmar:** a busca da cliente, a escolha do serviço e a validação do horário ficam no mesmo fluxo.
- **Visão do dia para detalhe, do mês para panorama:** tocar num dia do mês abre o dia.
- **Remarcar ao concluir (rebook):** o Mangomint oferece "agendar de novo" logo depois do atendimento.
- **Atendimentos repetidos:** o Fresha cria uma série (a cada N semanas, até uma data) para clientes fiéis.
- **Bloqueio de horário:** pausas, folgas e compromissos que impedem agendar.
- **Lista de espera:** quem quer um horário cheio é avisado quando abre uma vaga.
- **Lembrete na véspera** (1 a 3 dias antes), principal arma contra faltas. Fornecedores falam em 15% a 30% de faltas sem lembrete (número de fonte comercial).
- **Manutenção de unhas:** gel a cada 15 a 21 dias, fibra a cada 20 a 30 dias. É a base para sugerir o retorno.

Fontes no fim do documento.

## Etapas

### Etapa 1: agendar sem errar (a maior dor)

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 1.1 Horários livres ao agendar | Escolhidos o serviço e o dia, aparecem **só os horários em que o serviço cabe**, como botões grandes ("09:00", "10:45", "14:00"...). Toca e pronto. Considera a duração do serviço, o intervalo de 15 min e o que já está marcado. Acaba o "deu conflito, tenta de novo" | M |
| 1.2 O dia ao lado | Abaixo dos horários livres, a lista curta do que já está marcado naquele dia, para ela se situar | P |
| 1.3 Dias rápidos | No lugar do campo de calendário, uma faixa com os próximos 14 dias ("Hoje", "Amanhã", "qui 30"...), cada um com quantos horários livres tem. "Outra data" abre o calendário | P |
| 1.4 Cliente primeiro, resto sugerido | Escolhida a cliente, o **serviço favorito dela** já vem marcado e o **horário favorito** aparece destacado entre os livres | P |
| 1.5 Remarcar igual | Remarcar usa os mesmos dias rápidos e horários livres | P |

### Etapa 2: responder "tem horário?" em segundos

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 2.1 Tela "Horários livres" | Atalho na Agenda: escolhe o serviço e vê os horários livres dos próximos dias, agrupados por dia. É a resposta para a cliente | M |
| 2.2 Copiar para o WhatsApp | Marca 2 ou 3 opções e toca em **"Copiar"**: vira o texto "Tenho quinta (30/10) às 14:00 ou sexta (31/10) às 09:00. Qual fica melhor?", pronto para colar na conversa | P |
| 2.3 Da opção ao agendamento | Tocar num horário livre abre o Agendar já com serviço, dia e hora preenchidos; falta só a cliente | P |

### Etapa 3: consultar a agenda de relance (visões de calendário)

No topo da Agenda, uma escolha **Dia · Semana · Mês · Lista**, como no Google Agenda. As cores de ocupação são as mesmas em todas as visões e nos dias rápidos do Agendar:

| Cor | Quando |
| --- | --- |
| Branco (vazio) | Nenhum atendimento |
| Rosa claro (com espaço) | Tem atendimento, mas ainda cabe mais |
| Bordô (cheio) | 8 h ou mais ocupadas, contando os intervalos |

Como ela não tem expediente fixo, "cheio" é uma referência (8 h), ajustável num lugar só.

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 3.1 Espaços livres na agenda do dia | Entre os cartões, os intervalos vagos aparecem como "Livre · 14:00 às 16:30", com toque para agendar ali (item 3.4 do plano de UI/UX) | M |
| 3.2 Buscar na agenda | Busca por nome na própria Agenda: mostra os próximos horários daquela cliente, com Remarcar e WhatsApp | P |
| 3.3 Visão do mês | Calendário do mês, cada dia pintado pela ocupação e com o número de atendimentos; toque abre o dia | M |
| 3.4 Visão da semana | Grade com os 7 dias lado a lado e as horas na vertical: os atendimentos são blocos e o vazio aparece como vazio. Toque num bloco abre o atendimento; num espaço vazio, agenda ali | M |
| 3.5 Lista | Os próximos 30 dias numa rolagem só, agrupados por dia | P |

### Etapa 4: clientes voltando sozinhas para a agenda

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 4.1 Agendar o retorno ao concluir | Depois de "Concluir", aparece **"Agendar o retorno?"** com a data sugerida pelo serviço (ex.: manutenção em 21 dias) e o horário favorito da cliente. Um toque abre o Agendar preenchido | M |
| 4.2 Intervalo de retorno por serviço | Campo novo em Serviços: "Retorno em ___ dias", **30 por padrão** (as clientes dela voltam cerca de uma vez por mês). É a base de 4.1 e 4.3 | P |
| 4.3 "Hora de voltar" | Lista das clientes cujo retorno já passou e que não têm nada marcado, com convite pronto no WhatsApp. Evolui as "sumidas" (hoje, 45 dias fixos) | P |
| 4.4 Repetir agendamento | Para clientes fiéis: "repetir a cada 3 semanas, até dezembro". Cria a série de uma vez, avisando os conflitos | G |

### Etapa 5: menos faltas

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 5.1 Confirmar os de amanhã | Na Agenda, um aviso "Amanhã: 4 atendimentos para confirmar" abre a lista com um botão de WhatsApp em cada, já com a mensagem de lembrete | P |
| 5.2 Marcar como confirmado | Depois que a cliente responde, um toque marca "Confirmado"; o cartão na agenda ganha o selo | P |

Lembretes automáticos (sem ela tocar em nada) precisam da API paga do WhatsApp e continuam no "Futuro" do roadmap.

### Etapa 6: imprevistos

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 6.1 Bloquear horário | "Bloquear" na agenda: folga, médico, almoço. Aparece na agenda e some dos horários livres | M |
| 6.2 Lista de espera | Anotar "Ana quer quinta à tarde". Quando um horário compatível abre (cancelamento), a agenda avisa: "A Ana queria esse horário", com WhatsApp pronto | M |
| 6.3 Desfazer | Depois de cancelar ou marcar falta, o aviso tem "Desfazer" por alguns segundos | P |

### Etapa 7: aprender sozinha

| Item | O que muda | Tamanho |
| --- | --- | --- |
| 7.1 Dicas na primeira vez | Uma frase curta nas telas novas na primeira vez ("Toque num horário livre para agendar"), que some depois | P |
| 7.2 Teste com a Gabriela | As tarefas do teste de uso ganham: "Uma cliente perguntou se tem horário quinta: responda" e "Agende o retorno da cliente que você acabou de atender" | P |

## Ordem sugerida

Plano aprovado em 2026-10-24. Feito: etapas 1, 2 e 3 (2026-10-24), 4.1 e 4.2 (2026-10-26).

1. **Etapa 1 (agendar sem errar)** e **Etapa 2 (tem horário?)**: atacam a dor que ela relatou e compartilham a mesma base (o cálculo de horários livres). Fazer juntas.
2. **Etapa 3 (visões dia, semana, mês e lista, com cores)**: pedido do Hygor; usa a mesma base.
3. **4.1 e 4.2 (retorno ao concluir)**: enchem a agenda sem esforço.
4. **5.1 e 5.2 (confirmar os de amanhã)**: rápidas e reduzem faltas.
5. **3.2 (busca na agenda)** e **6.1 (bloquear horário)**.
6. Resto (**4.3, 4.4, 6.2, 6.3, 7.1**) conforme o uso mostrar.

A cada etapa, validar com a Gabriela antes da próxima.

## Base técnica

- **Cálculo de horários livres** (`lib/free-slots.ts`): função pura, testada à parte. Recebe os atendimentos do dia (agendados e concluídos com horário), os bloqueios, a duração do serviço, o intervalo e a janela das sugestões (07:00 às 21:00, de 30 em 30 min, mais o encaixe logo depois de cada atendimento), e devolve os inícios possíveis. Fora da janela, "Outro horário" aceita qualquer hora. É a mesma regra da restrição `appointments_no_overlap` do banco, que continua sendo a garantia final contra conflitos.
- **Dias da semana:** a busca dos próximos 14 dias é uma consulta só (como `getWeekCounts`), não uma por dia.
- **Banco:** 4.2 (intervalo de retorno em `services`), 5.2 (confirmação em `appointments`), 6.1 (tabela de bloqueios, que também precisa barrar agendamentos) e 6.2 (lista de espera) pedem migrações. As etapas 1 a 3 não mexem no banco.

## Perguntas para a Gabriela

- ~~Em que horários costuma começar e terminar o dia?~~ Respondido: é flexível.
- ~~Quanto tempo depois volta uma cliente?~~ Respondido: cerca de um mês.
- A referência de "dia cheio" (8 h ocupadas) bate com a realidade dela?
- Ela costuma oferecer 2 ou 3 opções de horário para a cliente, ou pergunta qual a cliente prefere?
- Quais imprevistos mais acontecem: folga, médico, atraso de cliente?

## Fontes

- [Fresha: criar agendamentos (agenda do dia, tocar no horário)](https://www.fresha.com/help-center/knowledge-base/calendar/260-create-appointments-1)
- [Fresha: agendamento, pausas e bloqueios](https://www.fresha.com/en-GB/for-business/features/scheduling)
- [Pabau: comparação com Fresha (lista de espera)](https://pabau.com/?p=137870)
- [SoftwareOne: Booksy (repetição e lista de espera)](https://platform.softwareone.com/product/calendar-scheduling/PCP-7189-3486)
- [Mangomint: reagendar depois do atendimento](https://www.mangomint.com/learn/rebook-an-appointment/)
- [ServiceTitan: dia para detalhe, mês para panorama, conflito antes de confirmar](https://help.servicetitan.com/mobile/docs/field-mobile-app-calendar-and-schedule-management-concepts)
- [AgendaPro: lembretes 1 a 3 dias antes por WhatsApp](https://agendapro.com/co/manicure-y-pedicure/software-para-salon-de-manicure-y-pedicure)
- [Mobile Time: Trinks](https://www.mobiletime.com.br/?p=332955)
- [Aurora Inbox: faltas sem lembrete (fonte comercial)](https://www.aurorainbox.com/pt/?p=38217)
- [Folha Vitória: intervalo de manutenção de gel e fibra](https://www.folhavitoria.com.br/geral/alongamento-gel-fibra-de-vidro-unhas-naturais-mitos-e-verdades-viral/)
- [Catraca Livre: gel ou fibra](https://catracalivre.com.br/saude-bem-estar/gel-ou-fibra-de-vidro-qual-alongamento-vale-mais-a-pena/)
