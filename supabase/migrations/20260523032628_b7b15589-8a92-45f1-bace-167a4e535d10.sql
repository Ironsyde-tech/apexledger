drop policy if exists "settings_admin_read" on public.settings;

create policy "settings_public_read" on public.settings
  for select using (true);