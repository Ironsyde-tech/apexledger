import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, GripVertical, ChevronDown, ChevronRight, Upload, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Lesson = {
  id: string;
  module_id: string;
  title: string;
  video_url: string | null;
  document_path: string | null;
  document_type: string | null;
  total_pages: number | null;
  content: string | null;
  duration: string | null;
  position: number;
};
type Module = {
  id: string;
  course_id: string;
  title: string;
  position: number;
  lessons: Lesson[];
};

function SortableItem({ id, children }: { id: string; children: (handleProps: any) => JSX.Element }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

export function CourseContentDialog({
  open,
  course,
  onClose,
}: {
  open: boolean;
  course: { id: string; title: string } | null;
  onClose: () => void;
}) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Module editor
  const [moduleEditor, setModuleEditor] = useState<{ mode: "create" | "edit"; id?: string; title: string } | null>(null);

  // Lesson editor
  const [lessonEditor, setLessonEditor] = useState<{
    mode: "create" | "edit";
    moduleId: string;
    id?: string;
    title: string;
    video_url: string;
    content: string;
    duration: string;
    document_path: string;
    document_type: string;
  } | null>(null);

  // Document upload state
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState<{ kind: "module" | "lesson"; id: string; title: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = async () => {
    if (!course) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("modules")
      .select("id, course_id, title, position, lessons ( id, module_id, title, video_url, document_path, document_type, total_pages, content, duration, position )")
      .eq("course_id", course.id)
      .order("position", { ascending: true });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows: Module[] = (data ?? []).map((m: any) => ({
      ...m,
      lessons: (m.lessons ?? []).slice().sort((a: Lesson, b: Lesson) => a.position - b.position),
    }));
    setModules(rows);
    setLoading(false);
  };

  useEffect(() => { if (open && course) load(); }, [open, course?.id]);

  const toggle = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  // ---------- Module CRUD ----------
  const saveModule = async () => {
    if (!moduleEditor || !course) return;
    const title = moduleEditor.title.trim();
    if (!title) return toast.error("Module title is required");

    if (moduleEditor.mode === "create") {
      const position = modules.length;
      const { error } = await supabase.from("modules").insert({ course_id: course.id, title, position });
      if (error) return toast.error(error.message);
      toast.success("Module created");
    } else {
      const { error } = await supabase.from("modules").update({ title }).eq("id", moduleEditor.id!);
      if (error) return toast.error(error.message);
      toast.success("Module updated");
    }
    setModuleEditor(null);
    load();
  };

  const deleteModule = async (id: string) => {
    // Delete lessons first to avoid orphans (no FK cascade configured)
    await supabase.from("lessons").delete().eq("module_id", id);
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Module deleted");
    load();
  };

  const reorderModules = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = modules.findIndex((m) => m.id === active.id);
    const newIdx = modules.findIndex((m) => m.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(modules, oldIdx, newIdx);
    setModules(reordered);
    // Persist new positions for every affected row
    const updates = reordered.map((m, i) =>
      supabase.from("modules").update({ position: i }).eq("id", m.id)
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) { toast.error(failed.error.message); load(); }
  };

  // ---------- Lesson CRUD ----------
  const saveLesson = async () => {
    if (!lessonEditor || !course) return;
    const title = lessonEditor.title.trim();
    if (!title) return toast.error("Lesson title is required");
    if (lessonEditor.video_url && !/^https?:\/\//i.test(lessonEditor.video_url.trim())) {
      return toast.error("Video URL must start with http:// or https://");
    }

    let documentPath = lessonEditor.document_path || null;
    let documentType = lessonEditor.document_type || 'pdf';
    let totalPages: number | null = null;

    // Upload document file if selected
    if (docFile) {
      setUploading(true);
      const ext = docFile.name.split('.').pop()?.toLowerCase() ?? 'pdf';
      documentType = ext === 'epub' ? 'epub' : 'pdf';
      const storagePath = `courses/${course.id}/${Date.now()}-${docFile.name}`;

      const { error: uploadErr } = await supabase.storage
        .from('books')
        .upload(storagePath, docFile, {
          contentType: docFile.type,
          upsert: false,
        });
      setUploading(false);

      if (uploadErr) {
        return toast.error(`Upload failed: ${uploadErr.message}`);
      }

      documentPath = storagePath;
      setDocFile(null);
    }

    const payload: Record<string, any> = {
      title,
      video_url: lessonEditor.video_url.trim() || null,
      content: lessonEditor.content.trim() || null,
      duration: lessonEditor.duration.trim() || null,
      document_path: documentPath,
      document_type: documentType,
    };
    if (totalPages !== null) payload.total_pages = totalPages;

    if (lessonEditor.mode === "create") {
      const mod = modules.find((m) => m.id === lessonEditor.moduleId);
      const position = mod ? mod.lessons.length : 0;
      const { error } = await supabase
        .from("lessons")
        .insert({ ...payload, module_id: lessonEditor.moduleId, position });
      if (error) return toast.error(error.message);
      toast.success("Lesson created");
    } else {
      const { error } = await supabase.from("lessons").update(payload).eq("id", lessonEditor.id!);
      if (error) return toast.error(error.message);
      toast.success("Lesson updated");
    }
    setLessonEditor(null);
    setDocFile(null);
    load();
  };

  const deleteLesson = async (id: string) => {
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Lesson deleted");
    load();
  };

  const reorderLessons = async (moduleId: string, e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod) return;
    const oldIdx = mod.lessons.findIndex((l) => l.id === active.id);
    const newIdx = mod.lessons.findIndex((l) => l.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(mod.lessons, oldIdx, newIdx);
    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, lessons: reordered } : m)));
    const updates = reordered.map((l, i) =>
      supabase.from("lessons").update({ position: i }).eq("id", l.id)
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) { toast.error(failed.error.message); load(); }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Curriculum · {course?.title}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Drag modules and lessons to reorder. Changes save immediately.</p>
            <Button size="sm" variant="gold" onClick={() => setModuleEditor({ mode: "create", title: "" })}>
              <Plus className="h-4 w-4" /> New module
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading curriculum…</p>
          ) : modules.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No modules yet. Add the first one.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderModules}>
              <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {modules.map((m, mi) => (
                    <SortableItem key={m.id} id={m.id}>
                      {(handle) => (
                        <div className="gold-border rounded-lg">
                          <div className="flex items-center gap-2 p-3">
                            <button className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground" {...handle}>
                              <GripVertical className="h-4 w-4" />
                            </button>
                            <button onClick={() => toggle(m.id)} className="p-1 text-muted-foreground">
                              {expanded.has(m.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                            <div className="flex-1">
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Module {mi + 1}</p>
                              <p className="font-medium">{m.title}</p>
                            </div>
                            <span className="text-xs text-muted-foreground mr-2">{m.lessons.length} lessons</span>
                            <Button size="sm" variant="ghost" onClick={() => setModuleEditor({ mode: "edit", id: m.id, title: m.title })}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete({ kind: "module", id: m.id, title: m.title })}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>

                          {expanded.has(m.id) && (
                            <div className="border-t border-border p-3 space-y-2 bg-secondary/20">
                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { setDocFile(null); setLessonEditor({
                                    mode: "create", moduleId: m.id,
                                    title: "", video_url: "", content: "", duration: "",
                                    document_path: "", document_type: "pdf",
                                  }); }}
                                >
                                  <Plus className="h-3.5 w-3.5" /> Add lesson
                                </Button>
                              </div>

                              {m.lessons.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-3">No lessons in this module yet.</p>
                              ) : (
                                <DndContext
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragEnd={(e) => reorderLessons(m.id, e)}
                                >
                                  <SortableContext items={m.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                                    {m.lessons.map((l, li) => (
                                      <SortableItem key={l.id} id={l.id}>
                                        {(handle) => (
                                          <div className="flex items-center gap-2 p-2 bg-background rounded border border-border">
                                            <button className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground" {...handle}>
                                              <GripVertical className="h-3.5 w-3.5" />
                                            </button>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm truncate">{li + 1}. {l.title}</p>
                                              <p className="text-[10px] text-muted-foreground truncate font-mono">
                                                {l.document_path ? (
                                                  <span className="text-primary"><FileText className="inline h-3 w-3 mr-1" />{l.document_type?.toUpperCase()} attached</span>
                                                ) : l.video_url ? l.video_url : "no content"}
                                                {l.duration ? ` · ${l.duration}` : ""}
                                              </p>
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => { setDocFile(null); setLessonEditor({
                                                mode: "edit",
                                                moduleId: m.id,
                                                id: l.id,
                                                title: l.title,
                                                video_url: l.video_url ?? "",
                                                content: l.content ?? "",
                                                duration: l.duration ?? "",
                                                document_path: l.document_path ?? "",
                                                document_type: l.document_type ?? "pdf",
                                              }); }}
                                            >
                                              <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => setConfirmDelete({ kind: "lesson", id: l.id, title: l.title })}
                                            >
                                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                            </Button>
                                          </div>
                                        )}
                                      </SortableItem>
                                    ))}
                                  </SortableContext>
                                </DndContext>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </DialogContent>
      </Dialog>

      {/* Module editor */}
      <Dialog open={!!moduleEditor} onOpenChange={(o) => { if (!o) setModuleEditor(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{moduleEditor?.mode === "create" ? "New module" : "Edit module"}</DialogTitle>
          </DialogHeader>
          {moduleEditor && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={moduleEditor.title}
                  onChange={(e) => setModuleEditor({ ...moduleEditor, title: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setModuleEditor(null)}>Cancel</Button>
                <Button variant="gold" onClick={saveModule}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lesson editor */}
      <Dialog open={!!lessonEditor} onOpenChange={(o) => { if (!o) setLessonEditor(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{lessonEditor?.mode === "create" ? "New lesson" : "Edit lesson"}</DialogTitle>
          </DialogHeader>
          {lessonEditor && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={lessonEditor.title} onChange={(e) => setLessonEditor({ ...lessonEditor, title: e.target.value })} autoFocus />
              </div>

              {/* Document upload */}
              <div className="gold-border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <Label className="text-primary font-semibold">Document (PDF / EPUB)</Label>
                </div>

                {lessonEditor.document_path && !docFile && (
                  <p className="text-xs text-muted-foreground font-mono bg-secondary/30 p-2 rounded truncate">
                    ✓ {lessonEditor.document_path.split('/').pop()}
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-border hover:border-primary cursor-pointer transition-base text-sm">
                    <Upload className="h-4 w-4" />
                    {docFile ? docFile.name : "Choose file"}
                    <input
                      type="file"
                      accept=".pdf,.epub,application/pdf,application/epub+zip"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          if (f.size > 100 * 1024 * 1024) {
                            toast.error("File too large. Max 100MB.");
                            return;
                          }
                          setDocFile(f);
                        }
                      }}
                    />
                  </label>
                  {docFile && (
                    <Button size="sm" variant="ghost" onClick={() => setDocFile(null)}>Clear</Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Upload a PDF or EPUB file. This replaces the video content for this lesson. Max 100MB.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Video URL <span className="text-muted-foreground text-[10px]">(optional, only if no document)</span></Label>
                  <Input
                    placeholder="https://iframe.videodelivery.net/..."
                    value={lessonEditor.video_url}
                    onChange={(e) => setLessonEditor({ ...lessonEditor, video_url: e.target.value })}
                    className="font-mono text-xs"
                    disabled={!!docFile || !!lessonEditor.document_path}
                  />
                </div>
                <div>
                  <Label>Duration / Page count</Label>
                  <Input
                    placeholder="e.g. 120 pages or 8:42"
                    value={lessonEditor.duration}
                    onChange={(e) => setLessonEditor({ ...lessonEditor, duration: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Notes / description</Label>
                <Textarea
                  rows={3}
                  value={lessonEditor.content}
                  onChange={(e) => setLessonEditor({ ...lessonEditor, content: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setLessonEditor(null); setDocFile(null); }}>Cancel</Button>
                <Button variant="gold" onClick={saveLesson} disabled={uploading}>
                  {uploading ? "Uploading…" : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.kind}?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.title}" will be permanently removed.
              {confirmDelete?.kind === "module" && " All lessons inside this module will also be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDelete) return;
                if (confirmDelete.kind === "module") await deleteModule(confirmDelete.id);
                else await deleteLesson(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
