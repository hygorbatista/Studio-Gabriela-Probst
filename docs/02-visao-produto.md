# Visão do Produto

## Problema

A Gabriela atende cerca de 6 clientes por semana, anota a agenda em papel e controla o dinheiro em caderno e bloco de notas. Ela não tem agenda digital, não vê o histórico das clientes e não sabe quanto entrou e quanto sobrou no mês. Os apps de mercado que ela já testou, ela não gostou.

## Solução

Duas partes, em um só projeto:

1. **Landing page pública:** vitrine do studio com serviços, preços, fotos, endereço e botão de WhatsApp.
2. **Painel privado (só da Gabriela):** agenda, clientes, serviços, financeiro e relatórios, feito para uso rápido no celular.

## Usuários

| Usuário | Acesso |
| --- | --- |
| Gabriela | Painel completo, com login |
| Clientes e visitantes | Apenas a landing page, sem conta e sem agendar |

## Objetivos

- Ter uma agenda digital que substitua o papel.
- Saber **quanto entrou e quanto sobrou** no mês e comparar com a meta (R$ 3.600/mês).
- Ver faturamento, melhores clientes e serviços mais vendidos.
- Atrair mais clientes pelo site.
- Custo de operação zero (planos gratuitos de Vercel e Supabase).

## O que não faremos (por enquanto)

- Agendamento feito pelas clientes (futuro, com aprovação da Gabriela).
- Contas e senhas para clientes.
- Envio automático de WhatsApp por API (usaremos mensagem pronta via `wa.me`).
- Controle de estoque, programa de fidelidade, pacotes, promoções.
- Cobrança de sinal e pagamento online.
- Várias profissionais e comissões.

## Princípios

- **Celular primeiro:** toda tela é pensada para o celular.
- **Simples e rápido:** registrar um atendimento deve levar poucos toques.
- **Dados entram depois:** o sistema funciona antes de ter todos os valores financeiros preenchidos.
- **Gratuito:** nenhuma decisão técnica que gere custo recorrente sem a Gabriela aprovar.

## Métricas de sucesso

- A Gabriela deixa de usar a agenda de papel.
- O resultado do mês (entrou − saiu) é consultado no sistema, não mais no caderno.
- A meta de 30 atendimentos por mês é acompanhada no painel.
