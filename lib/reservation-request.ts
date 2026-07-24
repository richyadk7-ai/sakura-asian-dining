import { z } from "zod";
import { isCourseId } from "@/data/courses";
import { restaurantConfig } from "@/data/restaurant";
import type { ReservationConfirmation, ReservationRequest, ReservationStatusSnapshot } from "@/types";

export const MIN_RESERVATION_GUESTS = restaurantConfig.reservations.minimumGuests;
export const MAX_RESERVATION_GUESTS = restaurantConfig.reservations.maximumOnlineGuests;
export const RESERVATION_TIME_SLOTS = restaurantConfig.reservations.timeSlots;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const phonePattern = /^\+?[0-9()\-\s]{7,24}$/;

function isCalendarDate(value: string) {
  if (!datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function getTokyoNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: restaurantConfig.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}` };
}

export function getRequestableTimes(date: string) {
  const now = getTokyoNow();
  if (date < now.date) return [];
  return RESERVATION_TIME_SLOTS.filter((time) => date > now.date || time > now.time);
}

export const reservationRequestSchema = z.object({
  courseId: z.string().refine(isCourseId).nullable(),
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email().max(254),
  customerPhone: z.string().trim().refine((value) => phonePattern.test(value) && value.replace(/\D/g, "").length >= 7 && value.replace(/\D/g, "").length <= 15),
  reservationDate: z.string().refine(isCalendarDate),
  reservationTime: z.string().refine((value): value is (typeof RESERVATION_TIME_SLOTS)[number] => RESERVATION_TIME_SLOTS.includes(value as (typeof RESERVATION_TIME_SLOTS)[number])),
  guestCount: z.number().int().min(MIN_RESERVATION_GUESTS).max(MAX_RESERVATION_GUESTS),
  seatingPreference: z.enum(["no_preference", "table", "booth"]),
  occasion: z.enum(["none", "birthday", "anniversary", "business", "celebration", "other"]),
  allergies: z.string().trim().max(2000),
  specialRequests: z.string().trim().max(4000),
  preferredLanguage: z.enum(["en", "ja"]),
  agreement: z.literal(true),
  submissionToken: z.string().uuid(),
}).superRefine((value, context) => {
  const now = getTokyoNow();
  if (value.reservationDate < now.date) context.addIssue({ code: "custom", path: ["reservationDate"], message: "past_date" });
  if (value.reservationDate === now.date && value.reservationTime <= now.time) context.addIssue({ code: "custom", path: ["reservationTime"], message: "past_time" });
});

export const reservationConfirmationSchema = z.object({
  reservationReference: z.string().regex(/^SKR-\d{8}-[A-Z0-9]{6}$/),
  courseId: z.string().refine(isCourseId).nullable().optional().transform((value) => value ?? null),
  customerName: z.string().min(1),
  reservationDate: z.string().refine(isCalendarDate),
  reservationTime: z.string().regex(/^\d{2}:\d{2}$/),
  guestCount: z.number().int().min(MIN_RESERVATION_GUESTS).max(MAX_RESERVATION_GUESTS),
  status: z.literal("pending"),
});

export const reservationStatusSnapshotSchema = z.object({
  reservationReference: z.string().regex(/^SKR-\d{8}-[A-Z0-9]{6}$/),
  courseId: z.string().refine(isCourseId).nullable().optional().transform((value) => value ?? null),
  customerName: z.string().min(1),
  reservationDate: z.string().refine(isCalendarDate),
  reservationTime: z.string().regex(/^\d{2}:\d{2}$/),
  guestCount: z.number().int().min(MIN_RESERVATION_GUESTS).max(MAX_RESERVATION_GUESTS),
  status: z.enum(["pending", "confirmed", "rejected", "cancelled", "completed", "no_show"]),
  updatedAt: z.string().datetime({ offset: true }),
});

export function reservationIssueField(error: z.ZodError) {
  return String(error.issues[0]?.path[0] ?? "submission");
}

export function parseReservationConfirmation(value: unknown): ReservationConfirmation | null {
  const parsed = reservationConfirmationSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseReservationStatusSnapshot(value: unknown): ReservationStatusSnapshot | null {
  const parsed = reservationStatusSnapshotSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function reservationRpcParams(input: ReservationRequest) {
  return {
    p_course_id: input.courseId,
    p_submission_token: input.submissionToken,
    p_customer_name: input.customerName,
    p_customer_email: input.customerEmail,
    p_customer_phone: input.customerPhone,
    p_reservation_date: input.reservationDate,
    p_reservation_time: input.reservationTime,
    p_guest_count: input.guestCount,
    p_seating_preference: input.seatingPreference,
    p_occasion: input.occasion,
    p_allergies: input.allergies || null,
    p_special_requests: input.specialRequests || null,
    p_preferred_language: input.preferredLanguage,
  };
}
