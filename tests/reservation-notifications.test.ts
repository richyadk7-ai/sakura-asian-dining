import { afterEach, describe, expect, it, vi } from "vitest";
import { getReservationEmailConfiguration, renderReservationEmail } from "@/lib/notifications/reservation-notifications";

const reservation = {
  reservationReference: "SKR-20260720-A1B2C3",
  courseId: "welcome-party-course",
  customerName: "<script>Aiko</script>",
  reservationDate: "2026-07-20",
  reservationTime: "19:00",
  guestCount: 2,
  status: "confirmed" as const,
};

describe("reservation customer emails", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("renders only the confirmed status with no links or extra content", () => {
    const email = renderReservationEmail({ event: "customer_confirmed", reservation, customerEmail: "aiko@example.com" });
    expect(email).toEqual({ subject: "Confirmed", text: "Confirmed" });
    expect(JSON.stringify(email)).not.toMatch(/https?:\/\/|href|\.com/i);
  });

  it("renders only the denied status with no links or extra content", () => {
    const email = renderReservationEmail({ event: "customer_rejected", reservation: { ...reservation, status: "rejected" }, customerEmail: "aiko@example.com" });
    expect(email).toEqual({ subject: "Denied", text: "Denied" });
    expect(JSON.stringify(email)).not.toMatch(/https?:\/\/|href|\.com/i);
  });

  it("rejects a normal account password and accepts a Google App Password", () => {
    vi.stubEnv("GMAIL_USER", "richyadk7@gmail.com");
    vi.stubEnv("GMAIL_APP_PASSWORD", "wrong-pass");
    expect(getReservationEmailConfiguration()).toEqual({ configured: false, state: "invalid-app-password" });

    vi.stubEnv("GMAIL_APP_PASSWORD", "abcd efgh ijkl mnop");
    expect(getReservationEmailConfiguration()).toEqual({ configured: true, state: "ready" });
  });

  it("rejects a sender account other than Sakura's approved Gmail account", () => {
    vi.stubEnv("GMAIL_USER", "someone-else@gmail.com");
    vi.stubEnv("GMAIL_APP_PASSWORD", "abcd efgh ijkl mnop");
    expect(getReservationEmailConfiguration()).toEqual({ configured: false, state: "unexpected-user" });
  });
});
