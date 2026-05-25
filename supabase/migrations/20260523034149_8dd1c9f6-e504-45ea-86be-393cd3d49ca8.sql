-- Enable pg_net for HTTP calls from triggers
create extension if not exists pg_net with schema extensions;

-- Trigger function: notify edge function on order insert/update
create or replace function public.notify_order_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
  should_send boolean := false;
begin
  if (tg_op = 'INSERT' and new.status = 'pending') then
    should_send := true;
  elsif (tg_op = 'UPDATE' and old.status is distinct from new.status
         and new.status in ('confirmed', 'rejected')) then
    should_send := true;
  end if;

  if not should_send then
    return new;
  end if;

  payload := jsonb_build_object(
    'type', tg_op,
    'table', tg_table_name,
    'record', to_jsonb(new),
    'old_record', case when tg_op = 'UPDATE' then to_jsonb(old) else null end
  );

  perform net.http_post(
    url := 'https://xkvabcmitoztsqvrgscu.supabase.co/functions/v1/order-email-dispatcher',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := payload
  );

  return new;
end;
$$;

drop trigger if exists trg_orders_email_insert on public.orders;
create trigger trg_orders_email_insert
after insert on public.orders
for each row execute function public.notify_order_email();

drop trigger if exists trg_orders_email_update on public.orders;
create trigger trg_orders_email_update
after update on public.orders
for each row execute function public.notify_order_email();