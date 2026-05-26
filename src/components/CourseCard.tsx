import { Link } from "react-router-dom";
import { Clock, BarChart3, Star, ArrowUpRight, Sparkles, CheckCircle2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { courseImage, type CourseListItem } from "@/lib/courses";

export const CourseCard = ({ course, enrolled = false }: { course: CourseListItem; enrolled?: boolean }) => (
  <article className="group gold-border rounded-xl overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-glow shimmer-on-hover">
    <Link to={`/courses/${course.slug}`} className="relative block aspect-[16/10] overflow-hidden">
      <img
        src={courseImage(course.image_url)}
        alt={course.title}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      {course.category && (
        <span className="absolute top-3 left-3 rounded-full glass px-3 py-1 text-[11px] uppercase tracking-widest text-primary font-medium">
          {course.category}
        </span>
      )}
      {enrolled && (
        <span className="absolute top-3 right-3 rounded-full bg-emerald-600/90 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-widest text-white font-semibold flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Enrolled
        </span>
      )}
      {!enrolled && course.status === 'coming_soon' && (
        <span className="absolute top-3 right-3 rounded-full bg-primary/90 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-widest text-primary-foreground font-semibold flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Coming Soon
        </span>
      )}
    </Link>

    <div className="p-6 flex-1 flex flex-col">
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        {course.duration && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.duration}</span>}
        <span className="inline-flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> {course.level}</span>
        <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-primary fill-primary" /> {course.rating}</span>
      </div>

      <h3 className="font-display text-2xl mb-2 leading-tight group-hover:text-primary transition-colors">{course.title}</h3>
      {course.tagline && <p className="text-sm text-muted-foreground mb-6 flex-1 leading-relaxed">{course.tagline}</p>}

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
        {enrolled ? (
          <span className="text-sm text-emerald-500 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Enrolled
          </span>
        ) : course.status === 'coming_soon' ? (
          <span className="text-sm text-primary font-medium">Coming Soon</span>
        ) : (
          <span className="font-display text-2xl text-gradient-gold">${course.price}</span>
        )}
        <Button asChild variant={enrolled ? "gold" : "outline"} size="sm" className="group/btn">
          <Link to={enrolled ? `/lesson/${course.slug}/preview` : `/courses/${course.slug}`}>
            {enrolled ? <><BookOpen className="h-3.5 w-3.5" /> Continue</> : course.status === 'coming_soon' ? 'Learn more' : 'View course'} {!enrolled && <ArrowUpRight className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />}
          </Link>
        </Button>
      </div>
    </div>
  </article>
);
