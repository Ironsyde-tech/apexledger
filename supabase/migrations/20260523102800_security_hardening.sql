-- =============================================
-- Security hardening migration
-- 1. Lock lesson content to enrolled users + admins
-- 2. Scope settings public read to safe keys only
-- =============================================

-- 1. Lessons: only enrolled users and admins can read lesson rows
--    (modules stay public since they only expose titles/positions for curriculum preview)
DROP POLICY IF EXISTS "lessons_public_read" ON public.lessons;

CREATE POLICY "lessons_enrolled_or_admin" ON public.lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.modules m ON m.id = lessons.module_id
      WHERE e.user_id = auth.uid() AND e.course_id = m.course_id
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- 2. Settings: only expose wallet address keys publicly; admins see everything
DROP POLICY IF EXISTS "settings_public_read" ON public.settings;

CREATE POLICY "settings_safe_public_read" ON public.settings
  FOR SELECT USING (
    key IN ('usdt_trc20_address', 'usdt_erc20_address')
    OR public.has_role(auth.uid(), 'admin')
  );
