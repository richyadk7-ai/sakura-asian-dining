"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { reservationNotificationService, type ReservationNotificationEvent } from "@/lib/notifications/reservation-notifications";
import { getTokyoNow, MAX_RESERVATION_GUESTS, MIN_RESERVATION_GUESTS, RESERVATION_TIME_SLOTS } from "@/lib/reservation-request";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Locale, ReservationStatus } from "@/types";

async function requireReservationAdmin() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured");
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Authentication required");
  const { data: allowed } = await client.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!allowed) throw new Error("This account is not on the owner allowlist");
  return client;
}

const statusUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "rejected", "cancelled", "completed", "no_show"]),
});

const reservationEmailColumns = "id,reservation_reference,submission_token,course_id,customer_name,customer_email,reservation_date,reservation_time,guest_count,preferred_language,status,updated_at";

type ReservationEmailRow = {
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

function eventForStatus(status: ReservationStatus): ReservationNotificationEvent | null {
  if (status === "confirmed") return "customer_confirmed";
  if (status === "rejected") return "customer_rejected";
  if (status === "cancelled") return "customer_cancelled";
  return null;
}

async function deliverStatusEmail(client: Awaited<ReturnType<typeof requireReservationAdmin>>, reservation: ReservationEmailRow, manual = false) {
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
  }).eq("reservation_id", reservation.id).eq("event_type", event).eq("delivery_status", "queued");

  if (result.sent) return "sent";
  return reservationNotificationService.configured ? "failed" : "not-configured";
}

export async function updateReservationStatus(formData: FormData) {
  const parsed = statusUpdateSchema.safeParse({ id: String(formData.get("id") ?? ""), status: String(formData.get("status") ?? "") });
  if (!parsed.success) throw new Error("Invalid reservation status update");
  const client = await requireReservationAdmin();
  const { data, error } = await client.from("reservations").update({ status: parsed.data.status }).eq("id", parsed.data.id).select(reservationEmailColumns).single();
  if (error) throw new Error(error.message);
  const email = await deliverStatusEmail(client, data as ReservationEmailRow);
  revalidatePath("/admin/reservations");
  redirect(`/admin/reservations?email=${email}`);
}

export async function resendReservationStatusEmail(formData: FormData) {
  const parsed = z.object({ id: z.string().uuid() }).safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) throw new Error("Invalid reservation email request");
  const client = await requireReservationAdmin();
  const { data, error } = await client.from("reservations").select(reservationEmailColumns).eq("id", parsed.data.id).single();
  if (error) throw new Error(error.message);
  const email = await deliverStatusEmail(client, data as ReservationEmailRow, true);
  redirect(`/admin/reservations?email=${email}`);
}

export async function updateReservationDetails(formData: FormData) {
  const date = String(formData.get("reservationDate") ?? "");
  const time = String(formData.get("reservationTime") ?? "");
  const guests = Number(formData.get("guestCount"));
  const ownerNotes = String(formData.get("ownerNotes") ?? "").trim();
  const parsed = z.object({
    id: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => value >= getTokyoNow().date),
    time: z.string().refine((value) => RESERVATION_TIME_SLOTS.includes(value as (typeof RESERVATION_TIME_SLOTS)[number])),
    guests: z.number().int().min(MIN_RESERVATION_GUESTS).max(MAX_RESERVATION_GUESTS),
    ownerNotes: z.string().max(4000),
  }).safeParse({ id: String(formData.get("id") ?? ""), date, time, guests, ownerNotes });
  if (!parsed.success) throw new Error("Invalid reservation details");
  const client = await requireReservationAdmin();
  const { error } = await client.from("reservations").update({ reservation_date: parsed.data.date, reservation_time: parsed.data.time, guest_count: parsed.data.guests, owner_notes: parsed.data.ownerNotes || null }).eq("id", parsed.data.id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/reservations");
}
