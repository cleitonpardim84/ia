import { Sidebar } from "./Sidebar";

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem" }}>
        <h1 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "1.75rem" }}>
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}
