import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slug";

export type CourseFormValue = {
  id?: string;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  price: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string | null;
  image_url: string | null;
  published: boolean;
  status: string;
};

const empty: CourseFormValue = {
  title: "",
  slug: "",
  tagline: "",
  description: "",
  category: "",
  price: 0,
  level: "Beginner",
  duration: "",
  image_url: null,
  published: false,
  status: "active",
};

export function CourseFormDialog({
  open,
  mode,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: CourseFormValue | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState<CourseFormValue>(empty);
  const [slugDirty, setSlugDirty] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Fetch categories
  useEffect(() => {
    supabase.from('categories').select('id, name').eq('active', true).order('position').then(({ data }) => {
      setCategories(data ?? []);
    });
  }, [open]);

  useEffect(() => {
    if (open) {
      setValue(initial ?? empty);
      setSlugDirty(mode === "edit");
      setFile(null);
      setDocFile(null);
    }
  }, [open, initial, mode]);

  const setTitle = (title: string) => {
    setValue((v) => ({ ...v, title, slug: slugDirty ? v.slug : slugify(title) }));
  };

  const submit = async () => {
    if (!value.title.trim()) return toast.error("Title is required");
    if (!value.slug.trim()) return toast.error("Slug is required");
    if (value.price < 0) return toast.error("Price cannot be negative");

    setSaving(true);
    try {
      let image_url = value.image_url;

      const upload = async (courseId: string) => {
        if (!file) return;
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${courseId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("course-covers")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("course-covers").getPublicUrl(path);
        image_url = data.publicUrl;
      };

      if (mode === "create") {
        // Insert first to get id, then upload + update with image_url
        const { data: inserted, error } = await supabase
          .from("courses")
          .insert({
            title: value.title.trim(),
            slug: slugify(value.slug),
            tagline: value.tagline || null,
            description: value.description || null,
            category: value.category || null,
            price: value.price,
            level: value.level as any,
            duration: value.duration || null,
            published: value.published,
            status: value.status || 'active',
          })
          .select("id")
          .single();
        if (error) throw error;
        await upload(inserted.id);
        if (image_url) {
          const { error: uErr } = await supabase
            .from("courses")
            .update({ image_url })
            .eq("id", inserted.id);
          if (uErr) throw uErr;
        }
        toast.success("Course created");

        // Auto-create module + lesson if a document was uploaded
        if (docFile) {
          const ext = docFile.name.split('.').pop()?.toLowerCase() ?? 'pdf';
          const docType = ext === 'epub' ? 'epub' : 'pdf';
          const storagePath = `courses/${inserted.id}/${Date.now()}-${docFile.name}`;

          const { error: docUpErr } = await supabase.storage
            .from('books')
            .upload(storagePath, docFile, { contentType: docFile.type, upsert: false });

          if (docUpErr) {
            toast.error(`Course created, but book upload failed: ${docUpErr.message}`);
          } else {
            // Create module
            const { data: mod, error: modErr } = await supabase
              .from('modules')
              .insert({ course_id: inserted.id, title: 'Content', position: 0 })
              .select('id')
              .single();

            if (!modErr && mod) {
              // Create lesson with document
              await supabase.from('lessons').insert({
                module_id: mod.id,
                title: docFile.name.replace(/\.[^.]+$/, ''),
                document_path: storagePath,
                document_type: docType,
                position: 0,
              });
            }
            toast.success('Book uploaded & linked automatically!');
          }
          setDocFile(null);
        }
      } else {
        await upload(value.id!);
        const { error } = await supabase
          .from("courses")
          .update({
            title: value.title.trim(),
            slug: slugify(value.slug),
            tagline: value.tagline || null,
            description: value.description || null,
            category: value.category || null,
            price: value.price,
            level: value.level as any,
            duration: value.duration || null,
            image_url,
            published: value.published,
            status: value.status || 'active',
          })
          .eq("id", value.id!);
        if (error) throw error;
        toast.success("Course updated");
      }

      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New course" : "Edit course"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input value={value.title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={value.slug}
                onChange={(e) => { setSlugDirty(true); setValue({ ...value, slug: e.target.value }); }}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={value.category ?? ''} onValueChange={(v) => setValue({ ...value, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Duration</Label><Input value={value.duration ?? ""} placeholder="e.g. 6 hours" onChange={(e) => setValue({ ...value, duration: e.target.value })} /></div>
          </div>

          <div><Label>Tagline</Label><Input value={value.tagline ?? ""} onChange={(e) => setValue({ ...value, tagline: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea rows={4} value={value.description ?? ""} onChange={(e) => setValue({ ...value, description: e.target.value })} /></div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Price (USD)</Label>
              <Input
                type="number"
                min={0}
                step="1"
                value={value.price}
                onChange={(e) => setValue({ ...value, price: Number(e.target.value) })}
              />
              <p className="text-[11px] text-muted-foreground mt-1">This is the price Checkout charges.</p>
            </div>
            <div>
              <Label>Level</Label>
              <Select value={value.level} onValueChange={(v) => setValue({ ...value, level: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Cover image</Label>
            <div className="flex items-center gap-4">
              {(file || value.image_url) && (
                <img
                  src={file ? URL.createObjectURL(file) : value.image_url!}
                  alt=""
                  className="h-20 w-28 object-cover rounded-md"
                />
              )}
              <label className="flex-1 flex items-center justify-center gap-3 border border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/60 transition-base">
                <Upload className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">{file ? file.name : "Click to upload cover (JPG/PNG/WebP)"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
          </div>

          {/* Quick document upload (create mode) */}
          <div className="gold-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <Label className="text-primary font-semibold">Book / PDF upload</Label>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" /> Quick setup
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Upload your PDF or EPUB here — a module and lesson will be created automatically. No need to use the Curriculum editor.
            </p>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-border rounded-lg p-3 cursor-pointer hover:border-primary/60 transition-base text-sm">
                <Upload className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground truncate">
                  {docFile ? docFile.name : "Choose PDF or EPUB (max 100MB)"}
                </span>
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
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">Published</p>
              <p className="text-xs text-muted-foreground">When off, the course is hidden from the public catalog.</p>
            </div>
            <Switch checked={value.published} onCheckedChange={(c) => setValue({ ...value, published: c })} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div>
              <p className="font-medium text-primary">Coming Soon</p>
              <p className="text-xs text-muted-foreground">Shows a "Coming Soon" badge instead of the enroll button.</p>
            </div>
            <Switch
              checked={value.status === 'coming_soon'}
              onCheckedChange={(c) => setValue({ ...value, status: c ? 'coming_soon' : 'active' })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="gold" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Create course" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
