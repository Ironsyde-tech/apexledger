import { Link } from "react-router-dom";
import { Clock, BarChart3, Star, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { courseImage, type CourseListItem } from "@/lib/courses";

export const CourseCard = ({ course }: { course: CourseListItem }) => (
  <article className="group gold-border rounded-xl overflow-hidden flex flex-col transition-base hover:-translate-y-1 hover:shadow-elegant">
    <Link to={`/courses/${course.slug}`} className="relative block aspect-[16/10] overflow-hidden">
      <img
        src={courseImage(course.image_url)}
        alt={course.title}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      {course.category && (
        <span className="absolute top-3 left-3 rounded-full bg-background/80 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-widest text-primary">
          {course.category}
        </span>
      )}
    </Link>

    <div className="p-6 flex-1 flex flex-col">
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        {course.duration && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.duration}</span>}
        <span className="inline-flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> {course.level}</span>
        <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-primary" /> {course.rating}</span>
      </div>

      <h3 className="font-display text-2xl mb-2 leading-tight">{course.title}</h3>
      {course.tagline && <p className="text-sm text-muted-foreground mb-6 flex-1">{course.tagline}</p>}

      <div className="flex items-center justify-between mt-auto">
        <span className="font-display text-2xl text-gradient-gold">${course.price}</span>
        <Button asChild variant="outline" size="sm">
          <Link to={`/courses/${course.slug}`}>
            View course <ArrowUpRight />
          </Link>
        </Button>
      </div>
    </div>
  </article>
);
