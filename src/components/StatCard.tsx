export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card">
      <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{label}</div>
      <div style={{ fontSize: "2rem", fontWeight: 700, margin: "0.35rem 0" }}>
        {value}
      </div>
      {hint ? (
        <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{hint}</div>
      ) : null}
    </div>
  );
}
