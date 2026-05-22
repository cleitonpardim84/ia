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
| `Name` | Titulo visivel; ver **Titulo do produto (convencao estamparia.pt)** |
| `Published` | `1` publicar, `0` rascunho |
| `Short description` | Descricao curta (listagens, SEO) |
| `Description` | Descricao longa (ficha) |
| `Regular price` | Preco **sem IVA** se a loja estiver configurada assim; na vitrine publica aparece frequentemente "+ IVA" no texto -- alinhar com **Impostos** em WooCommerce |
| `Sale price` | Opcional, promocoes |
| `Categories` | Categorias separadas por `>`, ex.: `T-shirts > Unisex` |
| `Tags` | Opcional |
| `Images` | Ver secao **Importacao de imagens**; no pai: principal + galeria; em cada `variation`: foto dessa cor |
| `Parent` | Para `variation`: SKU do produto pai `variable` |
| `Attribute 1 name` ... | Ex.: `Cor` |
| `Attribute 1 value(s)` | Para variacao: valor exato da cor, ex.: `Branco` |
| `Attribute 1 global` | `1` se for atributo global criado em Produtos > Atributos (recomendado para filtrar por cor) |

Gramagem (ex.: `220 g/m2`): pode ser **atributo do produto** visivel na ficha (igual para todas as cores) ou **metadado personalizado**; o CSV nativo suporta atributos numerados (`Attribute 2 name` = `Gramagem`, valor = `220 g/m2`).

---

## Titulo do produto (convencao estamparia.pt)

Formato pedido para o campo **`Name`** (titulo do produto na loja):

```text
(Nome da categoria Menu) (personalizado DTF) (Nome do Produto)
```

Onde:

- **Nome da categoria Menu** -- o texto **como aparece no menu** da loja (ex.: `T-SHIRTS`, `SWEATSHIRTS`), que pode diferir ligeiramente do nome da categoria WooCommerce (`product_cat`). Usa o mesmo texto para consistencia com a navegacao.
- **`(personalizado DTF)`** -- segmento **fixo** para deixar claro o servico de estampagem DTF.
- **Nome do Produto** -- nome comercial do modelo (ex.: fornecedor + referencia), ex.: `Camiseta Basic BIKE`.

**Exemplo (pai variavel):**

```text
(T-SHIRTS) (personalizado DTF) (Camiseta Basic BIKE)
```

**Variacoes (`Type` = `variation`):** mantem o mesmo prefixo e acrescenta a cor (ou tamanho) no ultimo segmento, para o cliente distinguir na lista de encomendas / carrinho:

```text
(T-SHIRTS) (personalizado DTF) (Camiseta Basic BIKE - Branco)
```

**CSV:** se o titulo tiver **virgulas**, envolve a celula `Name` em **aspas duplas** no ficheiro CSV.

**Automatizar:** em script de importacao, montar a string a partir de: (1) mapa categoria WooCommerce -> nome de menu, (2) literal fixo, (3) nome vindo do fornecedor.

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

## Importacao de imagens (produto e variacao por cor)

### Coluna `Images` no CSV nativo WooCommerce

- **Uma URL por imagem**, varias imagens na **mesma celula** separadas por **virgula** (`,`).
- **Ordem importa:** a **primeira** URL torna-se a **imagem de destaque** do produto ou da variacao; as seguintes entram na **galeria** (no produto pai) ou continuam a associar-se ao mesmo item, conforme a versao do importador (para variacoes, costuma bastar **uma URL** = imagem dessa cor).

### Produto pai (`Type` = `variable`)

- **`Images`**: `https://.../modelo-frente.jpg, https://.../modelo-verso.jpg` -- imagem geral do modelo (vitrine antes de escolher cor, ou fallback).
- Coluna **`Parent`**: deixar **vazia** no pai (se omitires o campo, o CSV tem de ter o separador `,,` para nao deslocar as colunas seguintes).

### Variacao por cor (`Type` = `variation`)

- **`Images`**: URL da **foto daquela cor** (ex.: mockup branco vs preto). Quando o cliente escolhe **Cor** na ficha, o WooCommerce passa a mostrar esta imagem.
- **`Parent`**: SKU do produto `variable` (igual em todas as linhas dessa familia).

### URLs externas (ex.: fornecedor Valento)

- O importador pode **descarregar** ficheiros a partir de URLs **HTTPS publicas** (depende das permissoes do servidor WordPress e do tempo limite). Usar URL **absoluta**, ex.: `https://www.valento.es/images_valento/articles/CODE/CODE_presentacion.jpg`.
- Se o import falhar por **timeout** ou **bloqueio**, faz upload manual para **Media** e usa o URL do teu dominio, ou importa por **REST API** / plugin com fila e retry.

### REST API (`wc/v3`)

- **Produto (pai ou simples):** campo `images` -- array de objetos `{ "src": "https://...", "name": "...", "alt": "..." }`; o primeiro e o destaque.
- **Variacao:** `POST/PUT .../products/{id}/variations/{vid}` com `"image": { "src": "https://..." }` (uma imagem por variacao e o caso mais comum).

### Resumo

| Onde | Coluna / campo | Conteudo tipico |
|------|----------------|-----------------|
| Pai variavel | `Images` | Foto generica + opcional galeria (varias URLs) |
| Variacao (cor X) | `Images` | Foto do artigo na **cor X** |
| Simples | `Images` | Destaque + galeria |

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

## Marca VALENTO (automatico no WordPress / estamparia.pt)

No sitio publico, a marca aparece como taxonomia **`brand`**: o arquivo da marca VALENTO esta em `https://estamparia.pt/brand/valento/` (slug do termo **`valento`**; o nome mostrado pode ser "VALENTO" ou "Valento", mas o **slug** costuma ser o que interessa para `wp_set_object_terms`).

### Onde gravar a marca

- Aplica-se ao **produto pai** (`simple` ou `variable`). Variacoes (`variation`) herdam o contexto do pai na ficha; o snippet abaixo, se disparar numa variacao, atualiza sempre o **pai**.

### Opcao 1: coluna no CSV (importador nativo ou plugin)

1. Em **Produtos > Exportar**, exporta **um produto** que ja tenha a marca VALENTO e abre o CSV.
2. Copia o **nome exacto** da coluna de marcas (ex.: `Brands`, `Brand`, etc.) para o teu ficheiro de importacao.
3. Preenche com o **mesmo texto** que o export usou para VALENTO (nome do termo), ou o slug `valento`, conforme o importador aceitar.

O importador **core** do WooCommerce **pode ignorar** colunas de marca se nao estiverem mapeadas; nesse caso usa a **Opcao 2** ou um plugin de importacao que suporte a taxonomia `brand`.

### Opcao 2: snippet apos cada linha importada (sempre VALENTO)

Ficheiro de referencia no repositorio:

`docs/exemplos/snippets/valento-brand-importacao.php`

- Usa o hook `woocommerce_product_import_inserted_product`.
- Por defeito, associa o termo **`valento`** na taxonomia **`brand`** quando o **SKU do pai** comeca por **`VAL-`** (ajusta o prefixo no ficheiro se usares outra convencao).

Instalacao tipica: plugin **Code Snippets** (executar em todo o sitio) ou copiar para `wp-content/mu-plugins/` (ficheiro PHP isolado).

### Opcao 3: WP All Import / scripts REST

- Mapear um **valor fixo** `valento` (ou nome do termo) para o campo de marcas do addon.
- Na REST API, o nome do campo depende da extensao de marcas; muitas vezes e preciso usar `wp_set_object_terms` numa passagem apos criar o produto.

### Resumo

| Elemento | Valor na estamparia.pt (referencia) |
|----------|-------------------------------------|
| Taxonomia | `brand` |
| Termo (slug) | `valento` |
| URL publica | `https://estamparia.pt/brand/valento/` |

---

## Resumo alinhado ao pedido original (tipo de produto, categoria, nome, descricao, gramagem, cores, fotos)

| Pedido | Onde no WooCommerce |
|--------|---------------------|
| Tipo de produto | Categorias e/ou etiquetas; atributo "Tipo" se precisares de taxonomia propria |
| Categoria | Taxonomia `product_cat` (coluna `Categories` no CSV) |
| Nome | `Name` -- ver **Titulo do produto (convencao estamparia.pt)** |
| Descricao breve | `Short description` |
| Gramagem | Atributo de produto ou campo personalizado |
| Cores | Atributo global `Cor` + variacoes `variation` com `Attribute 1 name` / valor |
| Fotos por variacao | Imagem da variacao + galeria do pai |
| Marca VALENTO | Taxonomia `brand`, termo `valento`; ver secao **Marca VALENTO** |

---

## Exemplo CSV minimo (pai `variable` + 2 variacoes por cor)

Cenario: uma **Camiseta Basic BIKE**, duas cores, **precos diferentes** (Preto mais caro que Branco, como exemplo).

**Antes de importar:** em **Produtos > Atributos**, criar o atributo global **Cor** (slug `cor`) com termos **Branco** e **Preto** (o importador falha menos se os termos ja existirem). Opcional: atributo **Gramagem** so no pai (nao e variacao).

Ficheiro pronto a editar no repositorio:

`docs/exemplos/woocommerce-variable-bike-exemplo.csv`

Conteudo (mesmo do ficheiro; separador virgula, **UTF-8**):

```csv
Type,SKU,Name,Published,Is featured?,Visibility in catalog,Short description,Description,Tax status,In stock?,Stock,Regular price,Categories,Images,Parent,Attribute 1 name,Attribute 1 value(s),Attribute 1 visible,Attribute 1 global,Attribute 2 name,Attribute 2 value(s),Attribute 2 visible,Attribute 2 global
variable,VAL-BIKE,"(T-SHIRTS) (personalizado DTF) (Camiseta Basic BIKE)",1,0,visible,"T-shirt unisex 150 g/m2, malha jersey.","Modelo exemplo para importacao (precos ilustrativos, sem IVA).",taxable,1,,,T-shirts > Unisex,"https://www.exemplo.pt/imagens/bike-branco.jpg,https://www.exemplo.pt/imagens/bike-verso.jpg",,Cor,"Branco | Preto",1,1,Gramagem,"150 g/m2",1,0
variation,VAL-BIKE-BRANCO,"(T-SHIRTS) (personalizado DTF) (Camiseta Basic BIKE - Branco)",1,0,visible,,,taxable,1,10,4.20,T-shirts > Unisex,https://www.exemplo.pt/imagens/bike-branco.jpg,VAL-BIKE,Cor,Branco,1,1,,,,,
variation,VAL-BIKE-PRETO,"(T-SHIRTS) (personalizado DTF) (Camiseta Basic BIKE - Preto)",1,0,visible,,,taxable,1,5,5.80,T-shirts > Unisex,https://www.exemplo.pt/imagens/bike-preto.jpg,VAL-BIKE,Cor,Preto,1,1,,,,,
```

Notas:

- **`Name`**: segue a convencao `(Categoria menu) (personalizado DTF) (Nome do produto)`; ver secao **Titulo do produto**.
- **`Parent`**: no **pai** `variable`, a coluna `Parent` fica **vazia** (`...,,Cor,...` apos `Images`) para nao deslocar `Attribute 1 name`. Nas linhas `variation`, o valor e o **SKU do pai** (`VAL-BIKE`).
- **`Attribute 1 value(s)`** no pai: lista de opcoes separadas por **`|`** (`Branco | Preto`).
- **`Regular price`**: no exemplo, **5.80** (Preto) > **4.20** (Branco); na vitrine o WooCommerce mostra em geral **"desde 4.20"** (minimo), salvo personalizacao (ver secao acima).
- **`Images`**: no pai, **duas URLs** entre aspas (por causa da virgula interna) = destaque + segunda imagem na galeria; em cada variacao, **uma URL** = foto dessa **cor**. Substituir por URLs reais ou ficheiros na Media antes de importar em producao.
- Para **marcar automaticamente como VALENTO** sem coluna extra no CSV, usa o snippet em `docs/exemplos/snippets/valento-brand-importacao.php` (regra por SKU `VAL-` + taxonomia `brand`).

---

## Nota

Confirmar em **WooCommerce > Definicoes > Imposto** se os precos introduzidos sao **com ou sem IVA**, para bater certo com o texto "+ IVA" no sitio. Ajustar importacao em conformidade.
