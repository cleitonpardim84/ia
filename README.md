# Gestão Criatopo

MVP de site de gestão empresarial em Node.js, com autenticação, gestão de funcionários, gestão de clientes e persistência em MySQL.

## Funcionalidades

- Login e cadastro de usuários.
- Painel administrativo com gestão de funcionários.
- Painel administrativo com gestão de clientes.
- Endpoint de saúde em `/health`.

## Requisitos

- Node.js 20+
- Docker e Docker Compose (recomendado para subir o MySQL local)

## Como executar localmente

1. Copie o arquivo de ambiente:
   - `cp .env.example .env`
2. Suba o banco MySQL:
   - `docker compose up -d`
3. Aplique o schema:
   - `npm run db:init`
4. Inicie a aplicação:
   - `npm run start`
5. Acesse:
   - `http://localhost:3000`

## Importar por repositorio Git (Node.js)

Este projeto esta pronto para importacao em plataformas que aceitam deploy por repositorio Git.

Passos:

1. Suba este repositorio no GitHub.
2. Na plataforma de hospedagem, escolha "Aplicacao web Node.js" e "Importar do GitHub".
3. Defina variaveis de ambiente:
   - `PORT=3000`
   - `STORE_MODE=mysql`
   - `SESSION_SECRET=<valor-forte>`
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
4. Configure o comando de build/start:
   - Build: `npm install`
   - Start: `npm start`
5. Garanta que o banco MySQL da plataforma esteja criado e acessivel.

## Testes

- Execute: `npm test`

## Dominio em producao (resumo)

1. Hospede a aplicacao em um servidor Linux (ou plataforma cloud).
2. Configure Nginx como proxy reverso para a porta 3000.
3. Aponte o DNS do dominio para o IP do servidor.
4. Ative HTTPS com Certbot/Let's Encrypt.

## Observacao importante

O nome visual da aplicacao foi configurado como **Gestao Criatopo**.

## Estrutura

- `src/index.js`: bootstrap da aplicação.
- `src/createApp.js`: rotas, sessão e regras de acesso.
- `src/store/mysqlStore.js`: camada de persistência MySQL.
- `src/db/schema.sql`: script SQL de criação das tabelas.