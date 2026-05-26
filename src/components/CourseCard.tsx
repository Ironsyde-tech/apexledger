import { Link } from "react-router-dom";
import { CheckCircle2, Star } from "lucide-react";
import { courseImage, type CourseListItem } from "@/lib/courses";

const catColors: Record<string, { bg: string; text: string; border: string }> = {
  crypto: { bg: "#FEF9E7", text: "#8B6914", border: "#E8D9B0" },
  forex: { bg: "#E8F0FE", text: "#0056D2", border: "#B8D4FE" },
  strategy: { bg: "#E8F5E9", text: "#2E7D32", border: "#A5D6A7" },
  psychology: { bg: "#F3E8FD", text: "#7B1FA2", border: "#CE93D8" },
};

export const CourseCard = ({ course, enrolled = false }: { course: CourseListItem; enrolled?: boolean }) => {
  const cat = (course.category ?? "").toLowerCase();
  const catStyle = catColors[cat] ?? { bg: "var(--bg-alt)", text: "var(--text-muted)", border: "var(--border)" };
  const hasImg = course.image_url && !course.image_url.includes("placeholder");

  return (
    <article className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <Link to={`/courses/${course.slug}`} style={{ textDecoration: "none", display: "block" }}>
        <div style={{ height: 160, position: "relative", overflow: "hidden", background: hasImg ? undefined : "linear-gradient(135deg, var(--bg-alt), var(--border))" }}>
          {hasImg ? (
            <img src={courseImage(course.image_url)} alt={course.title} loading="lazy" style={{ height: "100%", width: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 40, opacity: 0.3 }}>📚</span>
            </div>
          )}
          {enrolled && (
            <span style={{ position: "absolute", top: 10, right: 10, background: "var(--green)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: 4 }}>
              <CheckCircle2 style={{ width: 12, height: 12 }} /> Enrolled
            </span>
          )}
        </div>
      </Link>

      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Provider + category */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gold)" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Apex Ledger</span>
          </div>
          {course.category && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: catStyle.bg, color: catStyle.text, border: `1px solid ${catStyle.border}` }}>
              {course.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", lineHeight: 1.3, marginBottom: 6, fontFamily: "Inter, sans-serif" }}>
          <Link to={`/courses/${course.slug}`} style={{ color: "var(--text)", textDecoration: "none" }}>{course.title}</Link>
        </h3>

        {/* Tagline */}
        {course.tagline && <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 12, flex: 1 }}>{course.tagline}</p>}

        {/* Skills tags */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
          {(course.level ? [course.level] : []).concat(course.duration ? [course.duration] : []).map(t => (
            <span key={t} style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 6px" }}>{t}</span>
          ))}
        </div>

        {/* Rating + price footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border)", marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Star style={{ width: 14, height: 14, color: "var(--gold)", fill: "var(--gold)" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{course.rating || "4.8"}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({course.students_count || 0})</span>
          </div>
          {enrolled ? (
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--green)", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 style={{ width: 14, height: 14 }} /> Enrolled</span>
          ) : !course.published ? (
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gold-dark)" }}>Coming Soon</span>
          ) : (
            <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{course.price} <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>USDT</span></span>
          )}
        </div>
      </div>
    </article>
  );
};
