import { useEffect, useMemo, useState } from "react";
import { CourseCard } from "@/components/CourseCard";
import { CourseCardSkeleton } from "@/components/CourseCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { fetchCourses, type CourseListItem } from "@/lib/courses";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const levels = ["All", "Beginner", "Intermediate", "Advanced"] as const;

export default function Catalog() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<(typeof levels)[number]>("All");
  const [cat, setCat] = useState("All");
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());

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
    supabase.from('categories').select('name').eq('active', true).order('position').then(({ data }) => {
      setCategories(['All', ...(data ?? []).map((c: any) => c.name)]);
    });
  }, []);

  // Batch fetch enrollments
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

  const filtered = useMemo(
    () =>
      courses.filter(
        (c) =>
          (level === "All" || c.level === level) &&
          (cat === "All" || c.category === cat) &&
          (q === "" ||
            c.title.toLowerCase().includes(q.toLowerCase()) ||
            (c.tagline ?? "").toLowerCase().includes(q.toLowerCase()) ||
            (c.description ?? "").toLowerCase().includes(q.toLowerCase()) ||
            (c.category ?? "").toLowerCase().includes(q.toLowerCase()))
      ),
    [q, level, cat, courses]
  );

  return (
    <section className="container py-20">
      <SEO title="Courses" description="Browse our curated library of premium crypto, forex & trading books. Find your edge in the markets." />
      <div className="max-w-3xl mb-12">
        <p className="text-xs uppercase tracking-widest text-primary mb-3">Course catalog</p>
        <h1 className="font-display text-5xl md:text-6xl mb-4">A small library, carefully tended.</h1>
        <p className="text-muted-foreground text-lg">Every course is the product of months of work. Choose one and begin.</p>
      </div>

      <div className="gold-border rounded-xl p-5 mb-10 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses, topics, categories… (⌘K)"
            className="pl-10 bg-secondary/40 border-border"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 text-xs uppercase tracking-widest rounded-full transition-base border ${
                cat === c ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {levels.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-3 py-1.5 text-xs uppercase tracking-widest rounded-full transition-base border ${
                level === l ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <EmptyState variant="error" onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          variant="empty"
          title="No courses match your filters"
          description="Try adjusting the search or filters above."
          action={
            <button
              onClick={() => { setQ(""); setLevel("All"); setCat("All"); }}
              className="px-4 py-2 text-sm rounded-full border border-border hover:border-primary/50 transition-base"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => <CourseCard key={c.id} course={c} enrolled={enrolledIds.has(c.id)} />)}
        </div>
      )}
    </section>
  );
}
