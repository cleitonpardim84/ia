import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { ensureDefaultAdmin, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGitHubConfig } from "@/lib/github";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await ensureDefaultAdmin();
  const user = await getSessionUser();

  const [clients, projects, tasks, openTasks] = await Promise.all([
    prisma.client.count({ where: { active: true } }),
    prisma.project.count({ where: { status: "active" } }),
    prisma.task.count(),
    prisma.task.count({
      where: { status: { in: ["TODO", "IN_PROGRESS", "BLOCKED"] } },
    }),
  ]);

  const recentTasks = await prisma.task.findMany({
    take: 5,
    orderBy: { updatedAt: "desc" },
    include: { project: { select: { name: true } } },
  });

  const github = getGitHubConfig();

  return (
    <AppShell title={`Ola, ${user?.name ?? "equipe"}`}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <StatCard label="Clientes ativos" value={clients} />
        <StatCard label="Projetos ativos" value={projects} />
        <StatCard label="Tarefas abertas" value={openTasks} hint={`${tasks} no total`} />
        <StatCard
          label="GitHub"
          value={github ? "Ligado" : "Opcional"}
          hint={github ? `${github.owner}/${github.repo}` : "Configure no .env"}
        />
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Tarefas recentes</h2>
          <Link href="/tarefas" className="btn btn-ghost">
            Ver todas
          </Link>
        </div>
        {recentTasks.length === 0 ? (
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Nenhuma tarefa ainda. Crie em{" "}
            <Link href="/tarefas" style={{ color: "var(--accent)" }}>
              Tarefas
            </Link>
            .
          </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
            {recentTasks.map((task) => (
              <li key={task.id} style={{ marginBottom: "0.5rem" }}>
                {task.title}
                {task.project ? (
                  <span style={{ color: "var(--muted)" }}> — {task.project.name}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
