-- Give a customer read-only access to exactly one reservation when they hold
-- both its human reference and the unguessable submission token. No contact,
-- allergy, request or owner-only fields are exposed.
create or replace function public.get_reservation_status(
  p_reservation_reference text,
  p_submission_token uuid
)
returns table (
  reservation_reference text,
  course_id text,
  customer_name text,
  reservation_date date,
  reservation_time time,
  guest_count integer,
  status text,
  updated_at timestamptz
)
language sql stable security definer set search_path = public
as $function$
  select
    reservation.reservation_reference,
    reservation.course_id,
    reservation.customer_name,
    reservation.reservation_date,
    reservation.reservation_time,
    reservation.guest_count,
    reservation.status,
    reservation.updated_at
  from public.reservations reservation
  where reservation.reservation_reference = p_reservation_reference
    and reservation.submission_token = p_submission_token
  limit 1;
$function$;

revoke all on function public.get_reservation_status(text, uuid) from public;
grant execute on function public.get_reservation_status(text, uuid) to anon, authenticated;
