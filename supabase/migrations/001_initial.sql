create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.admin_users where user_id = auth.uid()) $$;

create table if not exists public.content_drafts (
  id text primary key check (id in ('restaurant','menu','courses','pages')),
  payload jsonb not null,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.published_content (
  id text primary key check (id in ('restaurant','menu','courses','pages')),
  payload jsonb not null,
  published_by uuid not null references auth.users(id),
  published_at timestamptz not null default now()
);

create table if not exists public.restaurant_photos (
  id text primary key,
  category text not null check (category in ('food','drinks','interior','exterior','menu','course')),
  source_order integer not null,
  storage_path text unique not null,
  original_filename text not null,
  alt_en text not null check (length(trim(alt_en)) > 0),
  alt_ja text not null check (length(trim(alt_ja)) > 0),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  sha256 text unique not null,
  perceptual_hash text not null,
  blur_data_url text,
  authorized boolean not null default false,
  excluded boolean not null default false,
  exclusion_reason text,
  featured boolean not null default false,
  published boolean not null default false,
  uploaded_by uuid not null references auth.users(id),
  uploaded_at timestamptz not null default now(),
  published_at timestamptz
);

alter table public.admin_users enable row level security;
alter table public.content_drafts enable row level security;
alter table public.published_content enable row level security;
alter table public.restaurant_photos enable row level security;

create policy "owner can read own allowlist record" on public.admin_users for select using (user_id = auth.uid());
create policy "admins manage drafts" on public.content_drafts for all using (public.is_admin()) with check (public.is_admin());
create policy "everyone reads published documents" on public.published_content for select using (true);
create policy "admins manage published documents" on public.published_content for all using (public.is_admin()) with check (public.is_admin());
create policy "published authorized photos are readable" on public.restaurant_photos for select using ((published and authorized and not excluded) or public.is_admin());
create policy "admins insert photos" on public.restaurant_photos for insert with check (public.is_admin() and uploaded_by = auth.uid());
create policy "admins update photos" on public.restaurant_photos for update using (public.is_admin()) with check (public.is_admin());
create policy "admins delete photos" on public.restaurant_photos for delete using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('restaurant-originals', 'restaurant-originals', false, 31457280, array['image/jpeg','image/png','image/webp','image/avif','image/tiff'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "published originals or owners can read" on storage.objects for select using (
  bucket_id = 'restaurant-originals' and (
    public.is_admin() or exists(select 1 from public.restaurant_photos photo where photo.storage_path = name and photo.published and photo.authorized and not photo.excluded)
  )
);
create policy "owners upload originals" on storage.objects for insert with check (bucket_id = 'restaurant-originals' and public.is_admin());
create policy "owners update originals" on storage.objects for update using (bucket_id = 'restaurant-originals' and public.is_admin());
create policy "owners delete originals" on storage.objects for delete using (bucket_id = 'restaurant-originals' and public.is_admin());

create or replace function public.publish_content_document(document_id text)
returns void language plpgsql security definer set search_path = public
as $$
declare draft_payload jsonb;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  select payload into draft_payload from public.content_drafts where id = document_id;
  if draft_payload is null then raise exception 'save a draft before publishing'; end if;
  insert into public.published_content(id, payload, published_by, published_at)
  values(document_id, draft_payload, auth.uid(), now())
  on conflict(id) do update set payload = excluded.payload, published_by = excluded.published_by, published_at = excluded.published_at;
end;
$$;

revoke all on function public.publish_content_document(text) from public;
grant execute on function public.publish_content_document(text) to authenticated;

-- Bootstrap an owner after creating the Auth user:
-- insert into public.admin_users(user_id) values ('AUTH-USER-UUID');
