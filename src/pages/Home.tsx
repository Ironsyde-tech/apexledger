import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, Sparkles, Users, BookOpen, LifeBuoy, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CourseCard } from "@/components/CourseCard";
import { CourseCardSkeleton } from "@/components/CourseCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { fetchCourses, type CourseListItem } from "@/lib/courses";
import hero from "@/assets/hero.jpg";

const benefits = [
  { icon: Award, title: "Mentor-led craft", text: "Every course is taught by working practitioners, not influencers." },
  { icon: Lock, title: "Enrollment-gated content", text: "Your investment unlocks full access to every lesson, module, and resource." },
  { icon: Sparkles, title: "Curated curriculum", text: "Tightly edited. No filler. Designed for measurable progress." },
  { icon: Users, title: "Private community", text: "An invitation to a thoughtful, ambitious peer network." },
];

const faqs = [
  { q: "How long do I have access to a course?", a: "You retain access for as long as your enrollment is active. Course materials may be updated periodically." },
  { q: "Do you offer refunds?", a: "Refund policy details will be published on our terms page soon. For now, all sales are final." },
  { q: "Can I pay with crypto?", a: "Absolutely. We accept USDT on TRC20 and ERC20. Enrollment activates after on-chain confirmation." },
  { q: "Do I receive a certificate?", a: "Certificates of completion are planned and will be available once the feature is built." },
];

export default function Home() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    fetchCourses()
      .then(setCourses)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={hero} alt="" className="h-full w-full object-cover opacity-60" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
        </div>

        <div className="container py-28 md:py-40 max-w-4xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/40 backdrop-blur px-4 py-1.5 text-xs uppercase tracking-widest text-primary mb-8 animate-fade-up">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Your edge in the markets
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[1.05] mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Master the markets, <br />
            <span className="text-gradient-gold italic">elegantly.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Apex Ledger is where serious traders come to sharpen their edge — curated books on crypto, forex, and market strategy from practitioners who live it.
          </p>
          <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button asChild variant="gold" size="xl">
              <Link to="/courses">Browse courses <ArrowRight /></Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link to="/about">Our philosophy</Link>
            </Button>
          </div>

          <div className="mt-16 max-w-xl border-t border-border/60 pt-8 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <p className="text-sm text-muted-foreground">Join our growing community of investors.</p>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="container py-24">
        <div className="max-w-2xl mb-16">
          <p className="text-xs uppercase tracking-widest text-primary mb-3">Why Apex Ledger</p>
          <h2 className="font-display text-4xl md:text-5xl">A different kind of online academy.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b) => (
            <div key={b.title} className="gold-border rounded-xl p-6">
              <b.icon className="h-7 w-7 text-primary mb-4" />
              <h3 className="font-display text-xl mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section className="container py-24">
        <div className="flex flex-wrap items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary mb-3">Featured courses</p>
            <h2 className="font-display text-4xl md:text-5xl max-w-xl">Built by practitioners. Designed for results.</h2>
          </div>
          <Button asChild variant="ghost"><Link to="/courses">All courses <ArrowRight /></Link></Button>
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
            {courses.slice(0, 3).map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </section>

      {/* CTA block (replaces testimonials) */}
      <section className="container py-24">
        <div className="gold-border rounded-2xl p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-gold opacity-5" />
          <BookOpen className="mx-auto h-10 w-10 text-primary mb-6" />
          <h2 className="font-display text-4xl md:text-6xl mb-6">Ready to learn?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Browse our courses, pay with USDT, and start building your edge today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="gold" size="xl"><Link to="/courses">Explore courses</Link></Button>
            <Button asChild variant="outline" size="xl"><Link to="/contact"><LifeBuoy /> Talk to us</Link></Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-24 max-w-3xl">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-primary mb-3">Frequently asked</p>
          <h2 className="font-display text-4xl md:text-5xl">Questions, considered.</h2>
        </div>
        <Accordion type="single" collapsible className="gold-border rounded-xl px-6">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`q${i}`} className="border-border/60">
              <AccordionTrigger className="text-left font-display text-lg">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </>
  );
}
