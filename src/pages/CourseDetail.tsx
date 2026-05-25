import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { fetchCourseBySlug, courseImage, type CourseFull } from "@/lib/courses";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Clock, BarChart3, Star, Users, PlayCircle, ShieldCheck, AlertCircle, Sparkles } from "lucide-react";

export default function CourseDetail() {
  const { slug } = useParams();
  const [course, setCourse] = useState<CourseFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    fetchCourseBySlug(slug)
      .then(setCourse)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [slug]);

  if (loading) {
    return (
      <section className="container py-24">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12">
          <div className="space-y-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <aside className="gold-border rounded-xl overflow-hidden self-start">
            <Skeleton className="aspect-[16/10] w-full" />
            <div className="p-7 space-y-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </aside>
        </div>
      </section>
    );
  }
  if (error) {
    return (
      <section className="container py-24">
        <EmptyState variant="error" onRetry={load} />
      </section>
    );
  }
  if (!course) return <Navigate to="/courses" replace />;

  return (
    <article>
      {/* Hero */}
      <section className="border-b border-border/60">
        <div className="container py-16 grid lg:grid-cols-[1.2fr_1fr] gap-12">
          <div>
            <Link to="/courses" className="text-xs uppercase tracking-widest text-primary hover:underline">← All courses</Link>
            {course.category && <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">{course.category}</p>}
            <h1 className="font-display text-5xl md:text-6xl mt-3 mb-6 leading-tight">{course.title}</h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl">{course.hero_subtitle ?? course.description}</p>
            {course.format && (
              <p className="text-sm uppercase tracking-widest text-primary/90 mb-8">{course.format}</p>
            )}

            <div className="flex flex-wrap gap-6 text-sm">
              <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> {course.rating} rating</span>
              <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> {course.students_count.toLocaleString()} students</span>
              {course.duration && <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {course.duration}</span>}
              <span className="inline-flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> {course.level}</span>
            </div>
          </div>

          <aside className="gold-border rounded-xl overflow-hidden self-start sticky top-24">
            <img src={courseImage(course.image_url)} alt={course.title} className="aspect-[16/10] w-full object-cover" />
            <div className="p-7">
              <div className="flex items-baseline gap-3 mb-6">
                <span className="font-display text-4xl text-gradient-gold">${course.price}</span>
              </div>
              <Button asChild variant="gold" size="lg" className="w-full mb-3">
                <Link to={`/checkout/${course.slug}`}>Enroll now</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link to={`/lesson/${course.slug}/preview`}><PlayCircle /> Preview lesson</Link>
              </Button>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Full course access upon enrollment</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> USDT (TRC20/ERC20)</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* What you'll learn */}
      {course.learn.length > 0 && (
        <section className="container py-20">
          <h2 className="font-display text-4xl mb-8">What you'll learn</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {course.learn.map((l) => (
              <div key={l} className="gold-border rounded-lg p-5 flex gap-3">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p>{l}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Curriculum */}
      {course.modules.length > 0 && (
        <section className="container py-12">
          <h2 className="font-display text-4xl mb-8">Curriculum</h2>
          <Accordion type="multiple" className="gold-border rounded-xl px-6">
            {course.modules.map((m) => (
              <AccordionItem key={m.id} value={m.id} className="border-border/60">
                <AccordionTrigger className="text-left font-display text-xl">{m.title}</AccordionTrigger>
                <AccordionContent>
                  <ul className="divide-y divide-border/60">
                    {m.lessons.map((l) => (
                      <li key={l.id} className="flex items-center justify-between py-3 text-sm">
                        <span className="flex items-center gap-3 text-muted-foreground"><PlayCircle className="h-4 w-4 text-primary" /> {l.title}</span>
                        {l.duration && <span className="text-xs uppercase tracking-widest text-muted-foreground">{l.duration}</span>}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}

      {/* Who this is for */}
      {course.who_for.length > 0 && (
        <section className="container py-12">
          <h2 className="font-display text-4xl mb-8">Who this is for</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {course.who_for.map((w) => (
              <div key={w} className="gold-border rounded-lg p-5 flex gap-3">
                <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p>{w}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Included resources */}
      {course.resources.length > 0 && (
        <section className="container py-12">
          <h2 className="font-display text-4xl mb-8">Included resources</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {course.resources.map((r) => (
              <div key={r.name} className="gold-border rounded-lg p-5 flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.name}</p>
                  {r.size && <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{r.size}</p>}
                </div>
                <Check className="h-5 w-5 text-primary" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Instructor */}
      {course.instructor_name && (
        <section className="container py-20">
          <h2 className="font-display text-4xl mb-8">Your instructor</h2>
          <div className="gold-border rounded-xl p-8 flex flex-col md:flex-row gap-6 items-start">
            <div className="h-20 w-20 rounded-full bg-gradient-gold flex items-center justify-center font-display text-3xl text-primary-foreground shrink-0">
              {course.instructor_name[0]}
            </div>
            <div>
              <h3 className="font-display text-2xl">{course.instructor_name}</h3>
              {course.instructor_title && <p className="text-sm uppercase tracking-widest text-primary mb-3">{course.instructor_title}</p>}
              {course.instructor_bio && <p className="text-muted-foreground max-w-2xl">{course.instructor_bio}</p>}
              {course.instructor_note && (
                <blockquote className="mt-5 border-l-2 border-primary/60 pl-4 text-foreground/90 italic max-w-2xl">
                  "{course.instructor_note}"
                </blockquote>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Requirements */}
      {course.requirements.length > 0 && (
        <section className="container py-12">
          <h2 className="font-display text-4xl mb-8">Requirements</h2>
          <ul className="space-y-2 text-muted-foreground">
            {course.requirements.map((r) => (
              <li key={r} className="flex gap-3"><span className="text-primary">—</span>{r}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Reviews */}
      {course.reviews.length > 0 && (
        <section className="container py-20">
          <h2 className="font-display text-4xl mb-8">Student reviews</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {course.reviews.map((r, i) => (
              <div key={i} className="gold-border rounded-xl p-6">
                <div className="flex items-center gap-1 mb-3 text-primary">
                  {Array.from({ length: r.rating }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-foreground/90 mb-4">{r.text}</p>
                <p className="text-sm uppercase tracking-widest text-muted-foreground">— {r.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {course.faq.length > 0 && (
        <section className="container py-12">
          <h2 className="font-display text-4xl mb-8">Frequently asked</h2>
          <Accordion type="single" collapsible className="gold-border rounded-xl px-6">
            {course.faq.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border/60">
                <AccordionTrigger className="text-left font-display text-lg">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}

      {/* Disclaimer */}
      {course.disclaimer && (
        <section className="container py-12">
          <div className="rounded-xl border border-warning/40 bg-warning/5 p-6 flex gap-4">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Disclaimer · </strong>{course.disclaimer}
            </p>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container py-24">
        <div className="gold-border rounded-2xl p-10 md:p-16 text-center bg-gradient-to-br from-secondary/40 to-transparent">
          <p className="text-xs uppercase tracking-widest text-primary mb-4">Begin your journey</p>
          <h2 className="font-display text-4xl md:text-5xl max-w-2xl mx-auto mb-5">Invest in the knowledge first. The returns follow.</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">Start learning to build wealth with patience and discipline.</p>
          <Button asChild variant="gold" size="lg">
            <Link to={`/checkout/${course.slug}`}>Enroll now · ${course.price}</Link>
          </Button>
        </div>
      </section>
    </article>
  );
}
