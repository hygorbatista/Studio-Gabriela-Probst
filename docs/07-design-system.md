# Design System

Base: referência "Haute Editorial Nail Atelier", um estilo editorial de revista de moda de luxo, adaptada ao Studio Gabriela Probst.
Biblioteca de componentes: **shadcn/ui** sobre Tailwind CSS (ver [ADR 001](adr/001-shadcn-ui.md)).

## Identidade

- **Três cores:** preto, branco e bordô. O bordô é usado com moderação, como um esmalte: nunca em fundos grandes.
- **Clima:** sofisticado, muito espaço em branco, linhas finas, sem sombras pesadas.
- **Cantos retos (0px)** em botões, cards, campos e imagens. Exceção: bolinhas de status, que são redondas.

## Cores (tokens)

| Token | Hex | Uso |
| --- | --- | --- |
| `primary` | `#6E1628` | Botão principal, aba ativa, destaques, títulos de impacto |
| `primary-hover` | `#881D33` | Hover do botão principal |
| `primary-deep` | `#50101D` | Estado pressionado, faixas escuras de contraste |
| `accent` | `#A32842` | Indicadores pequenos, notificações, detalhes finos |
| `foreground` | `#0B0B0C` | Texto principal, ícones, bordas fortes |
| `foreground-soft` | `#141416` | Títulos secundários, botões secundários escuros |
| `background` | `#FAFAFA` | Fundo das páginas |
| `surface` | `#FFFFFF` | Cards, modais, campos |
| `border` | `#EAEAEA` | Divisórias e bordas de 1px |
| `input-border` | `#D6D6D6` | Borda dos campos de formulário |
| `muted-foreground` | `#6B6B6B` | Textos de apoio |
| `destructive` | `#BA1A1A` | Erros e exclusões (sempre com ícone e texto, para não confundir com o bordô) |

Regra: o fundo é 90% branco ou alabastro. O texto é preto e o bordô entra só nas ações e nos destaques.

## Tipografia

Fontes do Google Fonts, carregadas via `next/font`:

- **Playfair Display** (serifada): títulos, nome do studio, citações. Peso 400, com itálico para ênfase.
- **Plus Jakarta Sans** (sem serifa): textos, formulários, agenda, números.

| Estilo | Desktop | Celular | Fonte |
| --- | --- | --- | --- |
| Display (hero) | 64px | 40px | Playfair 400 |
| Título grande | 44px | 30px | Playfair 400 |
| Título médio | 32px | 24px | Playfair 400 |
| Título pequeno | 22px | 22px | Playfair 500 |
| Texto | 16px | 16px | Jakarta 400 |
| Texto pequeno | 14px | 14px | Jakarta 400 |
| Rótulo maiúsculo | 12px, espaçamento +0.2em | 12px | Jakarta 600 |

## Espaçamento e layout

- Escala: 4px, 8px, 16px, 28px, 48px, 80px.
- Margem lateral: 20px no celular, 40px no tablet, 64px no desktop. Container máximo de 1320px.
- Seções da landing page separadas por 80px.

## Profundidade

- Padrão: sem sombra, só borda de 1px `#EAEAEA`.
- Modais e gavetas: borda de 1px preta e sombra suave `0 16px 36px -8px rgba(11,11,12,0.08)`.
- Fundo atrás de modais: preto com 60% de opacidade.

## Componentes

- **Botão principal:** fundo bordô, texto branco, rótulo maiúsculo, cantos retos. Hover em `#881D33`.
- **Botão secundário:** fundo transparente, borda e texto pretos. Hover com fundo preto e texto branco.
- **Botão de texto:** bordô com sublinhado fino.
- **Card de serviço:** fundo branco, borda de 1px, rótulo bordô em cima, nome em Playfair, duração e preço embaixo separados por uma linha.
- **Campo de formulário:** borda de 1px `#D6D6D6`, foco em bordô, rótulo acima em maiúsculas.
- **Chips/filtros:** inativo com borda cinza, ativo com fundo bordô e texto branco.
- **Lista de serviços:** estilo cardápio, com nome, linha pontilhada e depois duração e preço.

## Landing page × painel

O mesmo design system serve às duas partes, com ênfases diferentes:

- **Landing page:** o lado editorial completo, com títulos grandes, muito espaço, fotos e itálicos.
- **Painel (uso no celular):** o lado funcional. Textos com no mínimo 16px e peso 400 ou mais. Botões com pelo menos 44px de altura para o toque. Menos espaço decorativo e mais informação.

## Ajustes em relação à referência original

1. A referência trazia **duas paletas** diferentes (cabeçalho com `#4F0015` e texto com `#6E1628`). Adotamos uma só, a do texto (`#6E1628`), como fonte única.
2. Texto em **peso 300 e tamanhos de 11 a 13px** são difíceis de ler no celular. O mínimo agora é 16px para texto e 12px para rótulos.
3. O componente "seletor de acabamento de unha" ficou de fora por enquanto, porque não está nos requisitos.

## Como ficou na landing page

Decisões tomadas durante a implementação, que complementam as regras acima:

- **Tokens no código:** as cores viraram classes do Tailwind (`bg-primary`, `text-muted-foreground`...) em `app/globals.css`. Para mudar uma cor, mude só ali.
- **Seções escuras:** o topo e os serviços usam fundo preto, e o contato usa bordô escuro (`primary-deep`). As seções de leitura longa ficam claras.
- **Fotos no topo:** escurecidas (brilho de 55%) com degradês pretos por cima, para o texto sempre ter contraste.
- **Textura:** um grão sutil (7% de opacidade) sobre toda a página, que dá um aspecto de papel fotográfico. É a classe `.grain`, aplicada no `body`.
- **Exceção aos cantos retos:** o botão flutuante do WhatsApp é **redondo**, porque esse é o formato que todo mundo reconhece. Ele é bordô, com o símbolo branco e um anel branco sutil.
- **Animações** (`components/motion.tsx`): entram uma vez só, ao aparecer na tela. Usam apenas posição, opacidade, escala e recorte. Títulos sobem de trás de uma máscara, linhas finas se desenham e fotos se revelam de baixo para cima. Tudo é desligado para quem ativa "reduzir movimento" no aparelho.

## Logo

A Gabriela ainda não tem logo. A proposta inicial é um **logotipo tipográfico**: "Gabriela Probst" em Playfair Display, com "NAIL STUDIO" em rótulo maiúsculo embaixo. É gratuito, rápido e coerente com o design system, e pode ser substituído no futuro por um logo feito por um designer.

Derivados aplicados:
- **Favicon:** um "G" em Playfair, branco sobre preto (`app/icon.tsx` e `app/apple-icon.tsx`).
- **Imagem de compartilhamento:** fundo preto com "Gabriela Probst", uma linha bordô, "NAIL STUDIO" e "SERRARIA · SÃO JOSÉ" (`app/opengraph-image.tsx`).

Os dois são gerados no build a partir das fontes em `assets/fonts/` (licença OFL).
