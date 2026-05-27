import { AppShell } from "@/components/AppShell";
import { getGitHubConfig, getProjectSummary, listOpenIssues } from "@/lib/github";

export const dynamic = "force-dynamic";

export default async function GitHubPage() {
  const config = getGitHubConfig();
  let issues: Awaited<ReturnType<typeof listOpenIssues>> = [];
  let projectSummary: Awaited<ReturnType<typeof getProjectSummary>> = {
    configured: false,
  };
  let error: string | null = null;

  if (config) {
    try {
      [issues, projectSummary] = await Promise.all([
        listOpenIssues(),
        getProjectSummary(),
      ]);
    } catch (e) {
      error = e instanceof Error ? e.message : "Erro ao contactar GitHub";
    }
  }

  return (
    <AppShell title="GitHub Projects">
      <div style={{ display: "grid", gap: "1rem" }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Integracao</h2>
          {!config ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Configure <code>GITHUB_TOKEN</code>, <code>GITHUB_OWNER</code> e{" "}
              <code>GITHUB_REPO</code> no ficheiro <code>.env</code> para sincronizar
              issues com o portal. Consulte a documentacao oficial:{" "}
              <a
                href="https://docs.github.com/pt/issues/planning-and-tracking-with-projects"
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent)" }}
              >
                Planejamento com Projects
              </a>
              .
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              Repositório: <strong>{config.owner}/{config.repo}</strong>
              {config.projectNumber
                ? ` · Project #${config.projectNumber}`
                : " · (defina GITHUB_PROJECT_NUMBER para resumo do project)"}
            </p>
          )}
          {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Issues abertas (GitHub)</h2>
          {!config ? (
            <p style={{ color: "var(--muted)" }}>Integracao desativada.</p>
          ) : issues.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>Nenhuma issue aberta ou sem permissao.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {issues.map((issue) => (
                <li key={issue.id} style={{ marginBottom: "0.5rem" }}>
                  <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--accent)" }}
                  >
                    #{issue.number} {issue.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {projectSummary.configured ? (
          <div className="card">
            <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Projects (preview API)</h2>
            <pre
              style={{
                overflow: "auto",
                fontSize: "0.8rem",
                background: "var(--surface-2)",
                padding: "0.75rem",
                borderRadius: "8px",
              }}
            >
              {JSON.stringify(projectSummary, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
