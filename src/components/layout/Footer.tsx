import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export const Footer = () => (
  <footer style={{ background: "var(--navy)", color: "rgba(255,255,255,0.7)" }}>
    <div className="container" style={{ padding: "48px 48px 32px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr", gap: 48, marginBottom: 40 }}>
        <div>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, background: "var(--gold)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><polygon points="10,3 17,16 3,16" stroke="#fff" strokeWidth="1.8" fill="none" /></svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#fff", fontFamily: "Inter, sans-serif" }}>Apex Ledger</span>
          </Link>
          <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 260, color: "rgba(255,255,255,0.5)" }}>
            A premium knowledge hub for crypto traders, forex practitioners, and market enthusiasts.
          </p>
        </div>
        <div>
          <h5 style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 16, letterSpacing: 0.5 }}>Learn</h5>
          <FooterLink to="/courses">All courses</FooterLink>
          <FooterLink to="/dashboard">My dashboard</FooterLink>
          <FooterLink to="/about">About us</FooterLink>
        </div>
        <div>
          <h5 style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 16, letterSpacing: 0.5 }}>Support</h5>
          <FooterLink to="/contact">Contact</FooterLink>
          <FooterLink to="/terms">Terms of Service</FooterLink>
          <FooterLink to="/privacy">Privacy Policy</FooterLink>
        </div>
        <div>
          <h5 style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 16, letterSpacing: 0.5 }}>Payments</h5>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600 }}>
              <strong style={{ color: "var(--gold)" }}>USDT</strong> TRC20
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600 }}>
              <strong style={{ color: "var(--gold)" }}>USDT</strong> ERC20
            </span>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>Secure on-chain verification</p>
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>© {new Date().getFullYear()} Apex Ledger. All rights reserved.</span>
        <div style={{ display: "flex", gap: 20 }}>
          <Link to="/terms" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Terms</Link>
          <Link to="/privacy" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Privacy</Link>
        </div>
      </div>
    </div>
  </footer>
);

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return <Link to={to} style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none", marginBottom: 10, transition: "color 0.15s" }}>{children}</Link>;
}
