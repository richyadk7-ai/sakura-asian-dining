"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTokyoNow, MAX_RESERVATION_GUESTS, MIN_RESERVATION_GUESTS, RESERVATION_TIME_SLOTS } from "@/lib/reservation-request";
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
  const { error } = await client.from("reservations").update({ status: parsed.data.status }).eq("id", parsed.data.id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/reservations");
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
