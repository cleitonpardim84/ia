const bcrypt = require("bcryptjs");
const express = require("express");
const session = require("express-session");
const { APP_NAME, escapeHtml, renderLayout } = require("./render");

function parseInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
    return;
  }
  next();
}

function renderAuthPage({ title, action, buttonLabel, error }) {
  const errorHtml = error
    ? `<p style="color:#a00;">${escapeHtml(error)}</p>`
    : "";
  const switchLink =
    action === "/register"
      ? `<p>Ja tem conta? <a href="/login">Entrar</a></p>`
      : "";

  return `<h2>${escapeHtml(title)}</h2>
${errorHtml}
<form method="post" action="${action}">
  <input name="username" placeholder="Usuario" required />
  <input name="password" type="password" placeholder="Senha (minimo 6 caracteres)" required />
  <button type="submit">${escapeHtml(buttonLabel)}</button>
</form>
${switchLink}`;
}

function renderRows(items, rowRenderer, emptyText) {
  if (items.length === 0) {
    return `<tr><td colspan="5">${escapeHtml(emptyText)}</td></tr>`;
  }
  return items.map(rowRenderer).join("");
}

function renderDashboard({ user, employees, clients }) {
  return `
<h2>Painel de Gestao</h2>
<p>Controle interno de funcionarios e carteira de clientes para ${escapeHtml(APP_NAME)}.</p>
<nav>
  <a href="/dashboard">Atualizar painel</a>
  <a href="/health">Ver status do servico</a>
</nav>
<section>
  <h3>Funcionarios</h3>
  <form method="post" action="/employees">
    <input name="name" placeholder="Nome" required />
    <input name="email" type="email" placeholder="E-mail" />
    <input name="department" placeholder="Departamento" />
    <button type="submit">Cadastrar funcionario</button>
  </form>
  <table>
    <thead>
      <tr>
        <th>ID</th><th>Nome</th><th>Email</th><th>Departamento</th><th>Acoes</th>
      </tr>
    </thead>
    <tbody>
      ${renderRows(
        employees,
        (employee) => `<tr>
          <td>${employee.id}</td>
          <td>${escapeHtml(employee.name)}</td>
          <td>${escapeHtml(employee.email ?? "")}</td>
          <td>${escapeHtml(employee.department ?? "")}</td>
          <td class="row-actions">
            <form method="post" action="/employees/delete">
              <input type="hidden" name="id" value="${employee.id}" />
              <button type="submit">Remover</button>
            </form>
          </td>
        </tr>`,
        "Nenhum funcionario cadastrado.",
      )}
    </tbody>
  </table>
</section>
<section>
  <h3>Clientes</h3>
  <form method="post" action="/clients">
    <input name="name" placeholder="Nome" required />
    <input name="email" type="email" placeholder="E-mail" />
    <input name="company" placeholder="Empresa" />
    <button type="submit">Cadastrar cliente</button>
  </form>
  <table>
    <thead>
      <tr>
        <th>ID</th><th>Nome</th><th>Email</th><th>Empresa</th><th>Acoes</th>
      </tr>
    </thead>
    <tbody>
      ${renderRows(
        clients,
        (client) => `<tr>
          <td>${client.id}</td>
          <td>${escapeHtml(client.name)}</td>
          <td>${escapeHtml(client.email ?? "")}</td>
          <td>${escapeHtml(client.company ?? "")}</td>
          <td class="row-actions">
            <form method="post" action="/clients/delete">
              <input type="hidden" name="id" value="${client.id}" />
              <button type="submit">Remover</button>
            </form>
          </td>
        </tr>`,
        "Nenhum cliente cadastrado.",
      )}
    </tbody>
  </table>
</section>`;
}

function createApp({ store, sessionSecret, sessionStore, sessionStoreMode = "memory" }) {
  if (!store) {
    throw new Error("Store obrigatoria para criar a aplicacao.");
  }

  const app = express();
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(express.urlencoded({ extended: false }));
  const sessionConfig = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
    },
  };
  if (sessionStore) {
    sessionConfig.store = sessionStore;
  }

  app.use(
    session(sessionConfig),
  );

  app.get("/health", (req, res) => {
    res.json({ status: "ok", store: store.mode, session_store: sessionStoreMode });
  });

  app.get("/", (req, res) => {
    if (req.session.user) {
      res.redirect("/dashboard");
      return;
    }
    res.redirect("/login");
  });

  app.get("/register", (req, res) => {
    res.send(
      renderLayout({
        title: "Cadastro",
        user: req.session.user,
        notice: req.query.notice,
        content: renderAuthPage({
          title: "Criar conta",
          action: "/register",
          buttonLabel: "Cadastrar",
          error: req.query.error,
        }),
      }),
    );
  });

  app.post("/register", async (req, res) => {
    const username = String(req.body.username ?? "").trim();
    const password = String(req.body.password ?? "").trim();

    if (!username || password.length < 6) {
      res.redirect(
        "/register?error=Usuario obrigatorio e senha com minimo de 6 caracteres.",
      );
      return;
    }

    const existingUser = await store.findUserByUsername(username);
    if (existingUser) {
      res.redirect("/register?error=Usuario ja cadastrado.");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await store.createUser({ username, passwordHash });
    req.session.user = { id: user.id, username: user.username };
    res.redirect("/dashboard?notice=Cadastro realizado com sucesso.");
  });

  app.get("/login", (req, res) => {
    res.send(
      renderLayout({
        title: "Login",
        user: req.session.user,
        notice: req.query.notice,
        content: renderAuthPage({
          title: "Entrar",
          action: "/login",
          buttonLabel: "Acessar",
          error: req.query.error,
        }),
      }),
    );
  });

  app.post("/login", async (req, res) => {
    const username = String(req.body.username ?? "").trim();
    const password = String(req.body.password ?? "").trim();
    const user = await store.findUserByUsername(username);

    if (!user) {
      res.redirect("/login?error=Credenciais invalidas.");
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.redirect("/login?error=Credenciais invalidas.");
      return;
    }

    req.session.user = { id: user.id, username: user.username };
    res.redirect("/dashboard?notice=Login realizado.");
  });

  app.post("/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/login?notice=Sessao encerrada.");
    });
  });

  app.get("/dashboard", requireAuth, async (req, res) => {
    const [employees, clients] = await Promise.all([
      store.listEmployees(),
      store.listClients(),
    ]);

    res.send(
      renderLayout({
        title: "Painel",
        user: req.session.user,
        notice: req.query.notice,
        content: renderDashboard({
          user: req.session.user,
          employees,
          clients,
        }),
      }),
    );
  });

  app.post("/employees", requireAuth, async (req, res) => {
    const name = String(req.body.name ?? "").trim();
    const email = String(req.body.email ?? "").trim();
    const department = String(req.body.department ?? "").trim();

    if (!name) {
      res.redirect("/dashboard?notice=Nome do funcionario e obrigatorio.");
      return;
    }

    await store.createEmployee({ name, email, department });
    res.redirect("/dashboard?notice=Funcionario cadastrado.");
  });

  app.post("/employees/delete", requireAuth, async (req, res) => {
    const id = parseInteger(req.body.id);
    if (id !== null) {
      await store.deleteEmployee(id);
    }
    res.redirect("/dashboard?notice=Funcionario removido.");
  });

  app.post("/clients", requireAuth, async (req, res) => {
    const name = String(req.body.name ?? "").trim();
    const email = String(req.body.email ?? "").trim();
    const company = String(req.body.company ?? "").trim();

    if (!name) {
      res.redirect("/dashboard?notice=Nome do cliente e obrigatorio.");
      return;
    }

    await store.createClient({ name, email, company });
    res.redirect("/dashboard?notice=Cliente cadastrado.");
  });

  app.post("/clients/delete", requireAuth, async (req, res) => {
    const id = parseInteger(req.body.id);
    if (id !== null) {
      await store.deleteClient(id);
    }
    res.redirect("/dashboard?notice=Cliente removido.");
  });

  return app;
}

module.exports = {
  createApp,
};
