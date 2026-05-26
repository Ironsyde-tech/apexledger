-- =================================================
-- Categories table + Course status column
-- =================================================

-- 1) Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with existing categories
INSERT INTO public.categories (name, slug, position) VALUES
  ('Trading', 'trading', 0),
  ('Crypto', 'crypto', 1),
  ('Investing', 'investing', 2),
  ('Mentorship', 'mentorship', 3)
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "categories_admin_write" ON public.categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Grant service_role
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.categories TO authenticated;

-- 2) Course status column: active, archived, coming_soon
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK (status IN ('active', 'archived', 'coming_soon'));

-- Update existing published courses to 'active', unpublished to 'active' (draft handled by published flag)
UPDATE public.courses SET status = 'active' WHERE status IS NULL;
