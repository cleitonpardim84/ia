import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function createProject(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const clientId = String(formData.get("clientId") ?? "").trim() || null;

  await prisma.project.create({
    data: {
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      clientId,
      githubProjectUrl: String(formData.get("githubProjectUrl") ?? "").trim() || null,
    },
  });
  revalidatePath("/projetos");
}

export const dynamic = "force-dynamic";

export default async function ProjetosPage() {
  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true } },
        _count: { select: { tasks: true } },
      },
    }),
    prisma.client.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <AppShell title="Projetos">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 380px) 1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <form action={createProject} className="card" style={{ display: "grid", gap: "0.75rem" }}>
          <h2 style={{ margin: 0, fontSize: "1rem" }}>Novo projeto</h2>
          <div>
            <label className="label" htmlFor="name">
              Nome *
            </label>
            <input className="input" id="name" name="name" required />
          </div>
          <div>
            <label className="label" htmlFor="clientId">
              Cliente
            </label>
            <select className="input" id="clientId" name="clientId" defaultValue="">
              <option value="">Sem cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="description">
              Descricao
            </label>
            <textarea className="input" id="description" name="description" rows={3} />
          </div>
          <div>
            <label className="label" htmlFor="githubProjectUrl">
              URL GitHub Project
            </label>
            <input
              className="input"
              id="githubProjectUrl"
              name="githubProjectUrl"
              placeholder="https://github.com/orgs/.../projects/1"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Criar projeto
          </button>
        </form>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Lista ({projects.length})</h2>
          {projects.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>Sem projetos.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {projects.map((project) => (
                <li
                  key={project.id}
                  style={{
                    padding: "0.75rem 0",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <strong>{project.name}</strong>
                  <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    {project.client?.name ?? "Interno"} · {project._count.tasks} tarefas
                  </div>
                  {project.githubProjectUrl ? (
                    <a
                      href={project.githubProjectUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--accent)", fontSize: "0.85rem" }}
                    >
                      Abrir no GitHub
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
