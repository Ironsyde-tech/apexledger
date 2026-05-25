create table public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "settings_admin_read" on public.settings
  for select using (public.has_role(auth.uid(), 'admin'));

create policy "settings_admin_write" on public.settings
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();