import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Award, Sparkles, Users, BookOpen, LifeBuoy, Lock,
  Shield, Zap, GraduationCap, ChevronRight, Star, TrendingUp,
  CheckCircle2, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CourseCard } from "@/components/CourseCard";
import { CourseCardSkeleton } from "@/components/CourseCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { fetchCourses, type CourseListItem } from "@/lib/courses";
import { SEO } from "@/components/SEO";
import { useReveal, useCounter } from "@/hooks/useReveal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const benefits = [
  { icon: Award, title: "Mentor-led craft", text: "Every course is taught by working practitioners, not influencers." },
  { icon: Lock, title: "Enrollment-gated content", text: "Your investment unlocks full access to every lesson, module, and resource." },
  { icon: Sparkles, title: "Curated curriculum", text: "Tightly edited. No filler. Designed for measurable progress." },
  { icon: Users, title: "Private community", text: "An invitation to a thoughtful, ambitious peer network." },
];

const steps = [
  { icon: BookOpen, title: "Choose your course", text: "Browse our curated library and pick the course that fits your goals." },
  { icon: Shield, title: "Pay securely with USDT", text: "Send payment on TRC20 or ERC20. We verify on-chain within hours." },
  { icon: GraduationCap, title: "Start learning", text: "Get instant access to all materials and earn your certificate." },
];

const trustBadges = [
  { icon: Shield, label: "Secure payments" },
  { icon: Zap, label: "Instant access" },
  { icon: GraduationCap, label: "Certificate included" },
  { icon: Globe, label: "Learn anywhere" },
];

const testimonials = [
  {
    name: "Marcus T.",
    role: "Forex Trader",
    text: "Apex Ledger completely changed how I approach the markets. The material is dense, practical, and beautifully presented.",
    rating: 5,
  },
  {
    name: "Sarah K.",
    role: "Crypto Investor",
    text: "Finally, an educational platform that doesn't feel like a scam. The quality of writing is on another level.",
    rating: 5,
  },
  {
    name: "David O.",
    role: "Portfolio Manager",
    text: "Worth every dollar. I've taken courses from big platforms — this is the only one I've finished and actually applied.",
    rating: 5,
  },
];

const faqs = [
  { q: "How long do I have access to a course?", a: "You retain access for as long as your enrollment is active. Course materials may be updated periodically — you'll always have the latest version." },
  { q: "Do you offer refunds?", a: "All sales are final. We're confident in the quality of our content — and the preview materials on each course page let you evaluate before purchasing." },
  { q: "Can I pay with crypto?", a: "Absolutely. We accept USDT on TRC20 and ERC20 networks. Enrollment activates after on-chain confirmation, typically within a few hours." },
  { q: "Do I receive a certificate?", a: "Yes! Upon completing all lessons in a course, you'll receive a personalized certificate of completion that you can download and share." },
  { q: "How does the referral program work?", a: "Share your unique referral link from your Profile. When someone signs up and purchases a course using your link, they receive 10% off — and your referral count goes up." },
];

function StatCounter({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const { ref, isVisible } = useReveal<HTMLDivElement>();
  const count = useCounter(value, 2000, isVisible);

  return (
    <div ref={ref} className="reveal text-center">
      <p className="font-display text-5xl md:text-6xl text-gradient-gold tabular-nums">
        {count}{suffix}
      </p>
      <p className="text-sm text-muted-foreground mt-2 uppercase tracking-widest">{label}</p>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());

  // Dynamic stats
  const [studentCount, setStudentCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);

  const load = () => {
    setLoading(true);
    setError(false);
    fetchCourses()
      .then((c) => {
        setCourses(c);
        setCourseCount(c.length);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // Fetch real student count
    supabase.from("profiles").select("id", { count: "exact", head: true }).then(({ count }) => {
      setStudentCount(count ?? 0);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setEnrolledIds(new Set((data ?? []).map((e: any) => e.course_id)));
      });
  }, [user]);

  // Section refs for scroll reveal
  const benefitsReveal = useReveal<HTMLDivElement>();
  const stepsReveal = useReveal<HTMLDivElement>();
  const coursesReveal = useReveal<HTMLDivElement>();
  const testimonialsReveal = useReveal<HTMLDivElement>();
  const ctaReveal = useReveal<HTMLDivElement>();
  const faqReveal = useReveal<HTMLDivElement>();

  return (
    <>
      <SEO />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated grid background */}
        <div className="absolute inset-0 -z-10 hero-grid" />
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,hsl(42_65%_58%/0.06)_0%,transparent_60%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,hsl(222_80%_40%/0.12)_0%,transparent_50%)]" />
        {/* Floating accent orbs */}
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />

        <div className="container py-28 md:py-40 max-w-5xl relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 glass px-4 py-1.5 text-xs uppercase tracking-widest text-primary mb-8 animate-fade-up">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-gold" /> Premium trading education
          </p>

          <h1 className="font-display text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.05] mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Master the markets, <br />
            <span className="text-gradient-gold italic">elegantly.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Apex Ledger is where serious traders come to sharpen their edge — curated books on crypto, forex, and market strategy from practitioners who live it.
          </p>

          <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button asChild variant="gold" size="xl" className="glow-gold-strong">
              <Link to="/courses">Browse courses <ArrowRight /></Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link to="/about">Our philosophy</Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap gap-6 md:gap-10 animate-fade-up" style={{ animationDelay: "0.5s" }}>
            {trustBadges.map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <b.icon className="h-4 w-4 text-primary" />
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="container py-16">
        <div className="gold-border rounded-2xl p-10 md:p-14 glow-gold">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter value={studentCount || 50} label="Students" suffix="+" />
            <StatCounter value={courseCount || 5} label="Courses" suffix="+" />
            <StatCounter value={98} label="Completion rate" suffix="%" />
            <StatCounter value={24} label="Support" suffix="/7" />
          </div>
        </div>
      </section>

      {/* ============ VALUE PROPS ============ */}
      <section className="container py-24">
        <div ref={benefitsReveal.ref} className="reveal max-w-2xl mb-16">
          <p className="text-xs uppercase tracking-widest text-primary mb-3">Why Apex Ledger</p>
          <h2 className="font-display text-4xl md:text-5xl">A different kind of online academy.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <div key={b.title} className={`gold-border rounded-xl p-6 shimmer-on-hover reveal reveal-delay-${i + 1}`} ref={i === 0 ? benefitsReveal.ref : undefined}>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <b.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="container py-24">
        <div ref={stepsReveal.ref} className="reveal text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs uppercase tracking-widest text-primary mb-3">How it works</p>
          <h2 className="font-display text-4xl md:text-5xl">Three steps to your edge.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[16.7%] right-[16.7%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          {steps.map((s, i) => (
            <div key={s.title} className="text-center reveal" style={{ transitionDelay: `${i * 0.15}s` }}>
              <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-6 mx-auto">
                <s.icon className="h-7 w-7 text-primary" />
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-gold text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-display text-2xl mb-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ COURSES ============ */}
      <section className="container py-24">
        <div ref={coursesReveal.ref} className="reveal flex flex-wrap items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary mb-3">Featured courses</p>
            <h2 className="font-display text-4xl md:text-5xl max-w-xl">Built by practitioners. Designed for results.</h2>
          </div>
          <Button asChild variant="ghost">
            <Link to="/courses" className="group">All courses <ArrowRight className="transition-transform group-hover:translate-x-1" /></Link>
          </Button>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
          </div>
        ) : error ? (
          <EmptyState variant="error" onRetry={load} />
        ) : courses.length === 0 ? (
          <EmptyState variant="empty" />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.slice(0, 3).map((c) => <CourseCard key={c.id} course={c} enrolled={enrolledIds.has(c.id)} />)}
          </div>
        )}
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="container py-24">
        <div ref={testimonialsReveal.ref} className="reveal text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs uppercase tracking-widest text-primary mb-3">What our students say</p>
          <h2 className="font-display text-4xl md:text-5xl">Trusted by ambitious traders.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={t.name} className="gold-border rounded-xl p-8 reveal" style={{ transitionDelay: `${i * 0.15}s` }}>
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed italic">"{t.text}"</p>
              <div>
                <p className="font-display text-lg">{t.name}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="container py-24">
        <div ref={ctaReveal.ref} className="reveal gold-border rounded-2xl p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(42_65%_58%/0.08)_0%,transparent_70%)]" />
          <div className="relative">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-8 mx-auto">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-4xl md:text-6xl mb-6">Ready to sharpen your edge?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Join our growing community of traders and investors. Browse our courses, pay securely with USDT, and start building real market knowledge today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="gold" size="xl" className="glow-gold-strong"><Link to="/courses">Explore courses <ArrowRight /></Link></Button>
              <Button asChild variant="outline" size="xl"><Link to="/contact"><LifeBuoy className="h-4 w-4" /> Talk to us</Link></Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="container py-24 max-w-3xl">
        <div ref={faqReveal.ref} className="reveal text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-primary mb-3">Frequently asked</p>
          <h2 className="font-display text-4xl md:text-5xl">Questions, considered.</h2>
        </div>
        <Accordion type="single" collapsible className="gold-border rounded-xl px-6">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`q${i}`} className="border-border/60">
              <AccordionTrigger className="text-left font-display text-lg">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </>
  );
}
