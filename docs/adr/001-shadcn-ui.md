# ADR 001: Biblioteca de componentes shadcn/ui

**Data:** 2026-10-07
**Status:** aceita

## Contexto

Precisamos de componentes de interface (botões, formulários, calendário, modais, tabelas) com a identidade do studio (preto, branco e bordô, cantos retos), funcionando bem no celular. O projeto já usa Tailwind CSS. O desenvolvimento precisa ser rápido, e o projeto também é de estudo.

## Opções consideradas

1. **shadcn/ui:** os componentes são copiados para dentro do projeto e estilizados com Tailwind.
2. **Material UI, Mantine ou Chakra:** bibliotecas instaladas como pacote.
3. **Componentes próprios do zero** com Tailwind.

## Decisão

Usar **shadcn/ui**.

## Consequências

- **A favor:** visual totalmente personalizável pelos tokens de [07-design-system.md](../07-design-system.md). O código de cada componente fica legível no projeto, o que ajuda no aprendizado. É acessível e tem calendário e formulários prontos.
- **Contra:** o visual padrão é neutro e precisa ser ajustado para a identidade. Atualizações dos componentes são manuais, porque o código é nosso.
- **Descartadas:** as bibliotecas prontas deixam o visual genérico e duplicam o papel do Tailwind. Fazer do zero seria lento demais para o prazo.
