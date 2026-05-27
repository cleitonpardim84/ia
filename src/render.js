const APP_NAME = "Gestao Criatopo";
const APP_TITLE = "Gestão Criatopo";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderLayout({ title, user, content, notice }) {
  const authBlock = user
    ? `<form method="post" action="/logout"><button type="submit">Sair</button></form>`
    : "";
  const userBlock = user
    ? `<p>Usuario logado: <strong>${escapeHtml(user.username)}</strong></p>`
    : "";
  const noticeBlock = notice
    ? `<p style="padding:8px;background:#eef;border-radius:6px;">${escapeHtml(notice)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} - ${APP_TITLE}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #202124; background: #fafafa; }
      main { max-width: 1000px; margin: 0 auto; background: white; border: 1px solid #ddd; border-radius: 10px; padding: 24px; }
      h1, h2 { margin-top: 0; }
      section { border-top: 1px solid #e7e7e7; margin-top: 24px; padding-top: 16px; }
      form { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
      input, button { padding: 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      .row-actions form { margin: 0; }
      nav a { margin-right: 8px; }
    </style>
  </head>
  <body>
    <main>
      <h1>${APP_TITLE}</h1>
      ${userBlock}
      ${authBlock}
      ${noticeBlock}
      ${content}
    </main>
  </body>
</html>`;
}

module.exports = {
  APP_NAME,
  APP_TITLE,
  escapeHtml,
  renderLayout,
};
