import { describe, expect, it } from "vitest";
import { renderReservationEmail } from "@/lib/notifications/reservation-notifications";

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
  it("renders a safe English confirmation with a live status link", () => {
    const email = renderReservationEmail({ event: "customer_confirmed", reservation, customerEmail: "aiko@example.com", preferredLanguage: "en", statusToken: "123e4567-e89b-42d3-a456-426614174000" });
    expect(email.subject).toContain("confirmed");
    expect(email.text).toContain("View live reservation status");
    expect(email.text).toContain("token=123e4567-e89b-42d3-a456-426614174000");
    expect(email.html).toContain("&lt;script&gt;Aiko&lt;/script&gt;");
    expect(email.html).not.toContain("<script>Aiko</script>");
  });

  it("renders the Japanese unavailable decision", () => {
    const email = renderReservationEmail({ event: "customer_rejected", reservation: { ...reservation, status: "rejected" }, customerEmail: "aiko@example.com", preferredLanguage: "ja" });
    expect(email.subject).toContain("予約リクエストについて");
    expect(email.text).toContain("今回はご予約を確定できませんでした");
  });
});
