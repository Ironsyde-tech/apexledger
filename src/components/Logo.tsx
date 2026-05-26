import { Link } from "react-router-dom";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={className} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
    <div style={{ width: 36, height: 36, background: "var(--gold)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><polygon points="10,3 17,16 3,16" stroke="#fff" strokeWidth="1.8" fill="none" /></svg>
    </div>
    <div>
      <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", fontFamily: "Inter, sans-serif", lineHeight: 1.1 }}>Apex Ledger</div>
    </div>
  </Link>
);
