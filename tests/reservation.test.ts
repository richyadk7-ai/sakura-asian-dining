import { describe, expect, it } from "vitest";
import { buildTabelogReservationUrl } from "@/lib/reservation";
import { getTokyoNow, reservationRequestSchema } from "@/lib/reservation-request";

function futureDate(days = 1) {
  const date = new Date(`${getTokyoNow().date}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const validRequest = () => ({
  courseId: "welcome-party-course",
  customerName: "Aiko Tanaka",
  customerEmail: "aiko@example.com",
  customerPhone: "+81 90-1234-5678",
  reservationDate: futureDate(),
  reservationTime: "19:00",
  guestCount: 2,
  seatingPreference: "no_preference",
  occasion: "none",
  allergies: "",
  specialRequests: "",
  preferredLanguage: "en",
  agreement: true,
  submissionToken: "123e4567-e89b-42d3-a456-426614174000",
});

describe("official reservation handoff", () => {
  it("constructs the direct Tabelog booking endpoint with all required values", () => {
    expect(buildTabelogReservationUrl({ date: "2026-08-09", time: "19:30", guests: 4 })).toBe("https://tabelog.com/booking/form/new?member=4&rcd=13218334&visit_date=20260809&visit_time=1930&lid=yoyaku_rstdtl_side_calendar");
  });
  it("rejects malformed values instead of opening a generic listing", () => {
    expect(() => buildTabelogReservationUrl({ date: "09/08/2026", time: "7pm", guests: 0 })).toThrow();
  });
});

describe("reservation request validation", () => {
  it("accepts a complete future request", () => expect(reservationRequestSchema.safeParse(validRequest()).success).toBe(true));

  it.each([
    ["past date", { reservationDate: "2020-01-01" }],
    ["invalid email", { customerEmail: "not-an-email" }],
    ["invalid phone", { customerPhone: "123" }],
    ["invalid time", { reservationTime: "16:15" }],
    ["too many guests", { guestCount: 41 }],
    ["unknown course", { courseId: "not-a-real-course" }],
    ["missing agreement", { agreement: false }],
  ])("rejects %s", (_label, change) => expect(reservationRequestSchema.safeParse({ ...validRequest(), ...change }).success).toBe(false));
});
