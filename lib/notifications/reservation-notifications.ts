import nodemailer from "nodemailer";
import { getCourseById } from "@/data/courses";
import { restaurant } from "@/data/restaurant";
import type { Locale, ReservationStatus } from "@/types";

export type ReservationNotificationEvent =
  | "owner_new_request"
  | "customer_request_received"
  | "customer_confirmed"
  | "customer_rejected"
  | "customer_cancelled";

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
  preferredLanguage?: Locale;
  statusToken?: string;
  idempotencyKey?: string;
};

export type ReservationNotificationResult = {
  sent: boolean;
  provider?: "resend" | "gmail";
  messageId?: string;
  reason?: string;
};

export interface ReservationNotificationService {
  readonly configured: boolean;
  readonly provider: "resend" | "gmail" | null;
  deliver(message: ReservationNotificationMessage): Promise<ReservationNotificationResult>;
}

type EmailContent = { subject: string; html: string; text: string };

type ProviderConfig =
  | { provider: "resend"; apiKey: string; from: string }
  | { provider: "gmail"; user: string; appPassword: string; from: string };

function providerConfig(): ProviderConfig | null {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const configuredFrom = process.env.RESERVATION_EMAIL_FROM?.trim();
  if (resendApiKey && configuredFrom) return { provider: "resend", apiKey: resendApiKey, from: configuredFrom };

  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (gmailUser && gmailAppPassword) {
    return { provider: "gmail", user: gmailUser, appPassword: gmailAppPassword, from: configuredFrom || `Sakura Asian Dining & Bar <${gmailUser}>` };
  }
  return null;
}

function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function absoluteSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return "https://sakura-asian-dining-live.vercel.app";
  try { return new URL(configured).origin; } catch { return "https://sakura-asian-dining-live.vercel.app"; }
}

function emailCopy(event: ReservationNotificationEvent, locale: Locale) {
  const ja = locale === "ja";
  if (event === "customer_confirmed") return {
    badge: ja ? "予約確定" : "CONFIRMED",
    subject: ja ? "【さくら】ご予約が確定しました" : "Your Sakura reservation is confirmed",
    title: ja ? "お席をご用意しました" : "Your table is ready",
    intro: ja ? "店舗スタッフが予約リクエストを承認しました。ご来店を心よりお待ちしております。" : "Sakura staff approved your reservation request. We look forward to welcoming you.",
    accent: "#2e7d5b",
  };
  if (event === "customer_rejected") return {
    badge: ja ? "ご案内不可" : "UNAVAILABLE",
    subject: ja ? "【さくら】予約リクエストについて" : "Update on your Sakura reservation request",
    title: ja ? "今回はご予約を確定できませんでした" : "We couldn’t confirm this request",
    intro: ja ? "誠に申し訳ございませんが、ご希望の日時ではお席をご用意できませんでした。別の日時については店舗までお電話ください。" : "We’re sorry, but the restaurant could not provide a table at the requested time. Please call Sakura if you would like to try another date or time.",
    accent: "#9b3044",
  };
  if (event === "customer_cancelled") return {
    badge: ja ? "キャンセル" : "CANCELLED",
    subject: ja ? "【さくら】ご予約のキャンセル" : "Your Sakura reservation was cancelled",
    title: ja ? "ご予約はキャンセルされました" : "Your reservation was cancelled",
    intro: ja ? "この予約はキャンセル済みです。ご不明な点は店舗までお電話ください。" : "This reservation has been cancelled. Please call the restaurant if you have any questions.",
    accent: "#756c67",
  };
  if (event === "owner_new_request") return {
    badge: "NEW REQUEST",
    subject: `New Sakura reservation · ${event === "owner_new_request" ? "Action needed" : ""}`,
    title: "A new reservation is waiting",
    intro: "Open the protected owner dashboard to confirm or reject this request.",
    accent: "#d7ad5b",
  };
  return {
    badge: ja ? "承認待ち" : "REQUEST RECEIVED",
    subject: ja ? "【さくら】予約リクエストを受け付けました" : "Sakura received your reservation request",
    title: ja ? "リクエストを受け付けました" : "Your request is with Sakura",
    intro: ja ? "現在は承認待ちです。店舗スタッフが確認すると、このメールアドレスへ確定またはご案内不可のお知らせを送信します。" : "Your request is pending. When staff review it, we’ll email this address with the confirmed or unavailable result.",
    accent: "#d7ad5b",
  };
}

export function renderReservationEmail(message: ReservationNotificationMessage): EmailContent {
  const locale = message.preferredLanguage === "ja" ? "ja" : "en";
  const copy = emailCopy(message.event, locale);
  const reservation = message.reservation;
  const course = getCourseById(reservation.courseId);
  const courseName = course ? (locale === "ja" ? course.nameJa : course.nameEn) : (locale === "ja" ? "コース指定なし" : "No course selected");
  const isOwner = message.event === "owner_new_request";
  const statusUrl = message.statusToken
    ? `${absoluteSiteUrl()}/${locale}/reservation/confirmation?reference=${encodeURIComponent(reservation.reservationReference)}&token=${encodeURIComponent(message.statusToken)}`
    : `${absoluteSiteUrl()}/${locale}/reservation/confirmation?reference=${encodeURIComponent(reservation.reservationReference)}`;
  const destination = isOwner ? `${absoluteSiteUrl()}/admin/reservations` : statusUrl;
  const button = isOwner ? "Open owner dashboard" : (locale === "ja" ? "予約状況を確認" : "View live reservation status");
  const labels = locale === "ja"
    ? { reference: "予約受付番号", customer: "お客様", date: "日付", time: "時間", guests: "人数", course: "コース", guestsValue: `${reservation.guestCount}名` }
    : { reference: "Reference", customer: "Guest", date: "Date", time: "Time", guests: "Guests", course: "Course", guestsValue: `${reservation.guestCount}` };

  const rows = [
    [labels.reference, reservation.reservationReference],
    [labels.customer, reservation.customerName],
    [labels.date, reservation.reservationDate],
    [labels.time, reservation.reservationTime],
    [labels.guests, labels.guestsValue],
    [labels.course, courseName],
  ];
  const detailsHtml = rows.map(([label, value]) => `<tr><td style="padding:12px 0;color:#8d7e75;font-size:12px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #eadfce">${escapeHtml(label)}</td><td style="padding:12px 0 12px 18px;color:#211416;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid #eadfce">${escapeHtml(value)}</td></tr>`).join("");
  const textDetails = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const footer = locale === "ja"
    ? `お問い合わせ: ${restaurant.reservationPhone}`
    : `Questions? Call Sakura at ${restaurant.reservationPhone}`;

  return {
    subject: `${copy.subject} · ${reservation.reservationReference}`,
    html: `<!doctype html><html lang="${locale}"><body style="margin:0;background:#f1e7d8;font-family:Arial,'Hiragino Kaku Gothic ProN','Yu Gothic',sans-serif;color:#211416"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1e7d8;padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fffaf3;border:1px solid #dfcda9;box-shadow:0 24px 60px rgba(60,11,21,.14)"><tr><td style="padding:36px 42px;background:radial-gradient(circle at 90% 0,#7d1e30,#300b14 58%,#16090c);color:white;text-align:center"><div style="width:54px;height:54px;line-height:54px;margin:0 auto 20px;border:1px solid #d7ad5b;transform:rotate(45deg);font-family:Georgia,serif;font-size:24px;color:#f0d9a0"><span style="display:inline-block;transform:rotate(-45deg)">桜</span></div><div style="display:inline-block;padding:6px 12px;border:1px solid ${copy.accent};color:#f5dfac;font-size:11px;font-weight:800;letter-spacing:.16em">${escapeHtml(copy.badge)}</div><h1 style="margin:18px 0 10px;font-family:Georgia,'Yu Mincho',serif;font-size:34px;line-height:1.05;font-weight:500">${escapeHtml(copy.title)}</h1><p style="max-width:470px;margin:0 auto;color:#e8d9d4;font-size:14px;line-height:1.7">${escapeHtml(copy.intro)}</p></td></tr><tr><td style="padding:34px 42px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${detailsHtml}</table><div style="padding:30px 0 6px;text-align:center"><a href="${escapeHtml(destination)}" style="display:inline-block;padding:15px 24px;background:#d7ad5b;color:#1a1007;text-decoration:none;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase">${escapeHtml(button)}</a></div><p style="margin:24px 0 0;color:#756c67;font-size:12px;line-height:1.65;text-align:center">${escapeHtml(footer)}</p></td></tr><tr><td style="padding:18px 24px;background:#1b0b0e;color:#bba7a0;text-align:center;font-size:10px;letter-spacing:.08em">SAKURA ASIAN DINING &amp; BAR · TAKADANOBABA</td></tr></table></td></tr></table></body></html>`,
    text: `${copy.title}\n\n${copy.intro}\n\n${textDetails}\n\n${button}: ${destination}\n\n${footer}`,
  };
}

class ProductionReservationNotificationService implements ReservationNotificationService {
  get provider() { return providerConfig()?.provider ?? null; }
  get configured() { return Boolean(providerConfig()); }

  async deliver(message: ReservationNotificationMessage): Promise<ReservationNotificationResult> {
    const config = providerConfig();
    if (!config) return { sent: false, reason: "No email provider is configured." };

    const recipient = message.event === "owner_new_request" ? process.env.RESERVATION_OWNER_EMAIL?.trim() : message.customerEmail?.trim();
    if (!recipient) return { sent: false, provider: config.provider, reason: "The recipient email is missing." };
    const content = renderReservationEmail(message);

    try {
      if (config.provider === "resend") {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            authorization: `Bearer ${config.apiKey}`,
            "content-type": "application/json",
            ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey.slice(0, 256) } : {}),
          },
          body: JSON.stringify({
            from: config.from,
            to: [recipient],
            reply_to: process.env.RESERVATION_REPLY_TO?.trim() || undefined,
            subject: content.subject,
            html: content.html,
            text: content.text,
            tags: [{ name: "reservation_event", value: message.event }],
          }),
        });
        const payload = await response.json().catch(() => ({})) as { id?: string; message?: string };
        if (!response.ok) return { sent: false, provider: "resend", reason: payload.message || `Email provider returned ${response.status}.` };
        return { sent: true, provider: "resend", messageId: payload.id };
      }

      const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: config.user, pass: config.appPassword } });
      const result = await transporter.sendMail({
        from: config.from,
        to: recipient,
        replyTo: process.env.RESERVATION_REPLY_TO?.trim() || config.user,
        subject: content.subject,
        html: content.html,
        text: content.text,
        headers: message.idempotencyKey ? { "X-Sakura-Notification-ID": message.idempotencyKey.slice(0, 256) } : undefined,
      });
      return { sent: true, provider: "gmail", messageId: result.messageId };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Email delivery failed.";
      console.error("Reservation email delivery failed", { provider: config.provider, event: message.event, reason });
      return { sent: false, provider: config.provider, reason };
    }
  }
}

export const reservationNotificationService: ReservationNotificationService = new ProductionReservationNotificationService();
