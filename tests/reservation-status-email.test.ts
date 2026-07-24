import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const notification = vi.hoisted(() => ({
  configured: true,
  deliver: vi.fn(),
}));

vi.mock("@/lib/notifications/reservation-notifications", () => ({
  reservationNotificationService: notification,
}));

import { deliverReservationStatusEmail, type ReservationEmailRow } from "@/lib/reservations/status-email";

const reservation: ReservationEmailRow = {
  id: "22222222-2222-4222-8222-222222222222",
  reservation_reference: "SKR-20260720-A1B2C3",
  submission_token: "11111111-1111-4111-8111-111111111111",
  course_id: null,
  customer_name: "Aiko",
  customer_email: "aiko@example.com",
  reservation_date: "2026-07-20",
  reservation_time: "19:00:00",
  guest_count: 2,
  preferred_language: "en",
  status: "confirmed",
  updated_at: "2026-07-18T10:00:00.000Z",
};

function query(result?: { data: { id: string; attempt_count: number } | null; error: { message: string } | null }) {
  const chain = {
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    select: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => result ?? { data: null, error: null }),
  };
  return chain;
}

describe("reservation status email delivery", () => {
  beforeEach(() => {
    notification.configured = true;
    notification.deliver.mockReset();
    notification.deliver.mockResolvedValue({ sent: true, provider: "gmail", messageId: "message-1" });
  });

  it("sends the first decision email after atomically claiming the request", async () => {
    const claim = query({ data: { id: "claim-1", attempt_count: 0 }, error: null });
    const guardAudit = query();
    const eventAudit = query();
    const client = { from: vi.fn().mockReturnValueOnce(claim).mockReturnValueOnce(guardAudit).mockReturnValueOnce(eventAudit) } as unknown as SupabaseClient;

    await expect(deliverReservationStatusEmail(client, reservation)).resolves.toBe("sent");
    expect(notification.deliver).toHaveBeenCalledOnce();
    expect(notification.deliver).toHaveBeenCalledWith(expect.objectContaining({
      event: "customer_confirmed",
      customerEmail: "aiko@example.com",
      idempotencyKey: "reservation-decision-SKR-20260720-A1B2C3",
    }));
    expect(claim.update).toHaveBeenCalledWith(expect.objectContaining({ delivery_status: "processing" }));
    expect(claim.in).toHaveBeenCalledWith("delivery_status", ["queued", "failed"]);
    expect(guardAudit.update).toHaveBeenCalledWith(expect.objectContaining({ delivery_status: "sent", attempt_count: 1 }));
    expect(eventAudit.update).toHaveBeenCalledWith(expect.objectContaining({ delivery_status: "sent", attempt_count: 1 }));
  });

  it("does not send another email after the request has already been claimed", async () => {
    const claim = query({ data: null, error: null });
    const client = { from: vi.fn(() => claim) } as unknown as SupabaseClient;

    await expect(deliverReservationStatusEmail(client, reservation)).resolves.toBe("already-sent");
    expect(notification.deliver).not.toHaveBeenCalled();
  });

  it("does not email for non-decision statuses", async () => {
    const client = { from: vi.fn() } as unknown as SupabaseClient;

    await expect(deliverReservationStatusEmail(client, { ...reservation, status: "cancelled" })).resolves.toBe("not-applicable");
    expect(client.from).not.toHaveBeenCalled();
    expect(notification.deliver).not.toHaveBeenCalled();
  });

  it("returns a failed decision to the queue so it can be retried", async () => {
    notification.deliver.mockResolvedValueOnce({ sent: false, provider: "gmail", reason: "Invalid login" });
    const claim = query({ data: { id: "claim-1", attempt_count: 2 }, error: null });
    const guardAudit = query();
    const eventAudit = query();
    const client = { from: vi.fn().mockReturnValueOnce(claim).mockReturnValueOnce(guardAudit).mockReturnValueOnce(eventAudit) } as unknown as SupabaseClient;

    await expect(deliverReservationStatusEmail(client, reservation)).resolves.toBe("failed");
    expect(guardAudit.update).toHaveBeenCalledWith(expect.objectContaining({ delivery_status: "failed", attempt_count: 3, last_error: "Invalid login" }));
  });
});
