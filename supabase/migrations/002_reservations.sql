create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  reservation_reference text not null unique check (reservation_reference ~ '^SKR-[0-9]{8}-[A-Z0-9]{6}$'),
  submission_token uuid not null unique,
  customer_name text not null check (char_length(trim(customer_name)) between 2 and 120),
  customer_email text not null check (char_length(trim(customer_email)) between 3 and 254),
  customer_phone text not null check (char_length(trim(customer_phone)) between 7 and 24),
  reservation_date date not null,
  reservation_time time not null,
  guest_count integer not null check (guest_count between 1 and 40),
  seating_preference text not null default 'no_preference' check (seating_preference in ('no_preference', 'table', 'booth')),
  occasion text not null default 'none' check (occasion in ('none', 'birthday', 'anniversary', 'business', 'celebration', 'other')),
  allergies text check (char_length(allergies) <= 2000),
  special_requests text check (char_length(special_requests) <= 4000),
  preferred_language text not null check (preferred_language in ('en', 'ja')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'no_show')),
  owner_notes text check (char_length(owner_notes) <= 4000),
  privacy_agreed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists reservations_service_index on public.reservations(reservation_date, reservation_time);
create index if not exists reservations_status_index on public.reservations(status, reservation_date);
create index if not exists reservations_customer_name_index on public.reservations(lower(customer_name));

create table if not exists public.reservation_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  event_type text not null check (event_type in ('owner_new_request', 'customer_request_received', 'customer_confirmed', 'customer_rejected', 'customer_cancelled')),
  delivery_status text not null default 'queued' check (delivery_status in ('queued', 'processing', 'sent', 'failed')),
  attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.reservations enable row level security;
alter table public.reservation_notification_outbox enable row level security;

create policy "admins read reservations" on public.reservations for select using (public.is_admin());
create policy "admins update reservations" on public.reservations for update using (public.is_admin()) with check (public.is_admin());
create policy "admins read notification outbox" on public.reservation_notification_outbox for select using (public.is_admin());
create policy "admins update notification outbox" on public.reservation_notification_outbox for update using (public.is_admin()) with check (public.is_admin());

revoke all on public.reservations from anon;
revoke all on public.reservation_notification_outbox from anon;
grant select, update on public.reservations to authenticated;
grant select, update on public.reservation_notification_outbox to authenticated;

create or replace function public.set_reservation_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then new.confirmed_at = now(); end if;
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then new.cancelled_at = now(); end if;
  return new;
end;
$$;

drop trigger if exists reservations_updated_at on public.reservations;
create trigger reservations_updated_at before update on public.reservations
for each row execute function public.set_reservation_updated_at();

create or replace function public.queue_reservation_notifications()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.reservation_notification_outbox(reservation_id, event_type)
    values (new.id, 'owner_new_request'), (new.id, 'customer_request_received');
  elsif new.status is distinct from old.status then
    if new.status = 'confirmed' then
      insert into public.reservation_notification_outbox(reservation_id, event_type) values (new.id, 'customer_confirmed');
    elsif new.status = 'rejected' then
      insert into public.reservation_notification_outbox(reservation_id, event_type) values (new.id, 'customer_rejected');
    elsif new.status = 'cancelled' then
      insert into public.reservation_notification_outbox(reservation_id, event_type) values (new.id, 'customer_cancelled');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists reservations_notification_outbox on public.reservations;
create trigger reservations_notification_outbox after insert or update of status on public.reservations
for each row execute function public.queue_reservation_notifications();

create or replace function public.submit_reservation_request(
  p_submission_token uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_reservation_date date,
  p_reservation_time time,
  p_guest_count integer,
  p_seating_preference text,
  p_occasion text,
  p_allergies text,
  p_special_requests text,
  p_preferred_language text
)
returns table (
  reservation_reference text,
  customer_name text,
  reservation_date date,
  reservation_time time,
  guest_count integer,
  status text,
  was_created boolean
)
language plpgsql security definer set search_path = public
as $$
declare
  existing_reservation public.reservations%rowtype;
  generated_reference text;
  tokyo_today date := (now() at time zone 'Asia/Tokyo')::date;
  tokyo_time time := (now() at time zone 'Asia/Tokyo')::time;
begin
  select * into existing_reservation from public.reservations where submission_token = p_submission_token;
  if found then
    return query select existing_reservation.reservation_reference, existing_reservation.customer_name, existing_reservation.reservation_date,
      existing_reservation.reservation_time, existing_reservation.guest_count, existing_reservation.status, false;
    return;
  end if;

  if char_length(trim(p_customer_name)) not between 2 and 120 then raise exception 'invalid customer name'; end if;
  if p_customer_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'invalid customer email'; end if;
  if char_length(regexp_replace(p_customer_phone, '[^0-9]', '', 'g')) not between 7 and 15 then raise exception 'invalid customer phone'; end if;
  if p_reservation_date < tokyo_today then raise exception 'reservation date is in the past'; end if;
  if p_reservation_time not in (time '11:00', time '11:30', time '12:00', time '12:30', time '13:00', time '13:30', time '14:00', time '14:30', time '17:00', time '17:30', time '18:00', time '18:30', time '19:00', time '19:30', time '20:00', time '20:30', time '21:00', time '21:30', time '22:00') then raise exception 'invalid reservation time'; end if;
  if p_reservation_date = tokyo_today and p_reservation_time <= tokyo_time then raise exception 'reservation time is in the past'; end if;
  if p_guest_count not between 1 and 40 then raise exception 'invalid guest count'; end if;
  if p_seating_preference not in ('no_preference', 'table', 'booth') then raise exception 'invalid seating preference'; end if;
  if p_occasion not in ('none', 'birthday', 'anniversary', 'business', 'celebration', 'other') then raise exception 'invalid occasion'; end if;
  if p_preferred_language not in ('en', 'ja') then raise exception 'invalid preferred language'; end if;

  loop
    generated_reference := 'SKR-' || to_char(p_reservation_date, 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.reservations where public.reservations.reservation_reference = generated_reference);
  end loop;

  insert into public.reservations (
    reservation_reference, submission_token, customer_name, customer_email, customer_phone, reservation_date, reservation_time,
    guest_count, seating_preference, occasion, allergies, special_requests, preferred_language, status
  ) values (
    generated_reference, p_submission_token, trim(p_customer_name), lower(trim(p_customer_email)), trim(p_customer_phone), p_reservation_date, p_reservation_time,
    p_guest_count, p_seating_preference, p_occasion, nullif(trim(p_allergies), ''), nullif(trim(p_special_requests), ''), p_preferred_language, 'pending'
  ) returning * into existing_reservation;

  return query select existing_reservation.reservation_reference, existing_reservation.customer_name, existing_reservation.reservation_date,
    existing_reservation.reservation_time, existing_reservation.guest_count, existing_reservation.status, true;
end;
$$;

revoke all on function public.submit_reservation_request(uuid, text, text, text, date, time, integer, text, text, text, text, text) from public;
grant execute on function public.submit_reservation_request(uuid, text, text, text, date, time, integer, text, text, text, text, text) to anon, authenticated;
