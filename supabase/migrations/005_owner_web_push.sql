create table if not exists public.owner_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) between 16 and 2048 and endpoint like 'https://%'),
  p256dh text not null check (char_length(p256dh) between 16 and 512),
  auth text not null check (char_length(auth) between 8 and 256),
  user_agent text check (char_length(user_agent) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.owner_push_subscriptions enable row level security;

drop policy if exists "owners read own push subscriptions" on public.owner_push_subscriptions;
create policy "owners read own push subscriptions" on public.owner_push_subscriptions
for select using (public.is_admin() and user_id = auth.uid());

drop policy if exists "owners create own push subscriptions" on public.owner_push_subscriptions;
create policy "owners create own push subscriptions" on public.owner_push_subscriptions
for insert with check (public.is_admin() and user_id = auth.uid());

drop policy if exists "owners update own push subscriptions" on public.owner_push_subscriptions;
create policy "owners update own push subscriptions" on public.owner_push_subscriptions
for update using (public.is_admin() and user_id = auth.uid()) with check (public.is_admin() and user_id = auth.uid());

drop policy if exists "owners delete own push subscriptions" on public.owner_push_subscriptions;
create policy "owners delete own push subscriptions" on public.owner_push_subscriptions
for delete using (public.is_admin() and user_id = auth.uid());

revoke all on public.owner_push_subscriptions from anon;
grant select, insert, update, delete on public.owner_push_subscriptions to authenticated;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.owner_push_dispatch_config (
  singleton boolean primary key default true check (singleton),
  secret_hash text not null check (char_length(secret_hash) = 64),
  updated_at timestamptz not null default now()
);

revoke all on private.owner_push_dispatch_config from public, anon, authenticated;

create or replace function public.get_owner_push_targets(p_dispatch_secret text)
returns table (endpoint text, p256dh text, auth text)
language sql stable security definer set search_path = public, private
as $function$
  select subscription.endpoint, subscription.p256dh, subscription.auth
  from public.owner_push_subscriptions subscription
  where char_length(coalesce(p_dispatch_secret, '')) >= 32
    and exists (
      select 1 from private.owner_push_dispatch_config config
      where config.secret_hash = encode(extensions.digest(p_dispatch_secret, 'sha256'), 'hex')
    );
$function$;

create or replace function public.delete_stale_push_target(p_dispatch_secret text, p_endpoint text)
returns void language sql security definer set search_path = public, private
as $function$
  delete from public.owner_push_subscriptions
  where endpoint = p_endpoint
    and char_length(coalesce(p_dispatch_secret, '')) >= 32
    and exists (
      select 1 from private.owner_push_dispatch_config config
      where config.secret_hash = encode(extensions.digest(p_dispatch_secret, 'sha256'), 'hex')
    );
$function$;

revoke all on function public.get_owner_push_targets(text) from public;
revoke all on function public.delete_stale_push_target(text, text) from public;
grant execute on function public.get_owner_push_targets(text) to anon, authenticated;
grant execute on function public.delete_stale_push_target(text, text) to anon, authenticated;

-- Hash the same high-entropy server-only value once in the SQL editor:
-- insert into private.owner_push_dispatch_config(singleton, secret_hash)
-- values (true, encode(extensions.digest('GENERATED_SERVER_SECRET', 'sha256'), 'hex'))
-- on conflict(singleton) do update set secret_hash = excluded.secret_hash, updated_at = now();
