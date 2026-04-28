# Sistema de Gestao - Estamparia Lisboa (Hostinger Full)

Aplicacao web para gerir uma estamparia em Lisboa com backend proprio (PHP + MySQL), login por perfil e persistencia central no servidor.

## Stack desta versao

- Frontend estatico: `index.html`, `styles.css`, `app.js`
- API backend: `api/index.php` (roteador), `api/auth.php`, `api/state.php`, `api/lib.php`, `api/config.php`
- Base de dados MySQL: `hostinger/database.sql`

## Perfis e logins de demo

- Admin: `admin` / `admin123`
- Atendente: `atendente` / `atendente123`
- Producao: `producao` / `producao123`

## Funcionalidades principais

- Formulario online de pedido preenchido pela atendente e enviado para producao.
- Status de pedidos: `Em producao`, `Aguardando pagamento 50%`, `Pagamento 100%`.
- Gestao de tamanhos, cores e fornecedores (menu Admin).
- Gerenciamento de stock com entradas, saidas, alerta de nivel minimo e abatimento automatico ao criar pedido.
- Menu de producao para atualizar estado e notas de oficina.
- Menu de perdas e despesas no Admin.
- Painel financeiro de lucros e despesas com valores agregados.
- Dados centralizados no MySQL (todos os utilizadores veem o mesmo estado).

## Instalar na Hostinger (public_html)

1. Envie todos os arquivos para `public_html`:
   - `index.html`, `styles.css`, `app.js`, `config.js`
   - pasta `api/`
   - pasta `hostinger/` (opcional manter no servidor; pode remover depois de importar SQL)
2. No painel MySQL da Hostinger, crie uma base (ex.: `estamparia_lisboa`).
3. Importe `hostinger/database.sql` no phpMyAdmin.
4. Edite `api/config.php` com os dados reais:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASS`
5. Aceda ao dominio e valide login.

## Configuracao de dominio `shope.pt` na Hostinger (com Vercel)

Se continuar usando Vercel no frontend:

- `A` para `@` -> `76.76.21.21`
- `CNAME` para `www` -> `cname.vercel-dns.com`
- Remover registros conflitantes antigos em `@` e `www`.

Se rodar totalmente no servidor Hostinger (sem Vercel), aponte o dominio para a hospedagem da própria Hostinger e nao use os alvos da Vercel.

## Estrutura da API

- `POST /api/index.php?route=auth/login`
- `POST /api/index.php?route=auth/logout`
- `GET /api/index.php?route=auth/session`
- `GET /api/index.php?route=state`
- `PUT /api/index.php?route=state` (admin)

## SQL/Migracoes Supabase antigas

A pasta `supabase/migrations` foi mantida no repo apenas como referencia historica.
Esta versao Hostinger Full usa MySQL (`hostinger/database.sql`) como fonte principal.
