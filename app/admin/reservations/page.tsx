import { AlertTriangle, CalendarCheck2, CheckCircle2, Info, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { login, logout } from "@/app/admin/actions";
import { OwnerReservationsDashboard } from "@/components/owner-reservations-dashboard";
import { getReservationEmailConfiguration, reservationNotificationService } from "@/lib/notifications/reservation-notifications";
import { getTokyoNow } from "@/lib/reservation-request";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OwnerReservation } from "@/types";

export const dynamic = "force-dynamic";

export default async function OwnerReservationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  if (!isSupabaseConfigured()) return <AdminFrame><div className="admin-auth-card"><ShieldAlert /><p className="eyebrow">Reservation setup</p><h1>Supabase is not configured</h1><p>Add the Supabase variables and apply migrations 001 and 002 to activate reservation requests.</p><Link className="button button-gold" href="/admin">Return to owner dashboard</Link></div></AdminFrame>;

  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return <AdminFrame><form action={login} className="admin-auth-card"><ShieldCheck /><p className="eyebrow">Owner sign in</p><h1>Sakura reservations</h1>{typeof query.error === "string" ? <p className="form-error" role="alert">{query.error}</p> : null}<input type="hidden" name="next" value="/admin/reservations" /><label>Email<input type="email" name="email" autoComplete="email" required /></label><label>Password<input type="password" name="password" autoComplete="current-password" required /></label><button className="button button-gold">Sign in</button><Link href="/en" className="text-link">Return to restaurant</Link></form></AdminFrame>;

  const { data: allowed } = await client.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!allowed) return <AdminFrame><div className="admin-auth-card"><ShieldAlert /><p className="eyebrow">Access denied</p><h1>Not on the owner allowlist</h1><p>{user.email} cannot access reservation records.</p><form action={logout}><button className="button button-outline">Sign out</button></form></div></AdminFrame>;

  const { data, error } = await client.from("reservations").select("id,reservation_reference,course_id,customer_name,customer_email,customer_phone,reservation_date,reservation_time,guest_count,seating_preference,occasion,allergies,special_requests,preferred_language,status,owner_notes,created_at,updated_at,confirmed_at,cancelled_at").order("reservation_date", { ascending: true }).order("reservation_time", { ascending: true });
  if (error) return <AdminFrame><div className="admin-auth-card"><CalendarCheck2 /><p className="eyebrow">Reservation database</p><h1>Reservations are not ready</h1><p>{error.message}</p><p>Apply all files in <code>supabase/migrations</code>, then reload this page.</p><Link className="button button-outline" href="/admin">Content studio</Link></div></AdminFrame>;

  const reservationIds = (data ?? []).map((reservation) => reservation.id);
  const { data: deliveries } = reservationIds.length ? await client.from("reservation_notification_outbox").select("reservation_id,event_type,delivery_status,last_error,sent_at,created_at").in("reservation_id", reservationIds).in("event_type", ["customer_confirmed", "customer_rejected"]).order("created_at", { ascending: false }) : { data: [] };
  const latestDelivery = new Map<string, NonNullable<typeof deliveries>[number]>();
  for (const delivery of deliveries ?? []) if (!latestDelivery.has(delivery.reservation_id)) latestDelivery.set(delivery.reservation_id, delivery);
  const reservations = (data ?? []).map((reservation) => ({ ...reservation, notification_delivery: latestDelivery.get(reservation.id) ?? null })) as OwnerReservation[];
  const emailState = typeof query.email === "string" ? query.email : "";
  const emailConfiguration = getReservationEmailConfiguration();
  return <AdminFrame><EmailDeliveryFeedback state={emailState} /><OwnerReservationsDashboard reservations={reservations} today={getTokyoNow().date} liveAlerts pushPublicKey={process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? ""} emailConfigured={reservationNotificationService.configured} emailConfigurationState={emailConfiguration.state} /></AdminFrame>;
}

function EmailDeliveryFeedback({ state }: { state: string }) {
  if (!state) return null;
  if (state === "sent") return <div className="admin-email-feedback is-success" role="status"><CheckCircle2 /><div><strong>Status saved and customer email sent</strong><span>The guest received one decision email.</span></div></div>;
  if (state === "already-sent") return <div className="admin-email-feedback is-success" role="status"><CheckCircle2 /><div><strong>Status saved</strong><span>This request already received its decision email, so no duplicate was sent.</span></div></div>;
  if (state === "not-configured") return <div className="admin-email-feedback is-warning" role="alert"><AlertTriangle /><div><strong>Status saved, but no email was sent</strong><span>Add a valid 16-character Google App Password in Vercel, redeploy, then retry this reservation.</span></div></div>;
  if (state === "failed") return <div className="admin-email-feedback is-error" role="alert"><AlertTriangle /><div><strong>Status saved, but email delivery failed</strong><span>Check the Gmail credentials and deployment logs.</span></div></div>;
  return <div className="admin-email-feedback" role="status"><Info /><div><strong>Reservation status saved</strong><span>This status does not send a customer email.</span></div></div>;
}

function AdminFrame({ children }: { children: React.ReactNode }) {
  return <main className="admin-page">{children}</main>;
}
