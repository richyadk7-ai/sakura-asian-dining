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

export type ReservationEmailDelivery = "sent" | "already-sent" | "failed" | "not-configured" | "not-applicable";

const DECISION_GUARD_EVENT = "customer_request_received";

function eventForStatus(status: ReservationStatus): ReservationNotificationEvent | null {
  if (status === "confirmed") return "customer_confirmed";
  if (status === "rejected") return "customer_rejected";
  return null;
}

export async function deliverReservationStatusEmail(client: SupabaseClient, reservation: ReservationEmailRow): Promise<ReservationEmailDelivery> {
  const event = eventForStatus(reservation.status);
  if (!event) return "not-applicable";

  const { data: claim, error: claimError } = await client
    .from("reservation_notification_outbox")
    .update({ delivery_status: "processing", last_error: null, sent_at: null })
    .eq("reservation_id", reservation.id)
    .eq("event_type", DECISION_GUARD_EVENT)
    .in("delivery_status", ["queued", "failed"])
    .select("id,attempt_count")
    .maybeSingle();
  if (claimError) {
    console.error("Reservation email claim failed", { reservationId: reservation.id, reason: claimError.message });
    return "failed";
  }
  if (!claim) return "already-sent";
  const attemptCount = (typeof claim.attempt_count === "number" ? claim.attempt_count : 0) + 1;

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
    idempotencyKey: `reservation-decision-${reservation.reservation_reference}`,
  });

  const lastError = result.sent ? null : (result.reason ?? "Email delivery failed").slice(0, 1000);
  const sentAt = result.sent ? new Date().toISOString() : null;

  const { error: guardUpdateError } = await client.from("reservation_notification_outbox").update({
    delivery_status: result.sent ? "sent" : "failed",
    attempt_count: attemptCount,
    last_error: lastError,
    sent_at: sentAt,
  }).eq("reservation_id", reservation.id).eq("event_type", DECISION_GUARD_EVENT);

  const { error: eventUpdateError } = await client.from("reservation_notification_outbox").update({
    delivery_status: result.sent ? "sent" : "failed",
    attempt_count: attemptCount,
    last_error: lastError,
    sent_at: sentAt,
  }).eq("reservation_id", reservation.id).eq("event_type", event);

  if (guardUpdateError || eventUpdateError) {
    console.error("Reservation email delivery audit update failed", {
      reservationId: reservation.id,
      guardReason: guardUpdateError?.message,
      eventReason: eventUpdateError?.message,
    });
    return "failed";
  }

  if (result.sent) return "sent";
  return reservationNotificationService.configured ? "failed" : "not-configured";
}
