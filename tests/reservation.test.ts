import { describe, expect, it } from "vitest";
import { getTokyoNow, reservationRequestSchema, reservationStatusSnapshotSchema } from "@/lib/reservation-request";

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

  it("accepts every owner decision in the safe customer status payload", () => {
    for (const status of ["pending", "confirmed", "rejected", "cancelled", "completed", "no_show"]) {
      expect(reservationStatusSnapshotSchema.safeParse({
        reservationReference: "SKR-20260720-A1B2C3",
        courseId: "welcome-party-course",
        customerName: "Aiko Tanaka",
        reservationDate: "2026-07-20",
        reservationTime: "19:00",
        guestCount: 2,
        status,
        updatedAt: "2026-07-17T12:00:00.000Z",
      }).success).toBe(true);
    }
  });
});
