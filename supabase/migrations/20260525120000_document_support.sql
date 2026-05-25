-- =================================================
-- Phase 1: Add document support to lessons + progress
-- =================================================

-- 1) Add document columns to lessons
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS document_path TEXT,
  ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'pdf',
  ADD COLUMN IF NOT EXISTS total_pages INTEGER;

COMMENT ON COLUMN public.lessons.document_path IS 'Path within the private "books" bucket, e.g. courses/my-course/chapter-1.pdf';
COMMENT ON COLUMN public.lessons.document_type IS 'pdf or epub';
COMMENT ON COLUMN public.lessons.total_pages IS 'Total pages in the document (null for EPUB which uses locations)';

-- 2) Add page-level tracking to lesson_progress
ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS current_page INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_pages INTEGER DEFAULT 0;

COMMENT ON COLUMN public.lesson_progress.current_page IS 'Last page the user was reading';
COMMENT ON COLUMN public.lesson_progress.total_pages IS 'Cached total pages for percentage calculation';

-- 3) Create private storage bucket for books
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'books',
  'books',
  false,
  104857600, -- 100MB max per file
  ARRAY['application/pdf', 'application/epub+zip']
)
ON CONFLICT (id) DO NOTHING;

-- 4) Storage RLS: only admins can upload/manage, nobody can read directly
--    (reading happens via edge function with service role key)
CREATE POLICY "books_admin_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'books'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "books_admin_select" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'books'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "books_admin_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'books'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "books_admin_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'books'
    AND public.has_role(auth.uid(), 'admin')
  );
