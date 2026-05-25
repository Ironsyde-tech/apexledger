import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(initial ?? empty);
      setSlugDirty(mode === "edit");
      setFile(null);
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
            <div><Label>Category</Label><Input value={value.category ?? ""} onChange={(e) => setValue({ ...value, category: e.target.value })} /></div>
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

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">Published</p>
              <p className="text-xs text-muted-foreground">When off, the course is hidden from the public catalog.</p>
            </div>
            <Switch checked={value.published} onCheckedChange={(c) => setValue({ ...value, published: c })} />
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
