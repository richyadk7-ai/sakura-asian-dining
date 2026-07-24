import nodemailer from "nodemailer";
import { restaurantConfig } from "@/data/restaurant";
import type { ReservationStatus } from "@/types";

export type ReservationNotificationEvent = "customer_confirmed" | "customer_rejected";

export type ReservationNotificationDetails = {
  reservationReference: string;
  courseId: string | null;
  customerName: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  status: ReservationStatus;
};

export type ReservationNotificationMessage = {
  event: ReservationNotificationEvent;
  reservation: ReservationNotificationDetails;
  customerEmail?: string;
  idempotencyKey?: string;
};

export type ReservationNotificationResult = {
  sent: boolean;
  provider?: "gmail";
  messageId?: string;
  reason?: string;
};

export interface ReservationNotificationService {
  readonly configured: boolean;
  readonly provider: "gmail" | null;
  deliver(message: ReservationNotificationMessage): Promise<ReservationNotificationResult>;
}

type EmailContent = { subject: "Confirmed" | "Denied"; text: "Confirmed" | "Denied" };
type GmailConfig = { user: string; appPassword: string; from: string };
export type ReservationEmailConfigurationState = "ready" | "missing-user" | "unexpected-user" | "missing-app-password" | "invalid-app-password";

export function getReservationEmailConfiguration(): { configured: boolean; state: ReservationEmailConfigurationState } {
  const user = process.env.GMAIL_USER?.trim();
  const rawPassword = process.env.GMAIL_APP_PASSWORD ?? "";
  const appPassword = rawPassword.replace(/\s/g, "");
  if (!user) return { configured: false, state: "missing-user" };
  if (user.toLocaleLowerCase() !== restaurantConfig.contact.decisionEmailSender.toLocaleLowerCase()) {
    return { configured: false, state: "unexpected-user" };
  }
  if (!rawPassword) return { configured: false, state: "missing-app-password" };
  if (appPassword.length !== 16) return { configured: false, state: "invalid-app-password" };
  return { configured: true, state: "ready" };
}

function gmailConfig(): GmailConfig | null {
  const user = process.env.GMAIL_USER?.trim();
  const appPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!getReservationEmailConfiguration().configured || !user || !appPassword) return null;
  return { user, appPassword, from: `${restaurantConfig.identity.nameEn} <${user}>` };
}

export function renderReservationEmail(message: ReservationNotificationMessage): EmailContent {
  const status = message.event === "customer_confirmed" ? "Confirmed" : "Denied";
  return { subject: status, text: status };
}

class ProductionReservationNotificationService implements ReservationNotificationService {
  get provider() { return gmailConfig() ? "gmail" as const : null; }
  get configured() { return Boolean(gmailConfig()); }

  async deliver(message: ReservationNotificationMessage): Promise<ReservationNotificationResult> {
    const config = gmailConfig();
    if (!config) {
      const configuration = getReservationEmailConfiguration();
      const reason = configuration.state === "invalid-app-password"
        ? "Gmail requires a 16-character Google App Password; the configured value has the wrong length."
        : configuration.state === "unexpected-user"
          ? `Gmail must use the approved sender account ${restaurantConfig.contact.decisionEmailSender}.`
          : "Gmail is not configured.";
      return { sent: false, reason };
    }

    const recipient = message.customerEmail?.trim();
    if (!recipient) return { sent: false, provider: "gmail", reason: "The recipient email is missing." };
    const content = renderReservationEmail(message);

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: config.user, pass: config.appPassword },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      });
      const result = await transporter.sendMail({
        from: config.from,
        to: recipient,
        subject: content.subject,
        text: content.text,
        headers: message.idempotencyKey ? { "X-Sakura-Notification-ID": message.idempotencyKey.slice(0, 256) } : undefined,
      });
      return { sent: true, provider: "gmail", messageId: result.messageId };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Email delivery failed.";
      console.error("Reservation email delivery failed", { provider: "gmail", event: message.event, reason });
      return { sent: false, provider: "gmail", reason };
    }
  }
}

export const reservationNotificationService: ReservationNotificationService = new ProductionReservationNotificationService();
