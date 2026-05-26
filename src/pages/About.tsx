import { Anchor, Compass, Feather, Users, BookOpen, Award, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useReveal, useCounter } from "@/hooks/useReveal";

const values = [
  { icon: Anchor, title: "Grounded", text: "We teach what works in practice — not what trends on social media." },
  { icon: Compass, title: "Considered", text: "Every lesson is shaped by mentors with real, lived experience." },
  { icon: Feather, title: "Crafted", text: "Clean writing, beautiful design, honest pacing. No filler." },
];

function Stat({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const { ref, isVisible } = useReveal<HTMLDivElement>();
  const count = useCounter(value, 2000, isVisible);
  return (
    <div ref={ref} className="reveal text-center">
      <p className="font-display text-4xl md:text-5xl text-gradient-gold tabular-nums">{count}{suffix}</p>
      <p className="text-sm text-muted-foreground mt-2 uppercase tracking-widest">{label}</p>
    </div>
  );
}

export default function About() {
  const missionReveal = useReveal<HTMLDivElement>();
  const valuesReveal = useReveal<HTMLDivElement>();
  const storyReveal = useReveal<HTMLDivElement>();

  return (
    <>
      <SEO title="About" description="Apex Ledger was built on a simple idea: learning to navigate markets should feel less like gambling and more like a craft." />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 hero-grid" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(42_65%_58%/0.06)_0%,transparent_60%)]" />
        <div className="container py-24 md:py-32 max-w-4xl">
          <p className="text-xs uppercase tracking-widest text-primary mb-4 animate-fade-up">Our philosophy</p>
          <h1 className="font-display text-5xl md:text-7xl mb-8 leading-tight animate-fade-up" style={{ animationDelay: "0.1s" }}>
            A quiet academy <br />for a noisy world.
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Apex Ledger was built on a simple idea: that learning to navigate markets should feel less like gambling and more like a craft. We write books with the patience of editors and the rigour of practitioners — so that what you learn here stays with you.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="container py-16">
        <div className="gold-border rounded-2xl p-10 md:p-14 glow-gold">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Stat value={50} label="Students" suffix="+" />
            <Stat value={5} label="Courses" suffix="+" />
            <Stat value={12} label="Countries" suffix="+" />
            <Stat value={98} label="Satisfaction" suffix="%" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container py-24">
        <div ref={valuesReveal.ref} className="reveal text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs uppercase tracking-widest text-primary mb-3">Our values</p>
          <h2 className="font-display text-4xl md:text-5xl">What we stand for.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <div key={v.title} className="gold-border rounded-xl p-8 shimmer-on-hover reveal" style={{ transitionDelay: `${i * 0.15}s` }}>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <v.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-2xl mb-3">{v.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="container py-24">
        <div ref={missionReveal.ref} className="reveal gold-border rounded-2xl p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(42_65%_58%/0.06)_0%,transparent_70%)]" />
          <div className="relative">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-8 mx-auto">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-4xl md:text-5xl mb-6">Our mission</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              To make world-class market education accessible, honest, and beautifully presented — so that anyone with ambition can develop real trading skill, regardless of where they start.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="container py-24 max-w-3xl">
        <div ref={storyReveal.ref} className="reveal">
          <p className="text-xs uppercase tracking-widest text-primary mb-3">Our story</p>
          <h2 className="font-display text-4xl md:text-5xl mb-8">How it began.</h2>
          <div className="space-y-5 text-muted-foreground leading-relaxed text-lg">
            <p>Apex Ledger began as a small reading group between practitioners and friends. What started as evening discussions over markets, books, and strategy eventually became a library — and then a platform.</p>
            <p>We chose the name Apex Ledger for what it represents: reaching the peak through clear, recorded knowledge. The markets reward those who think clearly. We're here to help you do exactly that.</p>
          </div>
          <Button asChild variant="gold" size="lg" className="mt-10 glow-gold"><Link to="/courses">See our courses</Link></Button>
        </div>
      </section>
    </>
  );
}
