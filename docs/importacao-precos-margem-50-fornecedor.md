# Importacao de precos do fornecedor com margem (+50%)

## Objetivo

A partir dos **precos do fornecedor** (area reservada B2B, apos login), calcular o **preco de venda** na loja aplicando **+50% sobre o valor de compra** e gravar no WooCommerce no campo de **produto simples**: **Preco normal** (`Regular price` no CSV / `_regular_price` na base de dados).

## Formula (margem de 50% sobre o custo)

Interpretacao usual de "adicionar 50% ao valor do fornecedor":

```text
preco_loja = preco_fornecedor * (1 + 0,50) = preco_fornecedor * 1,5
```

**Exemplo:** fornecedor **10,00 EUR** (sem IVA ou com IVA -- alinha com a mesma base que usas na loja) -> loja **15,00 EUR**.

Se a tua politica for **margem sobre preco de venda** (markup inverso), a formula e outra; este documento assume **50% em cima do preco de compra**.

## Seguranca (credenciais)

- **Nunca** coloques utilizador nem palavra-passe do fornecedor em ficheiros do Git, CSV partilhados ou tickets publicos.
- Usa um **gestor de passwords** ou variaveis de ambiente **so na maquina/servidor** que corre scripts.
- Se alguma credencial tiver sido exposta (ex.: conversa, repositorio), **altera a palavra-passe** no portal do fornecedor.

Este repositorio **nao** contem logins nem palavras-passe.

## WooCommerce: produto simples

| Origem (fornecedor) | Destino (loja) |
|---------------------|----------------|
| Preco unitario do artigo | Coluna CSV **`Regular price`** (produto `Type` = `simple`) |
| | Meta **`_regular_price`** |

Confirma em **WooCommerce > Definicoes > Imposto** se os valores do fornecedor e os da loja estao **todos com IVA** ou **todos sem IVA** antes de importar.

## Fluxo sugerido (manual ou script externo)

1. **Login** no site do fornecedor com credenciais guardadas de forma segura (fora deste repo).
2. **Exportar** lista de precos (CSV, Excel ou copiar da grelha), com coluna de preco base por referencia.
3. **Calcular** coluna `preco_loja = ROUND(preco_fornecedor * 1.5, 2)` (ou mais casas decimais conforme politica).
4. **Mapear** `SKU` ou referencia -> `Regular price` no modelo CSV do WooCommerce (`Type` = `simple`).
5. **WooCommerce > Produtos > Importar** (ou REST API `wc/v3/products`).

Para **produtos variaveis**, o `Regular price` vai em **cada** linha `variation`; a margem aplica-se ao preco de cada variacao.

## Referencia

Documentacao geral de importacao WooCommerce: `docs/woocommerce-estamparia-importacao.md`.

Regras quando o preco muda por cor: `docs/precos-importacao-por-cor.md`.
