alter table public.reservations add column if not exists course_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'reservations_course_id_check'
      and conrelid = 'public.reservations'::regclass
  ) then
    alter table public.reservations add constraint reservations_course_id_check check (
      course_id is null or course_id in (
        'welcome-party-course',
        'sakura-150-minute-course',
        'tandoori-bbq-course',
        'sakura-special-drink-course',
        'grilled-chicken-drink-course'
      )
    );
  end if;
end;
$$;

drop function if exists public.submit_reservation_request(uuid, text, text, text, date, time, integer, text, text, text, text, text, text);

create function public.submit_reservation_request(
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
  p_preferred_language text,
  p_course_id text
)
returns table (
  reservation_reference text,
  course_id text,
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
    return query select existing_reservation.reservation_reference, existing_reservation.course_id, existing_reservation.customer_name,
      existing_reservation.reservation_date, existing_reservation.reservation_time, existing_reservation.guest_count, existing_reservation.status, false;
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
  if p_course_id is not null and p_course_id not in (
    'welcome-party-course',
    'sakura-150-minute-course',
    'tandoori-bbq-course',
    'sakura-special-drink-course',
    'grilled-chicken-drink-course'
  ) then raise exception 'invalid course'; end if;

  loop
    generated_reference := 'SKR-' || to_char(p_reservation_date, 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.reservations where public.reservations.reservation_reference = generated_reference);
  end loop;

  insert into public.reservations (
    reservation_reference, submission_token, course_id, customer_name, customer_email, customer_phone, reservation_date, reservation_time,
    guest_count, seating_preference, occasion, allergies, special_requests, preferred_language, status
  ) values (
    generated_reference, p_submission_token, p_course_id, trim(p_customer_name), lower(trim(p_customer_email)), trim(p_customer_phone), p_reservation_date, p_reservation_time,
    p_guest_count, p_seating_preference, p_occasion, nullif(trim(p_allergies), ''), nullif(trim(p_special_requests), ''), p_preferred_language, 'pending'
  ) returning * into existing_reservation;

  return query select existing_reservation.reservation_reference, existing_reservation.course_id, existing_reservation.customer_name,
    existing_reservation.reservation_date, existing_reservation.reservation_time, existing_reservation.guest_count, existing_reservation.status, true;
end;
$$;

revoke all on function public.submit_reservation_request(uuid, text, text, text, date, time, integer, text, text, text, text, text, text) from public;
grant execute on function public.submit_reservation_request(uuid, text, text, text, date, time, integer, text, text, text, text, text, text) to anon, authenticated;
