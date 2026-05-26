import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Award, Shield, Star, Clock, CheckCircle } from "lucide-react";
import { CourseCard } from "@/components/CourseCard";
import { CourseCardSkeleton } from "@/components/CourseCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { fetchCourses, type CourseListItem } from "@/lib/courses";
import { SEO } from "@/components/SEO";
import { useReveal, useCounter } from "@/hooks/useReveal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const categories = ["All", "Crypto", "Forex", "Psychology", "Strategy"];

const popularCourses = [
  { title: "Mastering BTC Breakouts", provider: "Apex Ledger", type: "Course", rating: "4.9", img: "₿" },
  { title: "SNR Forex Mastery", provider: "Apex Ledger", type: "Professional Certificate", rating: "4.8", img: "FX" },
  { title: "The Disciplined Trader", provider: "Apex Ledger", type: "Specialization", rating: "4.9", img: "ψ" },
];
const newCourses = [
  { title: "On-Chain Analysis Pro", provider: "Apex Ledger", type: "Course", rating: "4.7", img: "⛓" },
  { title: "Risk Management Toolkit", provider: "Apex Ledger", type: "Course", rating: "4.8", img: "⚖" },
  { title: "DeFi Trading Strategies", provider: "Apex Ledger", type: "Specialization", rating: "4.6", img: "🔗" },
];
const trendingCourses = [
  { title: "Swing Trading Blueprint", provider: "Apex Ledger", type: "Professional Certificate", rating: "4.8", img: "📈" },
  { title: "Macro Economics for Traders", provider: "Apex Ledger", type: "Course", rating: "4.7", img: "🌍" },
  { title: "Candlestick Mastery", provider: "Apex Ledger", type: "Course", rating: "4.9", img: "🕯" },
];

const testimonials = [
  { name: "Maximilian Fischer", role: "Forex Trader, Berlin", text: "The Forex Masterclass changed how I approach markets. Concepts are clearly taught and work in live conditions. Worth every penny.", stars: 5 },
  { name: "Yuki Tanaka", role: "Crypto Trader, Tokyo", text: "Finally a platform that takes crypto education seriously. No hype — just clean, practitioner-level content.", stars: 5 },
  { name: "Anastasia Volkov", role: "Swing Trader, Moscow", text: "The market psychology course gave me the mental framework I was missing. My win rate improved within weeks.", stars: 5 },
  { name: "Luca Bernardi", role: "Day Trader, Zurich", text: "Structured, practical, and beautifully designed. I completed two courses and both delivered real value.", stars: 5 },
];

function MiniCourseRow({ item }: { item: typeof popularCourses[0] }) {
  return (
    <Link to="/courses" style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", textDecoration: "none", borderRadius: 8, transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-alt)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <div style={{ width: 48, height: 48, borderRadius: 8, background: "var(--gold-bg)", border: "1px solid var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
        {item.img}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)" }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.provider}</span>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.type}</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>·</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>⭐ {item.rating}</span>
        </div>
      </div>
    </Link>
  );
}

const heroSlides = [
  {
    bg: "/hero-slide-1.png",
    overlay: "linear-gradient(90deg, rgba(10,22,40,0.92) 0%, rgba(10,22,40,0.7) 50%, rgba(10,22,40,0.3) 100%)",
    kicker: "Premium trading education",
    kickerColor: "var(--gold)",
    title: <>Master the markets, <em style={{ fontStyle: "italic", color: "var(--gold)" }}>elegantly.</em></>,
    desc: "Curated courses on crypto, forex, and strategy — by practitioners who trade daily.",
    cta: "Browse courses",
    ctaTo: "/courses",
  },
  {
    bg: "/hero-slide-2.png",
    overlay: "linear-gradient(90deg, rgba(26,61,10,0.92) 0%, rgba(26,61,10,0.7) 50%, rgba(26,61,10,0.25) 100%)",
    kicker: "Certificates",
    kickerColor: "#4ade80",
    title: "Earn your verified trading certificate",
    desc: "Complete any course and receive a professional certificate of completion you can share anywhere.",
    cta: "Explore courses",
    ctaTo: "/courses",
  },
  {
    bg: "/hero-slide-3.png",
    overlay: "linear-gradient(90deg, rgba(45,27,78,0.92) 0%, rgba(45,27,78,0.7) 50%, rgba(45,27,78,0.25) 100%)",
    kicker: "Global community",
    kickerColor: "#A78BFA",
    title: "Join 500+ traders learning worldwide",
    desc: "From Berlin to Tokyo, ambitious traders trust Apex Ledger for structured, honest market education.",
    cta: "Start learning",
    ctaTo: "/courses",
  },
];

function HeroCarousel() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % heroSlides.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <section style={{ background: "var(--bg-alt)", borderBottom: "1px solid var(--border)" }}>
      <div className="container" style={{ padding: "32px 48px" }}>
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 16 }}>
          <div style={{ display: "flex", transition: "transform 0.8s ease-in-out", transform: `translateX(-${active * 100}%)` }}>
            {heroSlides.map((s, i) => (
              <div key={i} style={{
                minWidth: "100%",
                backgroundImage: `url(${s.bg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius: 16,
                position: "relative",
                overflow: "hidden",
                minHeight: 340,
              }}>
                {/* Dark overlay for text readability */}
                <div style={{ position: "absolute", inset: 0, background: s.overlay }} />
                <div style={{ position: "relative", zIndex: 1, padding: "64px 56px", maxWidth: 560 }}>
                  <p style={{ fontSize: 13, letterSpacing: 2, color: s.kickerColor, textTransform: "uppercase", marginBottom: 16, fontWeight: 700 }}>{s.kicker}</p>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 500, lineHeight: 1.12, marginBottom: 18, color: "#fff" }}>{s.title}</h2>
                  <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 28 }}>{s.desc}</p>
                  <Link to={s.ctaTo} className="btn-gold" style={{ height: 52, fontSize: 15, borderRadius: 8, padding: "0 32px" }}>
                    {s.cta} <ArrowRight style={{ width: 16, height: 16 }} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {/* Dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20 }}>
            {heroSlides.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} aria-label={`Slide ${i + 1}`} style={{ width: active === i ? 28 : 10, height: 10, borderRadius: 5, border: "none", background: active === i ? "var(--gold)" : "var(--border-strong)", cursor: "pointer", transition: "all 0.4s ease" }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

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

export default function Home() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState("All");

  const load = () => { setLoading(true); setError(false); fetchCourses().then(setCourses).catch(() => setError(true)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!user) return;
    supabase.from("enrollments").select("course_id").eq("user_id", user.id).then(({ data }) => setEnrolledIds(new Set((data ?? []).map((e: any) => e.course_id))));
  }, [user]);

  const filtered = activeCategory === "All" ? courses : courses.filter(c => c.category?.toLowerCase() === activeCategory.toLowerCase());
  const coursesR = useReveal<HTMLDivElement>();
  const whyR = useReveal<HTMLDivElement>();
  const testiR = useReveal<HTMLDivElement>();

  return (
    <>
      <SEO />

      {/* ──── HERO CAROUSEL — 3 scrollable banners ──── */}
      <HeroCarousel />

      {/* ──── NEW AND POPULAR — Coursera-style 3-column ──── */}
      <section style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="container" style={{ padding: "40px 48px" }}>
          <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 26, fontWeight: 700, color: "var(--text)", marginBottom: 24 }}>New and popular</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            {/* Most Popular */}
            <div className="card-flat" style={{ padding: 8 }}>
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Most popular</h3>
                <ArrowRight style={{ width: 16, height: 16, color: "var(--text-muted)" }} />
              </div>
              {popularCourses.map(c => <MiniCourseRow key={c.title} item={c} />)}
            </div>
            {/* Hot new releases */}
            <div className="card-flat" style={{ padding: 8 }}>
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Hot new releases</h3>
                <ArrowRight style={{ width: 16, height: 16, color: "var(--text-muted)" }} />
              </div>
              {newCourses.map(c => <MiniCourseRow key={c.title} item={c} />)}
            </div>
            {/* Trending now */}
            <div className="card-flat" style={{ padding: 8 }}>
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Trending now</h3>
                <ArrowRight style={{ width: 16, height: 16, color: "var(--text-muted)" }} />
              </div>
              {trendingCourses.map(c => <MiniCourseRow key={c.title} item={c} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ──── CATEGORY CHIPS + COURSE GRID ──── */}
      <section className="section" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div ref={coursesR.ref} className="reveal" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 28, fontWeight: 700, color: "var(--text)" }}>Explore our courses</h2>
            <Link to="/courses" style={{ fontSize: 15, fontWeight: 600, color: "var(--blue)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              View all <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          {/* Chips */}
          <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
            {categories.map(c => (
              <button
                key={c}
                style={{ fontSize: 14 }}
                onClick={() => setActiveCategory(c)}
                className={`chip ${activeCategory === c ? "chip-active" : ""}`}
              >
                {c}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}><CourseCardSkeleton /><CourseCardSkeleton /><CourseCardSkeleton /><CourseCardSkeleton /></div>
          ) : error ? (
            <EmptyState variant="error" onRetry={load} />
          ) : filtered.length === 0 ? (
            <EmptyState variant="empty" />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
              {filtered.slice(0, 8).map((c) => <CourseCard key={c.id} course={c} enrolled={enrolledIds.has(c.id)} />)}
            </div>
          )}
        </div>
      </section>


      {/* ──── WHY APEX LEDGER ──── */}
      <section className="section" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div ref={whyR.ref} className="reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="kicker" style={{ marginBottom: 12, display: "block" }}>Why Apex Ledger</span>
            <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 28, fontWeight: 700, color: "var(--text)" }}>Built different. Built for results.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {[
              { icon: Shield, title: "Practitioner-written", text: "Every course is written by traders who trade daily — not influencers selling signals." },
              { icon: Award, title: "Verified certificates", text: "Complete a course and earn a formal certificate to showcase your achievement." },
              { icon: Clock, title: "Lifetime access", text: "Pay once, learn forever. All course updates included at no extra cost." },
              { icon: CheckCircle, title: "USDT payments", text: "Pay securely with USDT on TRC20 or ERC20. Fast, global, no bank hassle." },
            ].map(f => (
              <div key={f.title} className="card-flat" style={{ padding: 24, textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--gold-bg)", border: "1px solid var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <f.icon style={{ width: 24, height: 24, color: "var(--gold-dark)" }} />
                </div>
                <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── HOW IT WORKS ──── */}
      <section className="section" style={{ background: "var(--bg-alt)", borderBottom: "1px solid var(--border)" }}>
        <div className="container" style={{ maxWidth: 900, textAlign: "center" }}>
          <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 28, fontWeight: 700, color: "var(--text)", marginBottom: 48 }}>Start learning in 3 simple steps</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
            {[
              { n: "1", icon: BookOpen, title: "Choose your course", text: "Browse our curated library. Read reviews, check the syllabus, and pick what fits you." },
              { n: "2", icon: Shield, title: "Pay with USDT", text: "Send payment on TRC20 or ERC20. We verify on-chain and activate your access." },
              { n: "3", icon: Award, title: "Learn & get certified", text: "Study at your own pace. Complete the course and download your verified certificate." },
            ].map(s => (
              <div key={s.n} style={{ textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, margin: "0 auto 16px" }}>{s.n}</div>
                <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── TESTIMONIALS ──── */}
      <section className="section" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div ref={testiR.ref} className="reveal" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <span className="kicker" style={{ marginBottom: 8, display: "block" }}>Student reviews</span>
              <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 28, fontWeight: 700, color: "var(--text)" }}>Trusted by ambitious traders worldwide</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--gold-bg)", border: "1px solid var(--gold-border)", borderRadius: 8, padding: "8px 14px" }}>
              <Star style={{ width: 18, height: 18, color: "var(--gold)", fill: "var(--gold)" }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>4.9</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>average rating</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {testimonials.map(t => (
              <div key={t.name} className="card-flat" style={{ padding: 20 }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
                  {Array.from({ length: t.stars }).map((_, i) => <Star key={i} style={{ width: 14, height: 14, color: "var(--gold)", fill: "var(--gold)" }} />)}
                </div>
                <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>"{t.text}"</p>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{t.name}</p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section style={{ background: "var(--navy)", color: "#fff", padding: "64px 0" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 500, marginBottom: 16, color: "#fff" }}>Ready to sharpen your edge?</h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 32, maxWidth: 560, margin: "0 auto 32px" }}>
            Join hundreds of traders building real market knowledge. Pay securely with USDT. Start today.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <Link to="/courses" className="btn-gold" style={{ borderRadius: 8 }}>Browse courses <ArrowRight style={{ width: 14, height: 14 }} /></Link>
            <Link to="/about" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, padding: "0 28px", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, textDecoration: "none" }}>Our philosophy</Link>
          </div>
        </div>
      </section>

      {/* ──── FAQ ──── */}
      <section className="section">
        <div className="container">
          <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 28, fontWeight: 700, color: "var(--text)", marginBottom: 32, textAlign: "center" }}>Frequently asked questions</h2>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gap: 12 }}>
            {[
              { q: "How long do I have access?", a: "You retain lifetime access. Course materials are updated periodically and you always get the latest version." },
              { q: "Do you offer refunds?", a: "All sales are final. Preview materials on each course page let you evaluate before purchasing." },
              { q: "How do I pay?", a: "We accept USDT on TRC20 and ERC20 networks. Enrollment activates after on-chain confirmation, typically within a few hours." },
              { q: "Is there a referral program?", a: "Yes! Share your unique referral link from your Profile. Anyone who signs up and purchases using your link gets 10% off." },
              { q: "Do I get a certificate?", a: "Yes. Complete any course and you'll receive a verified certificate of completion that you can download and share." },
            ].map((f, i) => (
              <details key={i} style={{ background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: 12, padding: "0 24px", cursor: "pointer" }}>
                <summary style={{ padding: "18px 0", fontSize: 16, fontWeight: 600, color: "var(--text)", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {f.q} <span style={{ color: "var(--text-muted)", fontSize: 20 }}>+</span>
                </summary>
                <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7, paddingBottom: 18 }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
