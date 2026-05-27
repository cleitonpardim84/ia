# Importacao na Hostinger

Este projeto foi organizado para permitir uma importacao simples na Hostinger:
ficheiros do site em `public_html` e banco de dados pelo phpMyAdmin.

## 1. Publicar os ficheiros do site

1. Acesse o painel da Hostinger.
2. Abra o gestor de ficheiros do dominio.
3. Entre na pasta `public_html`.
4. Envie o conteudo da pasta `public/` deste repositorio:
   - `index.html`
   - `assets/styles.css`
   - `assets/app.js`
5. Acesse o dominio no navegador.

## 2. Criar e importar o MySQL

1. No painel da Hostinger, abra a area de bancos MySQL.
2. Crie um banco de dados e um usuario MySQL.
3. Guarde estes dados:
   - nome do banco;
   - usuario;
   - senha;
   - servidor/host MySQL.
4. Abra o phpMyAdmin.
5. Selecione o banco criado.
6. Use a opcao Importar.
7. Envie o ficheiro `database/schema.sql`.

## 3. Observacao importante

O MVP atual e um prototipo visual leve. Ele ja demonstra o fluxo dos modulos e
inclui o modelo MySQL, mas ainda nao grava dados no banco.

Para transformar em sistema operacional na Hostinger, o proximo passo e criar
um backend PHP usando os dados MySQL da hospedagem.

## 4. Estrutura recomendada no servidor

```text
public_html/
  index.html
  assets/
    styles.css
    app.js

mysql/
  schema.sql
```

Na Hostinger, o ficheiro SQL nao precisa ficar publico. Ele deve ser importado
pelo phpMyAdmin e pode ser guardado fora de `public_html`.

## 5. Proximo passo tecnico

Criar uma pasta `server/` com:

- `config.php`: dados de conexao MySQL.
- `db.php`: conexao PDO.
- `auth.php`: login e sessoes.
- `api/`: endpoints para usuarios, produtos, orcamentos, producao e financeiro.

Depois disso, a interface pode trocar os dados de exemplo por dados reais do
MySQL.
