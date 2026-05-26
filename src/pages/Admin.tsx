import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Users, BookOpen, ShoppingBag, Check, X, ExternalLink, Pencil, UserPlus, Settings as SettingsIcon, Plus, LayoutList, ChevronLeft, ChevronRight, MessageSquare, Trash2, BarChart3, Archive, RotateCcw, Shield, ShieldOff, FolderOpen } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CourseFormDialog, type CourseFormValue } from "@/components/admin/CourseFormDialog";
import { CourseContentDialog } from "@/components/admin/CourseContentDialog";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";

type OrderRow = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  course: { title: string; slug: string; id?: string } | null;
  payment: {
    id: string;
    usdt_network: string | null;
    usdt_tx_hash: string | null;
    usdt_proof_url: string | null;
  } | null;
  student: { full_name: string | null; email: string | null } | null;
};

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  price: number;
  duration: string | null;
  level: string;
  image_url: string | null;
  students_count: number | null;
  published: boolean;
};

type StudentRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  enrollments: { course_id: string; course_title: string | null }[];
};

type SupportMsg = {
  id: string;
  name: string;
  email: string;
  message: string;
  handled: boolean;
  created_at: string;
};

const PAGE_SIZE = 20;

const statusColors: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  confirmed: "bg-success/15 text-success border-success/30",
  paid: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  refunded: "bg-muted text-muted-foreground border-border",
};

export default function Admin() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [supportMsgs, setSupportMsgs] = useState<SupportMsg[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersTotalCount, setOrdersTotalCount] = useState(0);

  // Course create/edit + curriculum
  const [courseForm, setCourseForm] = useState<{ mode: "create" | "edit"; initial: CourseFormValue | null } | null>(null);
  const [contentCourse, setContentCourse] = useState<{ id: string; title: string } | null>(null);

  // Course deletion
  const [deletingCourse, setDeletingCourse] = useState<CourseRow | null>(null);

  // Enroll dialog
  const [enrollStudent, setEnrollStudent] = useState<StudentRow | null>(null);
  const [enrollCourseId, setEnrollCourseId] = useState<string>("");
  const [enrolling, setEnrolling] = useState(false);

  // Settings
  const [trc20, setTrc20] = useState("");
  const [erc20, setErc20] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Categories (derived from course.category strings, no separate table)
  const [catList, setCatList] = useState<{ id: string; name: string; slug: string; active: boolean; position: number }[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");

  // Admin roles
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());

  const loadSettings = async () => {
    const { data } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["usdt_trc20_address", "usdt_erc20_address"]);
    const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""]));
    setTrc20(map["usdt_trc20_address"] ?? "");
    setErc20(map["usdt_erc20_address"] ?? "");
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    const { error } = await supabase.from("settings").upsert(
      [
        { key: "usdt_trc20_address", value: trc20.trim() },
        { key: "usdt_erc20_address", value: erc20.trim() },
      ],
      { onConflict: "key" }
    );
    setSavingSettings(false);
    if (error) return toast.error(error.message);
    toast.success("Wallet addresses updated");
  };

  const loadOrders = async (page = ordersPage) => {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("orders")
      .select(`
        id, user_id, amount, status, payment_method, created_at,
        course:courses ( id, title, slug ),
        payment:payments ( id, usdt_network, usdt_tx_hash, usdt_proof_url )
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) { toast.error(error.message); return; }

    setOrdersTotalCount(count ?? 0);

    const rows = (data ?? []).map((o: any) => ({
      ...o,
      payment: Array.isArray(o.payment) ? o.payment[0] ?? null : o.payment,
      student: null as OrderRow["student"],
    })) as OrderRow[];

    const ids = Array.from(new Set(rows.map((r) => r.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles").select("id, full_name, email").in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      rows.forEach((r) => {
        const p = map.get(r.user_id);
        r.student = p ? { full_name: p.full_name, email: p.email } : null;
      });
    }
    setOrders(rows);
  };

  const loadCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, slug, title, tagline, description, category, price, duration, level, image_url, students_count, published")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setCourses((data ?? []) as CourseRow[]);
  };

  const loadStudents = async () => {
    const { data: profs, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);

    const { data: enrolls } = await supabase
      .from("enrollments")
      .select("user_id, course_id, course:courses ( title )");

    const byUser = new Map<string, StudentRow["enrollments"]>();
    (enrolls ?? []).forEach((e: any) => {
      const arr = byUser.get(e.user_id) ?? [];
      arr.push({ course_id: e.course_id, course_title: e.course?.title ?? null });
      byUser.set(e.user_id, arr);
    });

    setStudents(
      (profs ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        created_at: p.created_at,
        enrollments: byUser.get(p.id) ?? [],
      }))
    );
  };

  const loadSupportMessages = async () => {
    const { data, error } = await supabase
      .from("support_messages")
      .select("id, name, email, message, handled, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return toast.error(error.message);
    setSupportMsgs((data ?? []) as SupportMsg[]);
  };

  const toggleHandled = async (msg: SupportMsg) => {
    const { error } = await supabase
      .from("support_messages")
      .update({ handled: !msg.handled })
      .eq("id", msg.id);
    if (error) return toast.error(error.message);
    setSupportMsgs((prev) => prev.map((m) => m.id === msg.id ? { ...m, handled: !m.handled } : m));
  };

  const archiveCourse = async (c: CourseRow) => {
    const { error } = await supabase.from("courses").update({ published: false }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(`"${c.title}" archived`);
    setDeletingCourse(null);
    loadCourses();
  };

  const restoreCourse = async (c: CourseRow) => {
    const { error } = await supabase.from("courses").update({ published: true }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(`"${c.title}" restored`);
    loadCourses();
  };

  // Categories — derived from course.category strings (no separate table)
  const loadCategories = async () => {
    // Extract unique categories from courses
    const cats = Array.from(new Set(courses.filter(c => c.category).map(c => c.category!)));
    setCatList(cats.map((name, i) => ({
      id: `cat-${i}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      active: true,
      position: i,
    })));
  };

  const addCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (catList.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Category already exists');
      return;
    }
    setCatList(prev => [...prev, { id: `cat-${Date.now()}`, name, slug, active: true, position: prev.length }]);
    toast.success(`Category "${name}" added`);
    setNewCatName('');
  };

  const updateCategory = async (id: string) => {
    const name = editCatName.trim();
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setCatList(prev => prev.map(c => c.id === id ? { ...c, name, slug } : c));
    toast.success('Category updated');
    setEditCatId(null);
  };

  const toggleCategoryActive = async (id: string, active: boolean) => {
    setCatList(prev => prev.map(c => c.id === id ? { ...c, active } : c));
    toast.success(active ? 'Category restored' : 'Category archived');
  };

  // Admin role management
  const loadAdminIds = async () => {
    const { data } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    setAdminIds(new Set((data ?? []).map((r: any) => r.user_id)));
  };

  const toggleAdmin = async (userId: string, makeAdmin: boolean) => {
    if (makeAdmin) {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
      if (error && !error.message.includes('duplicate')) return toast.error(error.message);
      toast.success('User promoted to admin');
    } else {
      if (userId === user?.id) return toast.error("You can't remove your own admin role");
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
      if (error) return toast.error(error.message);
      toast.success('Admin role removed');
    }
    loadAdminIds();
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadOrders(0), loadCourses(), loadStudents(), loadSettings(), loadSupportMessages(), loadAdminIds()]);
      setLoading(false);
    })();
  }, []);

  const goOrdersPage = (p: number) => {
    setOrdersPage(p);
    loadOrders(p);
  };
  const ordersTotalPages = Math.ceil(ordersTotalCount / PAGE_SIZE);

  const confirmOrder = async (o: OrderRow) => {
    if (!user || !o.course) return;
    const { data: c } = await supabase.from("courses").select("id").eq("slug", o.course.slug).maybeSingle();
    if (!c) return toast.error("Course not found");

    const { error: oErr } = await supabase.from("orders").update({ status: "confirmed" }).eq("id", o.id);
    if (oErr) return toast.error(oErr.message);

    if (o.payment) {
      await supabase.from("payments").update({
        status: "approved", verified_by: user.id, verified_at: new Date().toISOString(),
      }).eq("id", o.payment.id);
    }

    const { error: eErr } = await supabase.from("enrollments")
      .insert({ user_id: o.user_id, course_id: c.id, order_id: o.id });
    if (eErr && !eErr.message.includes("duplicate")) return toast.error(eErr.message);

    toast.success("Order confirmed and student enrolled");
    loadOrders(); loadStudents();
  };

  const rejectOrder = async (o: OrderRow) => {
    const { error } = await supabase.from("orders").update({ status: "rejected" }).eq("id", o.id);
    if (error) return toast.error(error.message);
    if (o.payment) {
      await supabase.from("payments").update({
        status: "rejected", verified_by: user?.id ?? null, verified_at: new Date().toISOString(),
      }).eq("id", o.payment.id);
    }
    toast.success("Order rejected");
    loadOrders();
  };

  const viewProof = async (path: string) => {
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 300);
    if (error || !data) return toast.error("Could not load proof");
    window.open(data.signedUrl, "_blank");
  };

  const openEdit = (c: CourseRow) =>
    setCourseForm({
      mode: "edit",
      initial: {
        id: c.id,
        title: c.title,
        slug: c.slug,
        tagline: c.tagline,
        description: c.description,
        category: c.category,
        price: Number(c.price ?? 0),
        level: (c.level as any) ?? "Beginner",
        duration: c.duration,
        image_url: c.image_url,
        published: c.published,
      },
    });


  const manualEnroll = async () => {
    if (!enrollStudent || !enrollCourseId) return;
    setEnrolling(true);
    const { error } = await supabase.from("enrollments")
      .insert({ user_id: enrollStudent.id, course_id: enrollCourseId });
    setEnrolling(false);
    if (error) {
      if (error.message.includes("duplicate")) toast.error("Already enrolled in this course");
      else toast.error(error.message);
      return;
    }
    toast.success(`Enrolled ${enrollStudent.full_name ?? enrollStudent.email}`);
    setEnrollStudent(null); setEnrollCourseId("");
    loadStudents();
  };

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const revenue = orders
    .filter((o) => o.status === "confirmed" || o.status === "paid")
    .reduce((s, o) => s + Number(o.amount), 0);

  return (
    <section className="container py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary mb-2">Owner control room</p>
          <h1 className="font-display text-5xl">Admin dashboard</h1>
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mb-10">
        {[
          { icon: DollarSign, label: "Revenue (confirmed)", value: `$${revenue.toLocaleString()}` },
          { icon: ShoppingBag, label: "Pending payments", value: pendingCount },
          { icon: Users, label: "Students", value: students.length },
          { icon: BookOpen, label: "Courses", value: courses.length },
        ].map((s) => (
          <div key={s.label} className="gold-border rounded-xl p-5 flex items-center gap-4">
            <s.icon className="h-7 w-7 text-primary" />
            <div>
              <div className="font-display text-2xl">{s.value}</div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="orders">Orders & Payments</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          <div className="gold-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Tx hash</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>}
                {!loading && orders.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No orders yet.</TableCell></TableRow>}
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-[11px] max-w-[120px] truncate">{o.id}</TableCell>
                    <TableCell>
                      <div className="text-sm">{o.student?.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{o.student?.email ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{o.course?.title ?? "—"}</TableCell>
                    <TableCell><span className="text-xs uppercase tracking-widest">{o.payment_method.replace("_", " · ")}</span></TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground max-w-[140px] truncate">{o.payment?.usdt_tx_hash ?? "—"}</TableCell>
                    <TableCell>
                      {o.payment?.usdt_proof_url ? (
                        <Button size="sm" variant="ghost" onClick={() => viewProof(o.payment!.usdt_proof_url!)}>
                          <ExternalLink className="h-3.5 w-3.5" /> View
                        </Button>
                      ) : "—"}
                    </TableCell>
                    <TableCell>${Number(o.amount).toFixed(2)}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[o.status] ?? ""}>{o.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {o.status === "pending" && (
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="outline" onClick={() => confirmOrder(o)}><Check className="h-3.5 w-3.5" /> Confirm</Button>
                          <Button size="sm" variant="ghost" onClick={() => rejectOrder(o)}><X className="h-3.5 w-3.5" /> Reject</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {ordersTotalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                Page {ordersPage + 1} of {ordersTotalPages} · {ordersTotalCount} total orders
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={ordersPage === 0} onClick={() => goOrdersPage(ordersPage - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <Button size="sm" variant="outline" disabled={ordersPage >= ordersTotalPages - 1} onClick={() => goOrdersPage(ordersPage + 1)}>
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="courses" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{courses.length} courses · drafts are hidden from the public catalog.</p>
            <Button
              variant="gold"
              onClick={() => setCourseForm({
                mode: "create",
                initial: {
                  title: "", slug: "", tagline: "", description: "", category: "",
                  price: 0, level: "Beginner", duration: "", image_url: null, published: false,
                },
              })}
            >
              <Plus className="h-4 w-4" /> New course
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {courses.filter(c => c.published).map((c) => (
              <div key={c.id} className="gold-border rounded-xl p-5 flex gap-4">
                {c.image_url ? (
                  <img src={c.image_url} alt="" className="h-24 w-32 object-cover rounded-md" />
                ) : (
                  <div className="h-24 w-32 bg-secondary rounded-md" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs uppercase tracking-widest text-primary truncate">{c.category ?? "—"}</p>
                    <Badge variant="outline" className={c.published ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground"}>
                      {c.published ? "Published" : "Draft"}
                    </Badge>
                    {!c.published && (
                      <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30">Coming Soon</Badge>
                    )}
                  </div>
                  <h3 className="font-display text-xl truncate">{c.title}</h3>
                  <p className="text-xs text-muted-foreground font-mono truncate">/{c.slug}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${Number(c.price).toFixed(0)} · {c.level} · {(c.students_count ?? 0).toLocaleString()} students
                  </p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setContentCourse({ id: c.id, title: c.title })}>
                      <LayoutList className="h-3.5 w-3.5" /> Curriculum
                    </Button>
                    <Button size="sm" variant="ghost" className="text-warning hover:text-warning" onClick={() => setDeletingCourse(c)}>
                      <Archive className="h-3.5 w-3.5" /> Archive
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && courses.filter(c => c.published).length === 0 && (
              <p className="text-muted-foreground text-sm">No active courses.</p>
            )}
          </div>

          {/* Archived courses */}
          {courses.filter(c => !c.published).length > 0 && (
            <details className="mt-6">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-base">
                <Archive className="h-3.5 w-3.5 inline mr-1" /> {courses.filter(c => !c.published).length} archived course(s)
              </summary>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {courses.filter(c => !c.published).map((c) => (
                  <div key={c.id} className="rounded-xl border border-border/50 bg-secondary/20 p-5 flex gap-4 opacity-60">
                    {c.image_url ? (
                      <img src={c.image_url} alt="" className="h-24 w-32 object-cover rounded-md grayscale" />
                    ) : (
                      <div className="h-24 w-32 bg-secondary rounded-md" />
                    )}
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="bg-muted text-muted-foreground mb-1">Archived</Badge>
                      <h3 className="font-display text-xl truncate">{c.title}</h3>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => restoreCourse(c)}>
                          <RotateCcw className="h-3.5 w-3.5" /> Restore
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </TabsContent>

        {/* ===== Categories Tab ===== */}
        <TabsContent value="categories" className="mt-6">
          <div className="gold-border rounded-xl p-6 max-w-xl">
            <h3 className="font-display text-xl mb-4">Manage Categories</h3>
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="New category name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              />
              <Button variant="gold" onClick={addCategory}><Plus className="h-4 w-4" /> Add</Button>
            </div>
            <div className="space-y-2">
              {catList.map((c) => (
                <div key={c.id} className={`flex items-center gap-3 rounded-lg border p-3 transition-base ${c.active ? 'border-border' : 'border-border/40 opacity-50'}`}>
                  <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                  {editCatId === c.id ? (
                    <>
                      <Input
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && updateCategory(c.id)}
                        className="h-8 text-sm"
                      />
                      <Button size="sm" variant="gold" onClick={() => updateCategory(c.id)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditCatId(null)}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium">{c.name}</span>
                      {!c.active && <Badge variant="outline" className="text-[10px]">Archived</Badge>}
                      <Button size="sm" variant="ghost" onClick={() => { setEditCatId(c.id); setEditCatName(c.name); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={c.active ? 'text-warning' : 'text-success'}
                        onClick={() => toggleCategoryActive(c.id, !c.active)}
                      >
                        {c.active ? <><Archive className="h-3.5 w-3.5" /> Archive</> : <><RotateCcw className="h-3.5 w-3.5" /> Restore</>}
                      </Button>
                    </>
                  )}
                </div>
              ))}
              {catList.length === 0 && <p className="text-sm text-muted-foreground">No categories yet.</p>}
            </div>
          </div>
        </TabsContent>


        <TabsContent value="students" className="mt-6">
          <div className="gold-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Signed up</TableHead>
                  <TableHead>Enrolled courses</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>}
                {!loading && students.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No students yet.</TableCell></TableRow>}
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.full_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{s.email ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {s.enrollments.length === 0 ? (
                        <span className="text-xs text-muted-foreground">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {s.enrollments.map((e) => (
                            <Badge key={e.course_id} variant="outline" className="text-[10px]">
                              {e.course_title ?? e.course_id.slice(0, 6)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline" onClick={() => { setEnrollStudent(s); setEnrollCourseId(""); }}>
                          <UserPlus className="h-3.5 w-3.5" /> Enroll
                        </Button>
                        {adminIds.has(s.id) ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => toggleAdmin(s.id, false)}
                            disabled={s.id === user?.id}
                            title={s.id === user?.id ? "Can't remove your own admin role" : "Remove admin"}
                          >
                            <ShieldOff className="h-3.5 w-3.5" /> Remove admin
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="text-primary hover:text-primary" onClick={() => toggleAdmin(s.id, true)}>
                            <Shield className="h-3.5 w-3.5" /> Make admin
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AdminAnalytics />
        </TabsContent>

        <TabsContent value="support" className="mt-6">
          <div className="gold-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>}
                {!loading && supportMsgs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No support messages yet.</TableCell></TableRow>}
                {supportMsgs.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell className="text-muted-foreground">{m.email}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">{m.message}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={m.handled ? "bg-success/15 text-success border-success/30" : "bg-warning/15 text-warning border-warning/30"}>
                        {m.handled ? "Handled" : "Open"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => toggleHandled(m)}>
                        {m.handled ? "Reopen" : "Mark handled"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <form onSubmit={saveSettings} className="gold-border rounded-xl p-8 space-y-5 max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl">Payment wallet addresses</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              These addresses are shown to students on checkout. Update carefully — a typo means lost payments.
            </p>
            <div>
              <Label>USDT · TRC20 (Tron)</Label>
              <Input
                value={trc20}
                onChange={(e) => setTrc20(e.target.value)}
                placeholder="T..."
                className="font-mono text-xs"
              />
            </div>
            <div>
              <Label>USDT · ERC20 (Ethereum)</Label>
              <Input
                value={erc20}
                onChange={(e) => setErc20(e.target.value)}
                placeholder="0x..."
                className="font-mono text-xs"
              />
            </div>
            <Button variant="gold" size="lg" type="submit" disabled={savingSettings}>
              {savingSettings ? "Saving…" : "Save addresses"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {/* Course form (create / edit) */}
      <CourseFormDialog
        open={!!courseForm}
        mode={courseForm?.mode ?? "create"}
        initial={courseForm?.initial ?? null}
        onClose={() => setCourseForm(null)}
        onSaved={() => loadCourses()}
      />

      {/* Curriculum (modules + lessons) */}
      <CourseContentDialog
        open={!!contentCourse}
        course={contentCourse}
        onClose={() => setContentCourse(null)}
      />

      {/* Delete course confirmation */}
      <AlertDialog open={!!deletingCourse} onOpenChange={(open) => { if (!open) setDeletingCourse(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive "{deletingCourse?.title}"? It will be hidden from the catalog but can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-warning text-warning-foreground hover:bg-warning/90" onClick={() => deletingCourse && archiveCourse(deletingCourse)}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manual enroll dialog */}
      <Dialog open={!!enrollStudent} onOpenChange={(open) => { if (!open) { setEnrollStudent(null); setEnrollCourseId(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enroll student</DialogTitle></DialogHeader>
          {enrollStudent && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enrolling <span className="text-foreground">{enrollStudent.full_name ?? enrollStudent.email}</span>
              </p>
              <div>
                <Label>Course</Label>
                <Select value={enrollCourseId} onValueChange={setEnrollCourseId}>
                  <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setEnrollStudent(null); setEnrollCourseId(""); }}>Cancel</Button>
            <Button variant="gold" onClick={manualEnroll} disabled={!enrollCourseId || enrolling}>
              {enrolling ? "Enrolling…" : "Enroll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
