"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getTokyoNow, MAX_RESERVATION_GUESTS, MIN_RESERVATION_GUESTS, RESERVATION_TIME_SLOTS } from "@/lib/reservation-request";
import { reservationNotificationService } from "@/lib/notifications/reservation-notifications";
import { deliverReservationStatusEmail, RESERVATION_EMAIL_COLUMNS, type ReservationEmailRow } from "@/lib/reservations/status-email";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

export async function updateReservationStatus(formData: FormData) {
  const parsed = statusUpdateSchema.safeParse({ id: String(formData.get("id") ?? ""), status: String(formData.get("status") ?? "") });
  if (!parsed.success) throw new Error("Invalid reservation status update");
  const client = await requireReservationAdmin();
  const { data, error } = await client.from("reservations").update({ status: parsed.data.status }).eq("id", parsed.data.id).select(RESERVATION_EMAIL_COLUMNS).single();
  if (error) throw new Error(error.message);
  const email = await deliverReservationStatusEmail(client, data as ReservationEmailRow);
  revalidatePath("/admin/reservations");
  redirect(`/admin/reservations?email=${email}`);
}

export async function resendReservationStatusEmail(formData: FormData) {
  const parsed = z.object({ id: z.string().uuid() }).safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) throw new Error("Invalid reservation email request");
  const client = await requireReservationAdmin();
  const { data, error } = await client.from("reservations").select(RESERVATION_EMAIL_COLUMNS).eq("id", parsed.data.id).single();
  if (error) throw new Error(error.message);
  const email = await deliverReservationStatusEmail(client, data as ReservationEmailRow, true);
  redirect(`/admin/reservations?email=${email}`);
}

export async function sendReservationTestEmail() {
  await requireReservationAdmin();
  const recipient = process.env.RESERVATION_OWNER_EMAIL?.trim();
  if (!recipient || !reservationNotificationService.configured) redirect("/admin/reservations?email=test-not-configured");
  const now = getTokyoNow();
  const result = await reservationNotificationService.deliver({
    event: "customer_confirmed",
    reservation: { reservationReference: `SKR-${now.date.replaceAll("-", "")}-TEST01`, courseId: null, customerName: "Sakura Owner", reservationDate: now.date, reservationTime: now.time, guestCount: 2, status: "confirmed" },
    customerEmail: recipient,
    preferredLanguage: "en",
    idempotencyKey: `owner-live-test-${crypto.randomUUID()}`,
  });
  redirect(`/admin/reservations?email=${result.sent ? "test-sent" : "test-failed"}`);
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
