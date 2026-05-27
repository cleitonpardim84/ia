import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/");

  const params = await searchParams;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "1rem",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: "420px" }}>
        <h1 style={{ marginTop: 0 }}>Entrar</h1>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Portal de gestao da empresa
        </p>
        {params.error ? (
          <p style={{ color: "var(--danger)" }}>{params.error}</p>
        ) : null}
        <form action="/api/auth/login" method="post" style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Senha
            </label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Acessar
          </button>
        </form>
        <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginBottom: 0 }}>
          Primeiro acesso: use o admin padrao definido em ADMIN_EMAIL / ADMIN_PASSWORD.
        </p>
      </div>
    </div>
  );
}
