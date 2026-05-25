import { supabase } from "@/integrations/supabase/client";

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

export type CourseListItem = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  image_url: string | null;
  price: number;
  duration: string | null;
  level: CourseLevel;
  category: string | null;
  rating: number;
  students_count: number;
};

export type CourseLesson = { id: string; title: string; duration: string | null; position: number };
export type CourseModule = { id: string; title: string; position: number; lessons: CourseLesson[] };

export type CourseFull = CourseListItem & {
  hero_subtitle: string | null;
  format: string | null;
  instructor_name: string | null;
  instructor_title: string | null;
  instructor_bio: string | null;
  instructor_note: string | null;
  learn: string[];
  who_for: string[];
  requirements: string[];
  resources: { name: string; size: string }[];
  reviews: { name: string; rating: number; text: string }[];
  faq: { q: string; a: string }[];
  disclaimer: string | null;
  modules: CourseModule[];
};

const LIST_COLUMNS =
  "id, slug, title, tagline, description, image_url, price, duration, level, category, rating, students_count";

export const PLACEHOLDER_COURSE_IMAGE = "/placeholder.svg";

export const courseImage = (url: string | null | undefined) =>
  url && url.length > 0 ? url : PLACEHOLDER_COURSE_IMAGE;

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const normalizeList = (rows: any[]): CourseListItem[] =>
  rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    tagline: r.tagline,
    description: r.description,
    image_url: r.image_url,
    price: Number(r.price ?? 0),
    duration: r.duration,
    level: r.level,
    category: r.category,
    rating: Number(r.rating ?? 0),
    students_count: r.students_count ?? 0,
  }));

export async function fetchCourses(): Promise<CourseListItem[]> {
  const { data, error } = await supabase
    .from("courses")
    .select(LIST_COLUMNS)
    .eq("published", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return normalizeList(data ?? []);
}

export async function fetchCourseBySlug(slug: string): Promise<CourseFull | null> {
  const { data, error } = await supabase
    .from("courses")
    .select(
      `id, slug, title, tagline, description, image_url, price, duration, level, category, rating, students_count,
       hero_subtitle, format, instructor_name, instructor_title, instructor_bio, instructor_note,
       learn, who_for, requirements, resources, reviews, faq, disclaimer,
       modules ( id, title, position, lessons ( id, title, duration, position ) )`
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const modules: CourseModule[] = asArray<any>(data.modules)
    .map((m) => ({
      id: m.id,
      title: m.title,
      position: m.position ?? 0,
      lessons: asArray<any>(m.lessons)
        .map((l) => ({ id: l.id, title: l.title, duration: l.duration, position: l.position ?? 0 }))
        .sort((a, b) => a.position - b.position),
    }))
    .sort((a, b) => a.position - b.position);

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    tagline: data.tagline,
    description: data.description,
    image_url: data.image_url,
    price: Number(data.price ?? 0),
    duration: data.duration,
    level: data.level as CourseLevel,
    category: data.category,
    rating: Number(data.rating ?? 0),
    students_count: data.students_count ?? 0,
    hero_subtitle: data.hero_subtitle,
    format: data.format,
    instructor_name: data.instructor_name,
    instructor_title: data.instructor_title,
    instructor_bio: data.instructor_bio,
    instructor_note: data.instructor_note,
    learn: asArray<string>(data.learn),
    who_for: asArray<string>(data.who_for),
    requirements: asArray<string>(data.requirements),
    resources: asArray<{ name: string; size: string }>(data.resources),
    reviews: asArray<{ name: string; rating: number; text: string }>(data.reviews),
    faq: asArray<{ q: string; a: string }>(data.faq),
    disclaimer: data.disclaimer,
    modules,
  };
}
