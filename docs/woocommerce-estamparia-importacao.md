# Importacao para WooCommerce (estamparia.pt)

## Contexto

O sitio **estamparia.pt** corre sobre **WordPress com WooCommerce** (presenca de `wp-content`, scripts e marcas tipicas de WooCommerce no HTML publico). Os campos abaixo seguem a convencao do proprio WooCommerce, da REST API `wc/v3` e do **importador CSV** nativo (WooCommerce > Produtos > Importar).

A regra de negocio **preco pela cor mais cara** vs **preco por variacao** esta resumida em `docs/precos-importacao-por-cor.md`.

---

## Tipos de produto

| Objetivo | Tipo WooCommerce | Onde se define |
|----------|------------------|----------------|
| Uma unica cor ou tamanho, um preco | `simple` | Um registo `product`, metas de preco no proprio produto |
| Mesmo modelo, **varias cores** (e/ou tamanhos), **precos diferentes** | `variable` + filhos `variation` | Produto pai `variable`; cada cor (e tamanho) e uma linha `variation` ligada pelo SKU pai ou coluna Parent |

Recomendacao para textil tipo Valento: **produto variavel** com **uma variacao por combinacao** cor (e tamanho, se aplicavel), cada uma com **SKU unico** e **Regular price** proprio.

---

## Campos principais (importador CSV nativo)

Nomes de coluna usuais do CSV WooCommerce (em ingles, como o modelo oficial):

| Coluna CSV | Uso em estamparia / fornecedor |
|------------|--------------------------------|
| `Type` | `simple`, `variable`, ou `variation` |
| `SKU` | Codigo unico (ex.: `VAL-BIKE-BRANCO-M`) |
| `Name` | Nome visivel do produto |
| `Published` | `1` publicar, `0` rascunho |
| `Short description` | Descricao curta (listagens, SEO) |
| `Description` | Descricao longa (ficha) |
| `Regular price` | Preco **sem IVA** se a loja estiver configurada assim; na vitrine publica aparece frequentemente "+ IVA" no texto -- alinhar com **Impostos** em WooCommerce |
| `Sale price` | Opcional, promocoes |
| `Categories` | Categorias separadas por `>`, ex.: `T-shirts > Unisex` |
| `Tags` | Opcional |
| `Images` | URLs ou caminhos separados por `,` (primeira = imagem principal) |
| `Parent` | Para `variation`: SKU do produto pai `variable` |
| `Attribute 1 name` ... | Ex.: `Cor` |
| `Attribute 1 value(s)` | Para variacao: valor exato da cor, ex.: `Branco` |
| `Attribute 1 global` | `1` se for atributo global criado em Produtos > Atributos (recomendado para filtrar por cor) |

Gramagem (ex.: `220 g/m2`): pode ser **atributo do produto** visivel na ficha (igual para todas as cores) ou **metadado personalizado**; o CSV nativo suporta atributos numerados (`Attribute 2 name` = `Gramagem`, valor = `220 g/m2`).

---

## Metadados uteis (REST API ou base de dados)

Estes nomes aparecem em `wp_postmeta` e na API como meta equivalente:

| Meta / campo API | Funcao |
|------------------|--------|
| `_sku` | Referencia / SKU |
| `_regular_price` | Preco base da variacao ou produto simples |
| `_sale_price` | Preco promocional |
| `_manage_stock` | `yes` / `no` |
| `_stock` | Quantidade se gestao de stock ativa |
| `_tax_status` | Em PT B2C tipico: `taxable` (sujeito a IVA conforme configuracao da loja) |
| `_tax_class` | Classe fiscal (ex.: `padrao`) |
| `_product_image_gallery` | IDs de anexos separados por virgula (galeria) |
| `_thumbnail_id` | Imagem em destaque (produto ou variacao) |

Variacoes: `post_type` = `product_variation`, `post_parent` = ID do produto `variable`. Atributo global **Cor** com slug `cor` grava-se na variacao como meta `attribute_pa_cor` = slug da cor (ex.: `branco`).

---

## Imagens por cor

- **Galeria do pai**: todas as fotos gerais do modelo.
- **Imagem da variacao**: em cada `variation`, definir imagem propria (no CSV de importacao, colunas de imagem por variacao conforme modelo; na API, `image` no objeto da variacao). Assim, ao escolher a cor, a foto muda.

---

## Precos: o que o WooCommerce mostra vs "cor mais cara"

- Por defeito, em produtos **variaveis**, muitos temas mostram intervalo ou texto tipo **"Desde X EUR"**, onde **X e o preco da variacao mais barata**, nao a mais cara.
- Se a politica comercial for **vitrine conservadora (cor mais cara)**:
  - **Opcao A:** produto **simples** com um unico preco = `max(preco_por_cor)` (perde-se escolha de cor na loja com precos distintos).
  - **Opcao B:** manter **variavel** com precos reais por cor no carrinho, e **personalizar o HTML do preco** (filtro WordPress `woocommerce_variable_price_html` ou equivalente no tema) para mostrar o **maximo** em arquivo / ficha, em vez do minimo.
  - **Opcao C:** usar extensao / desenvolvimento a medida para regras de exibicao.

Para o cliente ver sempre o preco correto **apos** escolher a cor, a combinacao **variavel + `_regular_price` por variacao** e a abordagem correta.

---

## Ferramentas de importacao

1. **WooCommerce > Produtos > Importar** (CSV) -- suficiente para lotes simples; variaveis exigem linhas `variable` + varias `variation` bem ligadas.
2. **WP All Import** (com addon WooCommerce) -- util para mapear XML/JSON do fornecedor e atualizar em massa.
3. **REST API** `POST /wp-json/wc/v3/products` e `.../products/{id}/variations` -- para scripts proprios.

---

## Resumo alinhado ao pedido original (tipo de produto, categoria, nome, descricao, gramagem, cores, fotos)

| Pedido | Onde no WooCommerce |
|--------|---------------------|
| Tipo de produto | Categorias e/ou etiquetas; atributo "Tipo" se precisares de taxonomia propria |
| Categoria | Taxonomia `product_cat` (coluna `Categories` no CSV) |
| Nome | `Name` |
| Descricao breve | `Short description` |
| Gramagem | Atributo de produto ou campo personalizado |
| Cores | Atributo global `Cor` + variacoes `variation` com `Attribute 1 name` / valor |
| Fotos por variacao | Imagem da variacao + galeria do pai |

---

## Nota

Confirmar em **WooCommerce > Definicoes > Imposto** se os precos introduzidos sao **com ou sem IVA**, para bater certo com o texto "+ IVA" no sitio. Ajustar importacao em conformidade.
