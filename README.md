# Sistema de Gestao - Estamparia Lisboa

Aplicacao web para gerir uma estamparia em Lisboa, com login por perfil e fluxo entre atendimento, producao e administracao.

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

## Persistencia de dados

- Sem configuracao: funciona em `localStorage` (modo local).
- Com Supabase configurado: usa tabela remota `public.app_state` e mostra estado "Supabase ligado".
- Em caso de falha no Supabase: faz fallback para local e exibe aviso no topo.

## Conectar ao Supabase

### 1) Criar tabela no Supabase

No SQL Editor do Supabase, execute:

```sql
create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
```

### 2) Liberar leitura/escrita (MVP)

Para ambiente inicial de MVP, habilite RLS e permita acesso anonimo:

```sql
alter table public.app_state enable row level security;

create policy "anon_select_app_state"
on public.app_state
for select
to anon
using (true);

create policy "anon_insert_app_state"
on public.app_state
for insert
to anon
with check (true);

create policy "anon_update_app_state"
on public.app_state
for update
to anon
using (true)
with check (true);
```

### 3) Configurar credenciais no frontend

1. Copie `config.example.js` para `config.js`.
2. Preencha:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

Exemplo:

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
  SUPABASE_ANON_KEY: "SUA_CHAVE_ANON",
};
```

## Conectar a um dominio

### Opcao A: Vercel

1. Suba o projeto para GitHub.
2. Importe o repositorio na Vercel.
3. Deploy padrao de site estatico.
4. Em Domains, adicione o dominio (ex.: `gestao-estamparia.pt`).
5. Crie os registros DNS pedidos pela Vercel no provedor do dominio.

### Opcao B: Netlify

1. Importe o repositorio no Netlify.
2. Deploy de site estatico.
3. Em Domain management, adicione dominio customizado.
4. Configure os registros DNS (CNAME/A) conforme instrucoes da Netlify.

### DNS e HTTPS

- Aguarde propagacao DNS.
- Valide que HTTPS foi emitido.
- Em Supabase Authentication > URL Configuration (se usar auth nativo depois), adicione o novo dominio em Site URL.

## Executar localmente

Como o projeto e estatico, rode:

- `python3 -m http.server 4180`

Depois aceda a `http://localhost:4180`.