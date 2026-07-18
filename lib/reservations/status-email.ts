import type { SupabaseClient } from "@supabase/supabase-js";
import { reservationNotificationService, type ReservationNotificationEvent } from "@/lib/notifications/reservation-notifications";
import type { Locale, ReservationStatus } from "@/types";

export const RESERVATION_EMAIL_COLUMNS = "id,reservation_reference,submission_token,course_id,customer_name,customer_email,reservation_date,reservation_time,guest_count,preferred_language,status,updated_at";

export type ReservationEmailRow = {
  id: string;
  reservation_reference: string;
  submission_token: string;
  course_id: string | null;
  customer_name: string;
  customer_email: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  preferred_language: Locale;
  status: ReservationStatus;
  updated_at: string;
};

export type ReservationEmailDelivery = "sent" | "failed" | "not-configured" | "not-applicable";

function eventForStatus(status: ReservationStatus): ReservationNotificationEvent | null {
  if (status === "confirmed") return "customer_confirmed";
  if (status === "rejected") return "customer_rejected";
  if (status === "cancelled") return "customer_cancelled";
  return null;
}

export async function deliverReservationStatusEmail(client: SupabaseClient, reservation: ReservationEmailRow, manual = false): Promise<ReservationEmailDelivery> {
  const event = eventForStatus(reservation.status);
  if (!event) return "not-applicable";
  const result = await reservationNotificationService.deliver({
    event,
    reservation: {
      reservationReference: reservation.reservation_reference,
      courseId: reservation.course_id,
      customerName: reservation.customer_name,
      reservationDate: reservation.reservation_date,
      reservationTime: reservation.reservation_time.slice(0, 5),
      guestCount: reservation.guest_count,
      status: reservation.status,
    },
    customerEmail: reservation.customer_email,
    preferredLanguage: reservation.preferred_language,
    statusToken: reservation.submission_token,
    idempotencyKey: `${event}-${reservation.reservation_reference}-${manual ? crypto.randomUUID() : reservation.updated_at}`,
  });

  await client.from("reservation_notification_outbox").update({
    delivery_status: result.sent ? "sent" : "failed",
    attempt_count: 1,
    last_error: result.sent ? null : (result.reason ?? "Email delivery failed").slice(0, 1000),
    sent_at: result.sent ? new Date().toISOString() : null,
  }).eq("reservation_id", reservation.id).eq("event_type", event);

  if (result.sent) return "sent";
  return reservationNotificationService.configured ? "failed" : "not-configured";
}
