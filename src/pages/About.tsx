import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useReveal, useCounter } from "@/hooks/useReveal";
import { BookOpen, Users, Globe, Award, Shield, Target, Sparkles } from "lucide-react";

function StatCard({ icon: Icon, value, label, suffix = "" }: { icon: any; value: number; label: string; suffix?: string }) {
  const { ref, isVisible } = useReveal<HTMLDivElement>();
  const count = useCounter(value, 2000, isVisible);
  return (
    <div ref={ref} className="reveal" style={{ textAlign: "center", padding: 24 }}>
      <Icon style={{ width: 28, height: 28, color: "var(--gold)", margin: "0 auto 12px" }} />
      <p style={{ fontSize: 32, fontWeight: 700, color: "var(--text)", fontFamily: "Inter, sans-serif" }}>{count}{suffix}</p>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{label}</p>
    </div>
  );
}

export default function About() {
  return (
    <>
      <SEO title="About" description="Apex Ledger — a premium knowledge hub for ambitious traders." />

      {/* Hero */}
      <section style={{ background: "var(--navy)", color: "#fff", padding: "64px 0" }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <span className="kicker animate-fade-up" style={{ color: "var(--gold)", marginBottom: 16, display: "block" }}>About Apex Ledger</span>
          <h1 className="animate-fade-up" style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 500, lineHeight: 1.15, marginBottom: 16, color: "#fff", animationDelay: "0.1s" }}>A quiet academy for a noisy world.</h1>
          <p className="animate-fade-up" style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 600, animationDelay: "0.2s" }}>
            Apex Ledger was built on a simple idea: that learning to navigate markets should feel less like gambling and more like a craft.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: "var(--bg-alt)", borderBottom: "1px solid var(--border)" }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          <StatCard icon={BookOpen} value={15} label="Expert courses" suffix="+" />
          <StatCard icon={Users} value={500} label="Active students" suffix="+" />
          <StatCard icon={Globe} value={12} label="Countries" suffix="+" />
          <StatCard icon={Award} value={98} label="Satisfaction" suffix="%" />
        </div>
      </section>

      {/* Values */}
      <section className="section" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="kicker" style={{ marginBottom: 8, display: "block" }}>Our values</span>
            <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 28, fontWeight: 700, color: "var(--text)" }}>What we stand for</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { icon: Shield, title: "Grounded", text: "We teach what works in practice — not what trends on social media." },
              { icon: Target, title: "Considered", text: "Every lesson is shaped by mentors with real, lived experience." },
              { icon: Sparkles, title: "Crafted", text: "Clean writing, beautiful design, honest pacing. No filler." },
            ].map(v => (
              <div key={v.title} className="card-flat" style={{ padding: 28, textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--gold-bg)", border: "1px solid var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <v.icon style={{ width: 24, height: 24, color: "var(--gold-dark)" }} />
                </div>
                <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{v.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section" style={{ background: "var(--bg-alt)", borderBottom: "1px solid var(--border)", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 680 }}>
          <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 28, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Our mission</h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            To make world-class market education accessible, honest, and beautifully presented — so that anyone with ambition can develop real trading skill, regardless of where they start.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="section" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>How it began</h2>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>
            Apex Ledger began as a small reading group between practitioners and friends. What started as evening discussions over markets, books, and strategy eventually became a library — and then a platform.
          </p>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 32 }}>
            We chose the name Apex Ledger for what it represents: reaching the peak through clear, recorded knowledge. The markets reward those who think clearly. We're here to help you do exactly that.
          </p>
          <Link to="/courses" className="btn-primary" style={{ borderRadius: 8 }}>Explore courses</Link>
        </div>
      </section>
    </>
  );
}
