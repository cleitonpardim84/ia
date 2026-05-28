# Gestão Criatopo

MVP de site de gestão empresarial em Node.js, com autenticação, gestão de funcionários e gestão de clientes.

## Funcionalidades

- Login e cadastro de usuários.
- Painel administrativo com gestão de funcionários.
- Painel administrativo com gestão de clientes.
- Painel administrativo com gestão de fornecedores.
- Painel administrativo com tarefas operacionais.
- Endpoint de saúde em `/health`.
- Persistencia opcional em MySQL (modo padrao sem banco usa memoria).

## Requisitos

- Node.js 20+
- Docker e Docker Compose (recomendado para subir o MySQL local)

## Como executar localmente (sem MySQL)

1. Copie o arquivo de ambiente:
   - `cp .env.example .env`
2. Inicie a aplicação:
   - `npm run start`
3. Acesse:
   - `http://localhost:3000`

## Como executar com MySQL (opcional)

1. Copie o arquivo de ambiente:
   - `cp .env.example .env`
2. Edite o `.env` e defina:
   - `STORE_MODE=mysql`
3. Suba o banco MySQL:
   - `docker compose up -d`
4. Aplique o schema:
   - `npm run db:init`
5. Inicie a aplicacao:
   - `npm run start`

## Importar por repositorio Git (Node.js)

Este projeto esta pronto para importacao em plataformas que aceitam deploy por repositorio Git.

Passos:

1. Suba este repositorio no GitHub.
2. Na plataforma de hospedagem, escolha "Aplicacao web Node.js" e "Importar do GitHub".
3. Defina variaveis de ambiente:
   - `PORT=3000`
   - `STORE_MODE=memory` (ou `mysql` em producao)
   - `SESSION_STORE_MODE=auto` (use `mysql` em producao com banco)
   - `SESSION_SECRET=<valor-forte>`
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (somente se `STORE_MODE=mysql`)
4. Configure o comando de build/start:
   - Build: `npm install`
   - Start: `npm start`
5. Se usar MySQL, garanta que o banco esteja criado e acessivel.

### Sessao em producao

- O projeto suporta `SESSION_STORE_MODE=auto|memory|mysql`.
- Recomendado em producao: `SESSION_STORE_MODE=mysql` para persistencia de sessao.
- Em modo inicial sem banco, use `SESSION_STORE_MODE=memory`.

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
- `src/sessionStore.js`: estrategia de sessao para memoria/MySQL.