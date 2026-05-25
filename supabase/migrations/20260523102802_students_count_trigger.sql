-- Auto-increment / decrement courses.students_count when enrollments change.
-- This replaces the static, never-updated default of 0.

CREATE OR REPLACE FUNCTION public.update_students_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.courses
    SET students_count = COALESCE(students_count, 0) + 1
    WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.courses
    SET students_count = GREATEST(COALESCE(students_count, 0) - 1, 0)
    WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_enrollment_count_insert
  AFTER INSERT ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_students_count();

CREATE TRIGGER trg_enrollment_count_delete
  AFTER DELETE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_students_count();

-- Lock down direct execution
REVOKE EXECUTE ON FUNCTION public.update_students_count() FROM PUBLIC, anon, authenticated;
