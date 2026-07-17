import type { ReservationConfirmation } from "@/types";

export type ReservationNotificationEvent =
  | "owner_new_request"
  | "customer_request_received"
  | "customer_confirmed"
  | "customer_rejected"
  | "customer_cancelled";

export type ReservationNotificationMessage = {
  event: ReservationNotificationEvent;
  reservation: ReservationConfirmation;
  customerEmail?: string;
  preferredLanguage?: "en" | "ja";
};

export interface ReservationNotificationService {
  readonly configured: boolean;
  deliver(message: ReservationNotificationMessage): Promise<{ sent: boolean; reason?: string }>;
}

class UnconfiguredReservationNotificationService implements ReservationNotificationService {
  readonly configured = false;

  async deliver() {
    return { sent: false, reason: "No email provider is configured. The database outbox remains queued." };
  }
}

export const reservationNotificationService: ReservationNotificationService = new UnconfiguredReservationNotificationService();
