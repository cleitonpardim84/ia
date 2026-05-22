# Precos na importacao: cor mais cara

## Objetivo

Quando o fornecedor (ex.: Valento) aplica **precos diferentes por cor** da mesma referencia, definir como isso entra no site (estamparia.pt ou outro catalogo) sem vender abaixo do custo da variante mais cara.

## Regra recomendada (catalogo com um preco por produto)

1. Para cada **referencia de produto** (mesmo modelo, varias cores), calcular:

   `preco_catalogo = max(preco_por_cor)`

   Ou seja, o valor mostrado no listado / ficha resumida e o da **cor mais cara**. Assim qualquer cor escolhida cobre o pior caso de custo.

2. Guardar tambem (para uso interno ou filtro):

   `preco_min_cor` e `preco_max_cor` (ou lista por cor), para orcamentos e margem.

## Alternativa (recomendada para loja online com carrinho)

- Criar **um SKU (ou variacao) por cor**, cada um com o **seu preco**.
- O cliente ve o preco exato da cor que escolheu; nao e necessario usar so o maximo no vitrine, mas e util manter `preco_max_cor` para destaque "a partir de X" se quiser marketing honesto (usar o minimo) ou conservador (usar o maximo), conforme politica comercial.

## Campos uteis num CSV/JSON de importacao

| Campo | Descricao |
|-------|-----------|
| `referencia_fornecedor` | Codigo do modelo |
| `cor_codigo` | Codigo Valento (ex.: color-0400) |
| `cor_nome` | Nome da cor (ex.: branco) |
| `preco_unitario_cor` | Preco dessa cor |
| `preco_max_referencia` | max sobre todas as cores do modelo (derivado) |

## Nota legal e operacional

Precos e condicoes valem os acordados com o distribuidor; confirmar na ficha B2B ou listagem autenticada do fornecedor. Esta nota e apenas regra de agregacao de dados para o teu catalogo.
