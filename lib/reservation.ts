import { RESTAURANT_CODE } from "@/lib/constants";
import type { ReservationHandoff } from "@/types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

export function buildTabelogReservationUrl(input: ReservationHandoff) {
  if (!DATE_PATTERN.test(input.date)) throw new Error("Invalid reservation date");
  if (!TIME_PATTERN.test(input.time)) throw new Error("Invalid reservation time");
  if (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > 40) {
    throw new Error("Guest count must be between 1 and 40");
  }

  const params = new URLSearchParams({
    member: String(input.guests),
    rcd: RESTAURANT_CODE,
    visit_date: input.date.replaceAll("-", ""),
    visit_time: input.time.replace(":", ""),
    lid: "yoyaku_rstdtl_side_calendar",
  });
  return `https://tabelog.com/booking/form/new?${params.toString()}`;
}

export function getTokyoDate(offsetDays = 1) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(Date.now() + offsetDays * 86_400_000));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
