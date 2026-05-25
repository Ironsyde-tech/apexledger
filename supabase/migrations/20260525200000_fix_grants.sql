-- =================================================
-- Fix: Ensure PostgREST roles have proper grants
-- =================================================
-- After migrations, the anon/authenticated roles need explicit
-- grants to access tables through the API (RLS still applies).

-- Schema access
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Table access (RLS policies still control row-level visibility)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Future tables auto-grant
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;

-- Functions (including has_role)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;

-- Sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO authenticated;

-- Storage (for books bucket)
GRANT ALL ON ALL TABLES IN SCHEMA storage TO authenticated;

-- Notify PostgREST to reload (via pg_notify)
NOTIFY pgrst, 'reload schema';
