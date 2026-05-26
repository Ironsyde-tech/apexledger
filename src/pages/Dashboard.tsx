import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, GraduationCap, Award, Receipt,
  BookMarked, Loader2, ArrowRight, Sparkles, Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CertificateDialog } from "@/components/Certificate";
import { SEO } from "@/components/SEO";

type DashCourse = {
  id: string;
  slug: string;
  title: string;
  image_url: string | null;
  price: number;
  category: string | null;
  totalLessons: number;
  completedLessons: number;
  nextLessonId: string | null;
  // Page-level tracking
  totalPages: number;
  pagesRead: number;
  currentPage: number;
  currentLessonTitle: string | null;
  hasDocuments: boolean;
  lastCompletedAt: string | null;
};

type OrderRow = {
  id: string;
  status: "pending" | "confirmed" | "rejected";
  amount: number;
  created_at: string;
  course: { slug: string; title: string } | null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<DashCourse[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [certCourse, setCertCourse] = useState<DashCourse | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);

      // 0) Orders (pending + rejected, recent first)
      const { data: ordersData } = await supabase
        .from("orders")
        .select("id, status, amount, created_at, course:courses ( slug, title )")
        .eq("user_id", user.id)
        .in("status", ["pending", "rejected"])
        .order("created_at", { ascending: false });
      if (!cancelled) setOrders((ordersData ?? []) as any);

      // 1) Enrollments + course
      const { data: enrollments, error: eErr } = await supabase
        .from("enrollments")
        .select("course:courses ( id, slug, title, image_url, price, category )")
        .eq("user_id", user.id);

      if (eErr || !enrollments) {
        if (!cancelled) { setItems([]); setLoading(false); }
        return;
      }

      const courses = enrollments
        .map((e: any) => e.course)
        .filter(Boolean) as Array<{
          id: string; slug: string; title: string;
          image_url: string | null; price: number; category: string | null;
        }>;

      if (courses.length === 0) {
        if (!cancelled) { setItems([]); setLoading(false); }
        return;
      }

      const courseIds = courses.map((c) => c.id);

      // 2) All lessons in those courses with document info
      const { data: modules } = await supabase
        .from("modules")
        .select("id, course_id, position, lessons ( id, title, position, document_type, total_pages )")
        .in("course_id", courseIds)
        .order("position", { ascending: true });

      // 3) Progress for this user across those courses (includes page tracking)
      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("lesson_id, course_id, completed, completed_at, current_page, total_pages")
        .eq("user_id", user.id)
        .in("course_id", courseIds);

      // Build completion + page tracking maps
      const completedByCourse = new Map<string, Set<string>>();
      const pagesByCourse = new Map<string, { pagesRead: number; currentPage: number; currentLessonId: string | null }>();
      const lastCompletedAtByCourse = new Map<string, string>();

      (progress ?? []).forEach((p: any) => {
        // Completed lessons
        if (p.completed_at || p.completed) {
          if (!completedByCourse.has(p.course_id)) completedByCourse.set(p.course_id, new Set());
          completedByCourse.get(p.course_id)!.add(p.lesson_id);
          // Track the latest completion date
          if (p.completed_at) {
            const existing = lastCompletedAtByCourse.get(p.course_id);
            if (!existing || p.completed_at > existing) {
              lastCompletedAtByCourse.set(p.course_id, p.completed_at);
            }
          }
        }

        // Page tracking — accumulate pages read and track the most recent position
        if (p.current_page && p.total_pages) {
          const existing = pagesByCourse.get(p.course_id);
          const pagesRead = p.completed ? p.total_pages : p.current_page;
          if (existing) {
            existing.pagesRead += pagesRead;
            // Use the lesson with the highest current page as "current reading position"
            if (p.current_page > existing.currentPage && !p.completed) {
              existing.currentPage = p.current_page;
              existing.currentLessonId = p.lesson_id;
            }
          } else {
            pagesByCourse.set(p.course_id, {
              pagesRead,
              currentPage: p.completed ? 0 : p.current_page,
              currentLessonId: p.completed ? null : p.lesson_id,
            });
          }
        }
      });

      // Build ordered lesson list per course + total page counts
      type LessonInfo = { id: string; title: string; position: number; document_type: string | null; total_pages: number | null };
      const lessonsByCourse = new Map<string, LessonInfo[]>();
      const totalPagesByCourse = new Map<string, number>();
      const hasDocsByCourse = new Map<string, boolean>();

      const grouped = new Map<string, Array<{ position: number; lessons: LessonInfo[] }>>();
      (modules ?? []).forEach((m: any) => {
        if (!grouped.has(m.course_id)) grouped.set(m.course_id, []);
        grouped.get(m.course_id)!.push({
          position: m.position,
          lessons: (m.lessons ?? []).slice().sort((a: any, b: any) => a.position - b.position),
        });
      });

      grouped.forEach((mods, courseId) => {
        const ordered = mods
          .sort((a, b) => a.position - b.position)
          .flatMap((m) => m.lessons);
        lessonsByCourse.set(courseId, ordered);

        const totalPgs = ordered.reduce((sum, l) => sum + (l.total_pages ?? 0), 0);
        totalPagesByCourse.set(courseId, totalPgs);
        hasDocsByCourse.set(courseId, ordered.some((l) => l.document_type != null));
      });

      const result: DashCourse[] = courses.map((c) => {
        const all = lessonsByCourse.get(c.id) ?? [];
        const completed = completedByCourse.get(c.id) ?? new Set();
        const pagesInfo = pagesByCourse.get(c.id);
        const totalPages = totalPagesByCourse.get(c.id) ?? 0;
        const hasDocuments = hasDocsByCourse.get(c.id) ?? false;

        // Find next uncompleted lesson
        const nextLesson = all.find((l) => !completed.has(l.id));
        const nextLessonId = nextLesson?.id ?? all[0]?.id ?? null;

        // Find current reading lesson title
        let currentLessonTitle: string | null = null;
        if (pagesInfo?.currentLessonId) {
          const lesson = all.find((l) => l.id === pagesInfo.currentLessonId);
          currentLessonTitle = lesson?.title ?? null;
        }

        return {
          ...c,
          totalLessons: all.length,
          completedLessons: completed.size,
          nextLessonId,
          totalPages,
          pagesRead: pagesInfo?.pagesRead ?? 0,
          currentPage: pagesInfo?.currentPage ?? 0,
          currentLessonTitle,
          hasDocuments,
          lastCompletedAt: lastCompletedAtByCourse.get(c.id) ?? null,
        };
      });

      if (!cancelled) {
        setItems(result);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const totalPagesRead = items.reduce((s, c) => s + c.pagesRead, 0);
  const fullyCompleted = items.filter(
    (c) => c.totalLessons > 0 && c.completedLessons === c.totalLessons
  ).length;

  return (
    <section className="container px-4 sm:px-6 py-10 md:py-16">
      <SEO title="Dashboard" noIndex />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 md:mb-12">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary mb-2">My Library</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl">Welcome back.</h1>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link to="/courses">Browse more courses</Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-10 md:mb-12">
        {[
          { icon: GraduationCap, label: "Enrolled", value: items.length },
          { icon: BookMarked, label: "Pages read", value: totalPagesRead },
          { icon: Award, label: "Completed", value: fullyCompleted },
        ].map((s) => (
          <div key={s.label} className="gold-border rounded-xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <s.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <div className="font-display text-2xl sm:text-3xl">{s.value}</div>
              <div className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending orders */}
      {orders.length > 0 && (
        <>
          <h2 className="font-display text-2xl sm:text-3xl mb-4 sm:mb-6 flex items-center gap-3">
            <Receipt className="h-6 w-6 sm:h-7 sm:w-7 text-primary" /> Your orders
          </h2>
          <div className="space-y-3 mb-10 md:mb-12">
            {orders.map((o) => (
              <div key={o.id} className="gold-border rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-display text-lg sm:text-xl">{o.course?.title ?? "Course"}</h3>
                    <Badge
                      variant={o.status === "pending" ? "secondary" : "destructive"}
                      className="uppercase tracking-widest text-[10px]"
                    >
                      {o.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ${Number(o.amount).toFixed(2)} · submitted {new Date(o.created_at).toLocaleDateString()}
                  </p>
                  {o.status === "pending" && (
                    <p className="text-xs text-muted-foreground mt-1">Awaiting payment confirmation from our team.</p>
                  )}
                  {o.status === "rejected" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Your previous USDT transfer couldn't be verified. You can submit a new payment.
                    </p>
                  )}
                </div>
                {o.status === "rejected" && o.course?.slug && (
                  <Button asChild variant="gold" className="w-full sm:w-auto">
                    <Link to={`/checkout/${o.course.slug}`}>Submit new payment</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Continue reading */}
      <h2 className="font-display text-2xl sm:text-3xl mb-4 sm:mb-6">Continue reading</h2>

      {loading && (
        <div className="flex items-center gap-3 text-muted-foreground py-12 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your library…
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="gold-border rounded-xl p-8 sm:p-10 text-center">
          <BookOpen className="h-10 w-10 text-primary mx-auto mb-4" />
          <h3 className="font-display text-2xl mb-2">No enrollments yet</h3>
          <p className="text-muted-foreground mb-6">Browse the catalog and pick your first course.</p>
          <Button asChild variant="gold"><Link to="/courses">Explore courses</Link></Button>
        </div>
      )}

      <div className="space-y-4">
        {items.map((c) => {
          // Determine progress type: page-based or lesson-based
          const isPageBased = c.hasDocuments && c.totalPages > 0;
          const pct = isPageBased
            ? c.totalPages > 0 ? Math.min(Math.round((c.pagesRead / c.totalPages) * 100), 100) : 0
            : c.totalLessons > 0 ? Math.round((c.completedLessons / c.totalLessons) * 100) : 0;

          const isComplete = pct === 100;

          return (
            <div
              key={c.id}
              className="gold-border rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center gap-4 sm:gap-5"
            >
              {/* Cover image */}
              {c.image_url ? (
                <img
                  src={c.image_url}
                  alt=""
                  className="h-32 sm:h-28 w-full md:w-48 object-cover rounded-lg"
                />
              ) : (
                <div className="h-32 sm:h-28 w-full md:w-48 bg-secondary/40 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                </div>
              )}

              {/* Course info */}
              <div className="flex-1 min-w-0">
                {c.category && (
                  <p className="text-xs uppercase tracking-widest text-primary mb-1">{c.category}</p>
                )}
                <h3 className="font-display text-xl sm:text-2xl mb-2 sm:mb-3 truncate">{c.title}</h3>

                {/* Progress bar */}
                <div className="relative">
                  <Progress value={pct} className="h-2" />
                  {isComplete && (
                    <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-primary" />
                  )}
                </div>

                {/* Progress text */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  {isPageBased ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-foreground font-medium">{c.pagesRead}</span> of{" "}
                        <span className="text-foreground font-medium">{c.totalPages}</span> pages
                        <span className="text-primary ml-1.5 font-medium">· {pct}%</span>
                      </p>
                      {c.currentLessonTitle && !isComplete && (
                        <p className="text-xs text-muted-foreground/70 truncate max-w-[200px]">
                          📖 {c.currentLessonTitle}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      <span className="text-foreground font-medium">{c.completedLessons}</span> of{" "}
                      <span className="text-foreground font-medium">{c.totalLessons}</span> lessons
                      <span className="text-primary ml-1.5 font-medium">· {pct}%</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                {c.nextLessonId ? (
                  <Button asChild variant="gold" className="w-full sm:w-auto">
                    <Link to={`/lesson/${c.slug}/${c.nextLessonId}`}>
                      {isComplete ? (
                        <><Award className="h-4 w-4" /> Completed</>
                      ) : c.pagesRead === 0 && c.completedLessons === 0 ? (
                        <><BookOpen className="h-4 w-4" /> Start reading</>
                      ) : (
                        <><ArrowRight className="h-4 w-4" /> Continue</>
                      )}
                    </Link>
                  </Button>
                ) : (
                  <Button disabled variant="outline" className="w-full sm:w-auto">
                    No content yet
                  </Button>
                )}
                {isComplete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-primary border-primary/30 hover:bg-primary/5"
                    onClick={() => setCertCourse(c)}
                  >
                    <Download className="h-3.5 w-3.5" /> Certificate
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Certificate dialog */}
      {certCourse && (
        <CertificateDialog
          open={!!certCourse}
          onClose={() => setCertCourse(null)}
          studentName={user?.user_metadata?.full_name ?? user?.email ?? "Student"}
          courseTitle={certCourse.title}
          certificateId={`${certCourse.id.slice(0, 8)}-${user?.id?.slice(0, 8) ?? "0000"}`}
          completionDate={
            certCourse.lastCompletedAt
              ? new Date(certCourse.lastCompletedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
          }
        />
      )}
    </section>
  );
}
