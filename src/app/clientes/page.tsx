import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function createClient(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.client.create({
    data: {
      name,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      company: String(formData.get("company") ?? "").trim() || null,
    },
  });
  revalidatePath("/clientes");
}

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { projects: true } } },
  });

  return (
    <AppShell title="Clientes">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 360px) 1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <form action={createClient} className="card" style={{ display: "grid", gap: "0.75rem" }}>
          <h2 style={{ margin: 0, fontSize: "1rem" }}>Novo cliente</h2>
          <div>
            <label className="label" htmlFor="name">
              Nome *
            </label>
            <input className="input" id="name" name="name" required />
          </div>
          <div>
            <label className="label" htmlFor="company">
              Empresa
            </label>
            <input className="input" id="company" name="company" />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input className="input" id="email" name="email" type="email" />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Telefone
            </label>
            <input className="input" id="phone" name="phone" />
          </div>
          <button type="submit" className="btn btn-primary">
            Guardar
          </button>
        </form>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Lista ({clients.length})</h2>
          {clients.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>Sem clientes registados.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: "0.85rem" }}>
                  <th style={{ paddingBottom: "0.5rem" }}>Nome</th>
                  <th>Empresa</th>
                  <th>Projetos</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.65rem 0" }}>{client.name}</td>
                    <td>{client.company ?? "—"}</td>
                    <td>{client._count.projects}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
