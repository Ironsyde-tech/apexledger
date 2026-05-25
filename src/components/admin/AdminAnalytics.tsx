import { useEffect, useState } from "react";
import {
  TrendingUp, BarChart3, BookOpen, Users,
  ArrowUpRight, ArrowDownRight, Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type DayStat = { date: string; count: number; amount?: number };
type TopCourse = { title: string; slug: string; enrollments: number; revenue: number };
type ActivityItem = { type: "enrollment" | "order"; text: string; time: string };

export function AdminAnalytics() {
  const [enrollmentsByDay, setEnrollmentsByDay] = useState<DayStat[]>([]);
  const [revenueByDay, setRevenueByDay] = useState<DayStat[]>([]);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString();

    // Enrollments in last 30 days
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("created_at, course:courses ( title, slug )")
      .gte("created_at", since)
      .order("created_at", { ascending: true });

    // Confirmed orders in last 30 days
    const { data: orders } = await supabase
      .from("orders")
      .select("amount, created_at, status, course:courses ( title, slug ), student:profiles ( full_name )")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    // All enrollments for top courses
    const { data: allEnrollments } = await supabase
      .from("enrollments")
      .select("course:courses ( title, slug )");

    // All confirmed orders for top course revenue
    const { data: allOrders } = await supabase
      .from("orders")
      .select("amount, course:courses ( title, slug )")
      .in("status", ["confirmed", "paid"]);

    // Build enrollment-by-day
    const eByDay = new Map<string, number>();
    (enrollments ?? []).forEach((e: any) => {
      const day = new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      eByDay.set(day, (eByDay.get(day) ?? 0) + 1);
    });
    setEnrollmentsByDay(Array.from(eByDay.entries()).map(([date, count]) => ({ date, count })));

    // Build revenue-by-day (confirmed only)
    const rByDay = new Map<string, number>();
    (orders ?? []).filter((o: any) => o.status === "confirmed" || o.status === "paid").forEach((o: any) => {
      const day = new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      rByDay.set(day, (rByDay.get(day) ?? 0) + Number(o.amount));
    });
    setRevenueByDay(Array.from(rByDay.entries()).reverse().map(([date, amount]) => ({ date, count: 0, amount })));

    // Top courses
    const courseMap = new Map<string, TopCourse>();
    (allEnrollments ?? []).forEach((e: any) => {
      const c = e.course;
      if (!c) return;
      const key = c.slug ?? c.title;
      const existing = courseMap.get(key);
      if (existing) {
        existing.enrollments++;
      } else {
        courseMap.set(key, { title: c.title, slug: c.slug, enrollments: 1, revenue: 0 });
      }
    });
    (allOrders ?? []).forEach((o: any) => {
      const c = o.course;
      if (!c) return;
      const key = c.slug ?? c.title;
      const existing = courseMap.get(key);
      if (existing) existing.revenue += Number(o.amount);
    });
    setTopCourses(
      Array.from(courseMap.values())
        .sort((a, b) => b.enrollments - a.enrollments)
        .slice(0, 5)
    );

    // Recent activity
    const items: ActivityItem[] = [];
    (enrollments ?? []).slice(-10).reverse().forEach((e: any) => {
      items.push({
        type: "enrollment",
        text: `New enrollment in ${e.course?.title ?? "a course"}`,
        time: timeAgo(e.created_at),
      });
    });
    (orders ?? []).slice(0, 10).forEach((o: any) => {
      const name = (o as any).student?.full_name ?? "A student";
      items.push({
        type: "order",
        text: `${name} — $${Number(o.amount).toFixed(0)} ${o.status} for ${o.course?.title ?? "course"}`,
        time: timeAgo(o.created_at),
      });
    });
    items.sort((a, b) => 0); // keep interleaved
    setActivity(items.slice(0, 15));

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-12">Loading analytics…</div>
    );
  }

  const totalRevenue30d = revenueByDay.reduce((s, d) => s + (d.amount ?? 0), 0);
  const totalEnrollments30d = enrollmentsByDay.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          icon={TrendingUp}
          label="Revenue (30d)"
          value={`$${totalRevenue30d.toLocaleString()}`}
          trend={totalRevenue30d > 0 ? "up" : "neutral"}
        />
        <KPICard
          icon={Users}
          label="Enrollments (30d)"
          value={totalEnrollments30d.toString()}
          trend={totalEnrollments30d > 0 ? "up" : "neutral"}
        />
        <KPICard
          icon={BookOpen}
          label="Top course"
          value={topCourses[0]?.title?.split(" ").slice(0, 3).join(" ") ?? "—"}
          trend="neutral"
        />
        <KPICard
          icon={BarChart3}
          label="Avg order"
          value={
            revenueByDay.length > 0
              ? `$${Math.round(totalRevenue30d / Math.max(revenueByDay.length, 1))}`
              : "—"
          }
          trend="neutral"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue chart */}
        <div className="gold-border rounded-xl p-5 sm:p-6">
          <h3 className="font-display text-xl mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Revenue (30 days)
          </h3>
          <MiniBarChart data={revenueByDay} valueKey="amount" color="var(--primary)" />
        </div>

        {/* Enrollments chart */}
        <div className="gold-border rounded-xl p-5 sm:p-6">
          <h3 className="font-display text-xl mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Enrollments (30 days)
          </h3>
          <MiniBarChart data={enrollmentsByDay} valueKey="count" color="hsl(142, 71%, 45%)" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top courses */}
        <div className="gold-border rounded-xl p-5 sm:p-6">
          <h3 className="font-display text-xl mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Top Courses
          </h3>
          {topCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enrollments yet.</p>
          ) : (
            <div className="space-y-3">
              {topCourses.map((c, i) => (
                <div key={c.slug} className="flex items-center gap-3">
                  <span className="font-display text-lg text-primary w-6 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.enrollments} enrolled · ${c.revenue.toLocaleString()} revenue
                    </p>
                  </div>
                  <div className="h-2 w-20 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${Math.round((c.enrollments / Math.max(topCourses[0].enrollments, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="gold-border rounded-xl p-5 sm:p-6">
          <h3 className="font-display text-xl mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Recent Activity
          </h3>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
              {activity.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm">
                  <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                    a.type === "enrollment" ? "bg-green-500" : "bg-primary"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground truncate">{a.text}</p>
                    <p className="text-[11px] text-muted-foreground/60">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mini bar chart (inline SVG) ──
function MiniBarChart({
  data,
  valueKey,
  color,
}: {
  data: DayStat[];
  valueKey: "count" | "amount";
  color: string;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No data for this period.</p>;
  }

  const values = data.map((d) => (valueKey === "amount" ? d.amount ?? 0 : d.count));
  const max = Math.max(...values, 1);
  const barWidth = Math.max(Math.floor(100 / data.length) - 1, 3);

  return (
    <div>
      <svg
        viewBox={`0 0 ${data.length * (barWidth + 2)} 100`}
        className="w-full h-32 sm:h-40"
        preserveAspectRatio="none"
      >
        {data.map((d, i) => {
          const h = Math.max((values[i] / max) * 85, 2);
          return (
            <g key={i}>
              <rect
                x={i * (barWidth + 2)}
                y={100 - h}
                width={barWidth}
                height={h}
                rx={1.5}
                fill={color}
                opacity={0.85}
              >
                <title>{`${d.date}: ${valueKey === "amount" ? "$" : ""}${values[i]}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1 px-0.5">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

// ── KPI card ──
function KPICard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: any;
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
}) {
  return (
    <div className="gold-border rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-5 w-5 text-primary" />
        {trend === "up" && <ArrowUpRight className="h-4 w-4 text-green-500" />}
        {trend === "down" && <ArrowDownRight className="h-4 w-4 text-destructive" />}
      </div>
      <p className="font-display text-xl sm:text-2xl truncate">{value}</p>
      <p className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

// ── Helper ──
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
