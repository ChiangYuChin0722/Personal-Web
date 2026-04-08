export default function FunPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>Fun Things</h1>
        <p style={{ color: "#94a3b8", marginBottom: "24px" }}>Coming soon...</p>
        <a href="/dashboard" style={{ color: "#93c5fd", fontSize: "14px" }}>← Back to dashboard</a>
      </div>
    </div>
  );
}
