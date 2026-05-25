import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, PlayCircle, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { AntiPiracy } from "@/components/reader/AntiPiracy";
import { BookReader } from "@/components/reader/BookReader";
import { EpubReader } from "@/components/reader/EpubReader";

type Lesson = {
  id: string;
  title: string;
  duration: string | null;
  video_url: string | null;
  document_path: string | null;
  document_type: string | null;
  total_pages: number | null;
  position: number;
  module_title: string;
};

export default function LessonViewer() {
  const { slug, lessonId } = useParams();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const nav = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [courseId, setCourseId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [resumeAt, setResumeAt] = useState(0);
  const [resumePage, setResumePage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Document state
  const [documentBlob, setDocumentBlob] = useState<Blob | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  // Track current page for progress saving
  const currentPageRef = useRef(1);
  const totalPagesRef = useRef(0);

  // Load course + lessons + enrollment + progress
  useEffect(() => {
    if (!slug || !user || authLoading) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setDocumentBlob(null);

      const { data: course } = await supabase
        .from("courses")
        .select("id, title")
        .eq("slug", slug)
        .maybeSingle();

      if (!course) {
        if (!cancelled) { setAccessDenied(true); setLoading(false); }
        return;
      }

      // Gate: enrollment required (admins bypass)
      if (!isAdmin) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", course.id)
          .maybeSingle();

        if (!enrollment) {
          if (!cancelled) { setAccessDenied(true); setLoading(false); }
          return;
        }
      }

      // Modules + lessons (include document fields)
      const { data: modules } = await supabase
        .from("modules")
        .select("id, title, position, lessons ( id, title, duration, video_url, document_path, document_type, total_pages, position )")
        .eq("course_id", course.id)
        .order("position", { ascending: true });

      const flat: Lesson[] = (modules ?? [])
        .slice()
        .sort((a: any, b: any) => a.position - b.position)
        .flatMap((m: any) =>
          (m.lessons ?? [])
            .slice()
            .sort((a: any, b: any) => a.position - b.position)
            .map((l: any) => ({ ...l, module_title: m.title }))
        );

      // Progress
      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed_at, last_position_seconds, current_page")
        .eq("user_id", user.id)
        .eq("course_id", course.id);

      const completed = new Set<string>();
      let resume = 0;
      let rPage = 1;
      (progress ?? []).forEach((p: any) => {
        if (p.completed_at) completed.add(p.lesson_id);
        if (p.lesson_id === lessonId) {
          resume = p.last_position_seconds ?? 0;
          rPage = p.current_page ?? 1;
        }
      });

      if (!cancelled) {
        setCourseId(course.id);
        setCourseTitle(course.title);
        setLessons(flat);
        setCompletedIds(completed);
        setResumeAt(resume);
        setResumePage(rPage);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [slug, lessonId, user, authLoading, isAdmin]);

  // Fetch the document blob via the edge function
  const lesson = useMemo(() => lessons.find((l) => l.id === lessonId), [lessons, lessonId]);

  const hasDocument = !!lesson?.document_path;
  const hasVideo = !!lesson?.video_url && !hasDocument;

  useEffect(() => {
    if (!lesson?.document_path || !user || loading) return;
    let cancelled = false;

    (async () => {
      setDocLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No session");

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/serve-book`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ lessonId: lesson.id }),
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        const blob = await res.blob();
        if (!cancelled) setDocumentBlob(blob);
      } catch (err: any) {
        console.error("Document fetch error:", err);
        toast.error(`Failed to load document: ${err.message}`);
      }
      if (!cancelled) setDocLoading(false);
    })();

    return () => { cancelled = true; };
  }, [lesson?.id, lesson?.document_path, user, loading]);

  // Restore last position on video element
  useEffect(() => {
    if (videoRef.current && resumeAt > 0) {
      try { videoRef.current.currentTime = resumeAt; } catch {}
    }
  }, [resumeAt, lessonId]);

  const index = useMemo(() => lessons.findIndex((l) => l.id === lessonId), [lessons, lessonId]);

  if (accessDenied) return <Navigate to={`/courses/${slug}`} replace />;
  if (loading) {
    return <section className="container py-24 text-center text-muted-foreground">Loading lesson…</section>;
  }
  if (!lesson) {
    if (lessons[0]) return <Navigate to={`/lesson/${slug}/${lessons[0].id}`} replace />;
    return <Navigate to={`/courses/${slug}`} replace />;
  }

  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index < lessons.length - 1 ? lessons[index + 1] : null;

  // Debounced page progress save
  const savePageProgress = useCallback(
    debounce(async (page: number, total: number) => {
      if (!user || !courseId) return;
      await supabase
        .from("lesson_progress")
        .upsert(
          {
            user_id: user.id,
            course_id: courseId,
            lesson_id: lesson.id,
            current_page: page,
            total_pages: total,
            last_position_seconds: 0,
            completed: false,
          },
          { onConflict: "user_id,lesson_id" }
        );
    }, 2000),
    [user, courseId, lesson.id]
  );

  const handlePageChange = (page: number, total: number) => {
    currentPageRef.current = page;
    totalPagesRef.current = total;
    savePageProgress(page, total);
  };

  const markComplete = async () => {
    if (!user || !courseId) return;
    setSaving(true);
    const lastPos = videoRef.current?.currentTime ?? 0;
    const { error } = await supabase
      .from("lesson_progress")
      .upsert(
        {
          user_id: user.id,
          course_id: courseId,
          lesson_id: lesson.id,
          completed: true,
          completed_at: new Date().toISOString(),
          last_position_seconds: Math.floor(lastPos),
          current_page: currentPageRef.current,
          total_pages: totalPagesRef.current,
        },
        { onConflict: "user_id,lesson_id" }
      );
    setSaving(false);
    if (error) return toast.error(error.message);
    setCompletedIds((s) => new Set(s).add(lesson.id));
    toast.success("Lesson marked complete");
    if (next) nav(`/lesson/${slug}/${next.id}`);
  };

  const isDone = completedIds.has(lesson.id);

  return (
    <section className="container py-10 grid lg:grid-cols-[1fr_360px] gap-8">
      <div>
        <Link to="/dashboard" className="text-xs uppercase tracking-widest text-primary hover:underline">← My dashboard</Link>
        <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">{lesson.module_title}</p>
        <h1 className="font-display text-4xl md:text-5xl mt-2 mb-8">{lesson.title}</h1>

        {/* Document reader (PDF / EPUB) */}
        {hasDocument && (
          <AntiPiracy userEmail={user?.email}>
            {docLoading || !documentBlob ? (
              <div className="aspect-[3/4] rounded-xl gold-border flex items-center justify-center bg-secondary/30">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
                  <p className="text-muted-foreground">Loading document…</p>
                </div>
              </div>
            ) : lesson.document_type === "epub" ? (
              <EpubReader
                documentBlob={documentBlob}
                onPageChange={handlePageChange}
              />
            ) : (
              <BookReader
                documentBlob={documentBlob}
                initialPage={resumePage}
                onPageChange={handlePageChange}
              />
            )}
          </AntiPiracy>
        )}

        {/* Video player (legacy support) */}
        {hasVideo && (
          <div className="aspect-video rounded-xl gold-border overflow-hidden flex items-center justify-center bg-secondary/30 relative">
            <video
              ref={videoRef}
              src={lesson.video_url!}
              controls
              className="w-full h-full"
            />
          </div>
        )}

        {/* No content placeholder */}
        {!hasDocument && !hasVideo && (
          <div className="aspect-video rounded-xl gold-border overflow-hidden flex items-center justify-center bg-secondary/30 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <PlayCircle className="h-20 w-20 text-primary relative" />
          </div>
        )}

        {/* Video resume indicator */}
        {hasVideo && resumeAt > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            Resuming from {Math.floor(resumeAt / 60)}:{String(Math.floor(resumeAt % 60)).padStart(2, "0")}
          </p>
        )}

        {/* Document resume indicator */}
        {hasDocument && resumePage > 1 && (
          <p className="text-xs text-muted-foreground mt-3">
            Resuming from page {resumePage}
          </p>
        )}

        <div className="flex items-center justify-between mt-6 gap-3 flex-wrap">
          <Button variant="outline" disabled={!prev} onClick={() => prev && nav(`/lesson/${slug}/${prev.id}`)}>
            <ChevronLeft /> Previous
          </Button>
          <Button
            variant={isDone ? "outline" : "gold"}
            onClick={markComplete}
            disabled={saving}
          >
            <Check /> {isDone ? "Completed · mark again" : saving ? "Saving…" : "Mark complete"}
          </Button>
          <Button variant="gold" disabled={!next} onClick={() => next && nav(`/lesson/${slug}/${next.id}`)}>
            Next <ChevronRight />
          </Button>
        </div>

        <p className="text-xs uppercase tracking-widest text-muted-foreground mt-4 text-center">
          Lesson {index + 1} of {lessons.length}
        </p>
      </div>

      <aside className="gold-border rounded-xl p-5 self-start sticky top-24 max-h-[80vh] overflow-y-auto">
        <p className="text-xs uppercase tracking-widest text-primary mb-4">{courseTitle}</p>
        <ul className="space-y-1">
          {lessons.map((l, i) => {
            const isActive = l.id === lesson.id;
            const done = completedIds.has(l.id);
            const isDoc = !!l.document_path;
            return (
              <li key={l.id}>
                <Link
                  to={`/lesson/${slug}/${l.id}`}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-md text-left text-sm transition-base ${
                    isActive ? "bg-primary/10 text-primary" : "hover:bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-4 w-4 text-success shrink-0" /> : isDoc ? <BookOpen className="h-4 w-4 shrink-0" /> : <PlayCircle className="h-4 w-4 shrink-0" />}
                  <span className="flex-1 truncate">{i + 1}. {l.title}</span>
                  {l.duration && <span className="text-[10px]">{l.duration}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>
    </section>
  );
}

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
