import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/clientes", label: "Clientes" },
  { href: "/projetos", label: "Projetos" },
  { href: "/tarefas", label: "Tarefas" },
  { href: "/github", label: "GitHub Projects" },
];

export function Sidebar() {
  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        borderRight: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "1.5rem 1rem",
      }}
    >
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Gestao Empresa</div>
        <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
          MySQL + dominio proprio
        </div>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              padding: "0.55rem 0.75rem",
              borderRadius: "8px",
              color: "var(--text)",
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <form action="/api/auth/logout" method="post" style={{ marginTop: "2rem" }}>
        <button type="submit" className="btn btn-ghost" style={{ width: "100%" }}>
          Sair
        </button>
      </form>
    </aside>
  );
}
