# Gestao Empresa

Portal web de gestao interna da empresa com **MySQL**, autenticacao e integracao opcional com **GitHub Projects / Issues**.

Baseado nas praticas de planeamento do GitHub:
https://docs.github.com/pt/issues/planning-and-tracking-with-projects

## O que inclui

- Dashboard com indicadores (clientes, projetos, tarefas)
- Modulos: Clientes, Projetos, Tarefas
- Base de dados MySQL (Prisma ORM)
- Login com sessao segura (JWT em cookie httpOnly)
- Pagina GitHub para listar issues abertas do repositorio
- `docker-compose.yml` para MySQL local
- Build `standalone` para deploy em VPS com dominio proprio

## Requisitos

- Node.js 20+
- Docker (opcional, para MySQL local)
- Dominio apontado para o servidor (ex.: Hostinger VPS)
- MySQL 8 (local ou gerido)

## Inicio rapido (desenvolvimento)

```bash
# 1. Dependencias
cp .env.example .env
npm install

# 2. MySQL
docker compose up -d

# 3. Base de dados
npm run db:push

# 4. Servidor
npm run dev
```

Aceda a http://localhost:3000

**Primeiro login (padrao):**

- Email: `admin@suaempresa.pt`
- Senha: `admin123`

Altere via variaveis `ADMIN_EMAIL`, `ADMIN_PASSWORD` antes do primeiro `db:push`, ou crie outro utilizador na base de dados.

## Variaveis de ambiente

| Variavel | Descricao |
|----------|-----------|
| `DATABASE_URL` | URL MySQL (`mysql://user:pass@host:3306/db`) |
| `AUTH_SECRET` | Chave para sessoes (32+ caracteres) |
| `APP_URL` | URL publica com HTTPS (ex. dominio da empresa) |
| `GITHUB_TOKEN` | Token PAT com `repo` e `read:project` |
| `GITHUB_OWNER` | Utilizador ou organizacao GitHub |
| `GITHUB_REPO` | Repositorio para issues |
| `GITHUB_PROJECT_NUMBER` | Numero do Project (opcional) |

## Deploy com dominio (VPS + MySQL + HTTPS)

Fluxo recomendado para dominio proprio (ex. `gestao.suaempresa.pt`):

1. **Servidor**: VPS (Hostinger, DigitalOcean, etc.) com Ubuntu.
2. **MySQL**: instale MySQL 8 ou use base gerida; crie base `gestao_empresa` e utilizador.
3. **App**:
   ```bash
   git clone <repo>
   cd gestao-empresa
   cp .env.example .env
   # editar DATABASE_URL, AUTH_SECRET, APP_URL
   npm ci
   npm run db:push
   npm run build
   npm run start
   ```
4. **Process manager**: use `pm2` ou systemd para manter o Node ativo na porta 3000.
5. **Proxy reverso**: Nginx ou Caddy na porta 443 apontando para `localhost:3000`.
6. **HTTPS**: Let's Encrypt (`certbot`) no dominio.
7. **DNS**: registo A do dominio para o IP da VPS.

Exemplo minimo Nginx:

```nginx
server {
  server_name gestao.suaempresa.pt;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

## GitHub Projects

O portal complementa o GitHub Projects:

- Tarefas internas ficam no MySQL (clientes, prazos, prioridades).
- Issues do GitHub aparecem na pagina **GitHub Projects** quando o token esta configurado.
- Em cada projeto pode guardar a URL do Project GitHub para abrir o quadro oficial.

Documentacao: https://docs.github.com/pt/issues/planning-and-tracking-with-projects

## Scripts

| Comando | Funcao |
|---------|--------|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build producao |
| `npm run start` | Servidor producao |
| `npm run db:push` | Aplicar schema MySQL |
| `npm run db:studio` | UI Prisma |

## Proximos passos sugeridos

- Modulo financeiro (faturas, despesas)
- RH (colaboradores, ferias)
- Sincronizacao bidirecional GitHub Project -> tarefas locais
- Multi-empresa / permissoes por perfil
