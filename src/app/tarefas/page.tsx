import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

const statusClass: Record<string, string> = {
  TODO: "badge badge-todo",
  IN_PROGRESS: "badge badge-progress",
  DONE: "badge badge-done",
  BLOCKED: "badge badge-blocked",
};

async function createTask(formData: FormData) {
  "use server";
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const projectId = String(formData.get("projectId") ?? "").trim() || null;

  await prisma.task.create({
    data: {
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      status: (String(formData.get("status") ?? "TODO") as "TODO") || "TODO",
      priority: (String(formData.get("priority") ?? "MEDIUM") as "MEDIUM") || "MEDIUM",
      projectId,
    },
  });
  revalidatePath("/tarefas");
  revalidatePath("/");
}

export const dynamic = "force-dynamic";

export default async function TarefasPage() {
  const [tasks, projects] = await Promise.all([
    prisma.task.findMany({
      orderBy: { updatedAt: "desc" },
      include: { project: { select: { name: true } } },
    }),
    prisma.project.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <AppShell title="Tarefas">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 380px) 1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <form action={createTask} className="card" style={{ display: "grid", gap: "0.75rem" }}>
          <h2 style={{ margin: 0, fontSize: "1rem" }}>Nova tarefa</h2>
          <div>
            <label className="label" htmlFor="title">
              Titulo *
            </label>
            <input className="input" id="title" name="title" required />
          </div>
          <div>
            <label className="label" htmlFor="projectId">
              Projeto
            </label>
            <select className="input" id="projectId" name="projectId" defaultValue="">
              <option value="">Sem projeto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <div>
              <label className="label" htmlFor="status">
                Estado
              </label>
              <select className="input" id="status" name="status" defaultValue="TODO">
                <option value="TODO">A fazer</option>
                <option value="IN_PROGRESS">Em curso</option>
                <option value="DONE">Concluida</option>
                <option value="BLOCKED">Bloqueada</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="priority">
                Prioridade
              </label>
              <select className="input" id="priority" name="priority" defaultValue="MEDIUM">
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="description">
              Descricao
            </label>
            <textarea className="input" id="description" name="description" rows={3} />
          </div>
          <button type="submit" className="btn btn-primary">
            Adicionar
          </button>
        </form>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Quadro ({tasks.length})</h2>
          {tasks.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>Sem tarefas.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {tasks.map((task) => (
                <li
                  key={task.id}
                  style={{
                    padding: "0.75rem 0",
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <strong>{task.title}</strong>
                    <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                      {task.project?.name ?? "Geral"} · {task.priority}
                    </div>
                  </div>
                  <span className={statusClass[task.status] ?? "badge"}>
                    {task.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
