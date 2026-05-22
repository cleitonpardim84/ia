# Ficheiros de exemplo (download para pasta local)

Estes ficheiros estao no repositorio Git, na pasta **`docs/exemplos/`**.

**Importante:** no GitHub estes ficheiros estao na branch **`cursor/woocommerce-estamparia-import-061a`**. Se clonaste o repo e estas em **`main`**, a pasta **`docs/exemplos`** pode **nao existir** ate fazeres merge dessa branch ou mudares de branch (ver Opcao 2 abaixo).

## Abrir no GitHub (sem procurar pastas no disco)

Pasta com todos os exemplos:

https://github.com/cleitonpardim84/ia/tree/cursor/woocommerce-estamparia-import-061a/docs/exemplos

Descarregar o CSV directamente (clicar com botao direito > Guardar ligacao como, ou abrir e Ctrl+S):

https://raw.githubusercontent.com/cleitonpardim84/ia/cursor/woocommerce-estamparia-import-061a/docs/exemplos/woocommerce-variable-bike-exemplo.csv

## Opcao 1: Ja tens o projeto aberto no Cursor / disco

1. No explorador de ficheiros do sistema operativo, abre a pasta do projeto **`ia`**.
2. Entra em **`docs`** > **`exemplos`**.
3. Copia para a pasta onde queres trabalhar (ex.: `Descargas`, pasta da importacao WooCommerce):
   - `woocommerce-variable-bike-exemplo.csv`
   - `snippets/valento-brand-importacao.php` (se precisares do snippet)

Os guias em Markdown ficam em **`docs/`** (um nivel acima): `woocommerce-estamparia-importacao.md`, etc.

## Opcao 2: Clonar o repositorio no teu PC

No terminal, na pasta onde queres o projeto:

```bash
git clone https://github.com/cleitonpardim84/ia.git
cd ia
```

Se os exemplos estiverem numa branch de trabalho (ex.: `cursor/woocommerce-estamparia-import-061a`):

```bash
git fetch origin
git checkout cursor/woocommerce-estamparia-import-061a
```

Depois os ficheiros estao em **`ia/docs/exemplos/`**.

## Opcao 3: Download directo de um ficheiro (GitHub)

No navegador, abre o repositorio **cleitonpardim84/ia** no GitHub, navega ate **`docs/exemplos/`**, clica no ficheiro **`.csv`** e usa **Raw** > guardar como (ou botao de download do GitHub).

Alternativa URL raw (troca `main` pelo nome da branch se o ficheiro ainda nao estiver em `main`):

`https://raw.githubusercontent.com/cleitonpardim84/ia/main/docs/exemplos/woocommerce-variable-bike-exemplo.csv`

## Importar na loja

O CSV editado importa-se no WordPress: **Produtos > Importar** (WooCommerce). O ficheiro **nao** fica na loja ate carregares esse passo; antes fica so na **tua pasta local**.
