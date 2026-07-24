"use client";

import { CalendarCheck2, Clock3, LogOut, Mail, MailCheck, MailWarning, Phone, Printer, RotateCw, Search, StickyNote, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { logout } from "@/app/admin/actions";
import { retryReservationStatusEmail, updateReservationDetails, updateReservationStatus } from "@/app/admin/reservations/actions";
import { getCourseById } from "@/data/courses";
import { MAX_RESERVATION_GUESTS, MIN_RESERVATION_GUESTS, RESERVATION_TIME_SLOTS } from "@/lib/reservation-request";
import { ReservationLiveAlerts } from "@/components/reservation-live-alerts";
import type { ReservationEmailConfigurationState } from "@/lib/notifications/reservation-notifications";
import type { OwnerReservation, ReservationStatus } from "@/types";

const statusLabels: Record<ReservationStatus, string> = { pending: "Pending", confirmed: "Confirmed", rejected: "Rejected", cancelled: "Cancelled", completed: "Completed", no_show: "No-show" };
const actionStatuses: ReservationStatus[] = ["confirmed", "rejected", "cancelled", "completed", "no_show"];

export function OwnerReservationsDashboard({ reservations, today, liveAlerts = false, pushPublicKey = "", emailConfigured = false, emailConfigurationState = "missing-user" }: { reservations: OwnerReservation[]; today: string; liveAlerts?: boolean; pushPublicKey?: string; emailConfigured?: boolean; emailConfigurationState?: ReservationEmailConfigurationState }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ReservationStatus>("all");
  const [view, setView] = useState<"all" | "today" | "upcoming" | "calendar">("all");
  const [date, setDate] = useState("");
  const pendingCount = reservations.filter((reservation) => reservation.status === "pending").length;
  const latestCreatedAt = reservations.reduce((latest, reservation) => reservation.created_at > latest ? reservation.created_at : latest, "");
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return reservations.filter((reservation) => {
      const course = getCourseById(reservation.course_id);
      const searchable = `${reservation.reservation_reference} ${reservation.customer_name} ${reservation.customer_email} ${reservation.customer_phone} ${reservation.course_id ?? ""} ${course?.nameEn ?? ""} ${course?.nameJa ?? ""}`.toLocaleLowerCase();
      return (!query || searchable.includes(query))
        && (status === "all" || reservation.status === status)
        && (!date || reservation.reservation_date === date)
        && (view === "all" || view === "calendar" || (view === "today" ? reservation.reservation_date === today : reservation.reservation_date > today));
    });
  }, [date, reservations, search, status, today, view]);
  const calendarDays = useMemo(() => {
    return Array.from({ length: 14 }, (_, offset) => {
      const next = new Date(`${today}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + offset);
      const value = next.toISOString().slice(0, 10);
      const dayReservations = reservations.filter((reservation) => reservation.reservation_date === value && reservation.status !== "cancelled" && reservation.status !== "rejected");
      return { value, reservations: dayReservations, guests: dayReservations.reduce((sum, reservation) => sum + reservation.guest_count, 0), pending: dayReservations.filter((reservation) => reservation.status === "pending").length };
    });
  }, [reservations, today]);

  const printToday = () => {
    setDate("");
    setStatus("all");
    setView("today");
    window.setTimeout(() => window.print(), 80);
  };

  return (
    <div className="admin-dashboard reservations-dashboard">
      <header className="admin-header"><div><p className="eyebrow">Protected owner area</p><h1>Reservations</h1><p className="admin-reservation-summary">{pendingCount} pending · {reservations.length} total</p><div className={`admin-email-health ${emailConfigured ? "is-ready" : "is-offline"}`}>{emailConfigured ? <MailCheck /> : <MailWarning />}<span><strong>{emailConfigured ? "Customer email active" : "Customer email needs setup"}</strong><small>{emailConfigured ? "The first confirmed or denied decision emails the guest once." : emailConfigurationState === "unexpected-user" ? "The Vercel Gmail user does not match Sakura’s approved sender account." : emailConfigurationState === "invalid-app-password" ? "The Vercel password is not a 16-character Google App Password." : "Add the Gmail user and 16-character Google App Password in Vercel."}</small></span></div></div><div className="admin-header-actions">{liveAlerts ? <ReservationLiveAlerts pushPublicKey={pushPublicKey} initialLatestCreatedAt={latestCreatedAt} /> : null}<Link className="button button-outline" href="/admin">Content studio</Link><form action={logout}><button className="button button-outline"><LogOut />Sign out</button></form></div></header>
      <section className="reservation-admin-tools" aria-label="Reservation filters">
        <label className="reservation-admin-search"><Search /><span className="sr-only">Search reservations</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, phone, email or reference" /></label>
        <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <input aria-label="Filter by date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <div className="reservation-view-tabs">{(["all", "today", "upcoming", "calendar"] as const).map((item) => <button type="button" key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item}</button>)}</div>
        <button className="button button-outline reservation-print-button" type="button" onClick={printToday}><Printer />Print today</button>
      </section>
      {view === "calendar" ? <section className="reservation-calendar" aria-label="Two-week reservation calendar">{calendarDays.map((day) => <button type="button" key={day.value} className={day.value === today ? "is-today" : ""} onClick={() => { setDate(day.value); setView("all"); }}><time dateTime={day.value}>{new Intl.DateTimeFormat("en-GB", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${day.value}T00:00:00Z`))}</time><strong>{day.reservations.length}</strong><span>{day.reservations.length === 1 ? "reservation" : "reservations"} · {day.guests} guests</span>{day.pending ? <small>{day.pending} pending</small> : <small>All reviewed</small>}</button>)}</section> : null}
      <section className="owner-reservation-list" aria-live="polite">
        {view !== "calendar" ? (filtered.length ? filtered.map((reservation) => <OwnerReservationCard key={reservation.id} reservation={reservation} today={today} />) : <div className="admin-panel"><h2>No matching reservations</h2><p>Adjust the search or filters.</p></div>) : null}
      </section>
    </div>
  );
}

function OwnerReservationCard({ reservation, today }: { reservation: OwnerReservation; today: string }) {
  const time = reservation.reservation_time.slice(0, 5);
  const course = getCourseById(reservation.course_id);
  return (
    <article className={`owner-reservation-card status-${reservation.status}`} id={`reservation-${reservation.id}`}>
      <div className="owner-reservation-heading"><div><span className={`reservation-status-badge status-${reservation.status}`}>{statusLabels[reservation.status]}</span><p>{reservation.reservation_reference}</p><h2>{reservation.customer_name}</h2></div><div className="owner-reservation-when"><strong>{reservation.reservation_date === today ? "Today" : reservation.reservation_date}</strong><span>{time} · {reservation.guest_count} guests</span></div></div>
      <div className="owner-reservation-contact"><a href={`tel:${reservation.customer_phone}`}><Phone />{reservation.customer_phone}</a><a href={`mailto:${reservation.customer_email}`}><Mail />{reservation.customer_email}</a></div>
      {reservation.notification_delivery ? <div className={`owner-email-delivery is-${reservation.notification_delivery.delivery_status}`}>{reservation.notification_delivery.delivery_status === "sent" ? <MailCheck /> : <MailWarning />}<div><strong>{reservation.notification_delivery.delivery_status === "sent" ? "Customer email delivered" : `Customer email ${reservation.notification_delivery.delivery_status}`}</strong><span>{reservation.notification_delivery.sent_at ? `Sent ${new Date(reservation.notification_delivery.sent_at).toLocaleString()}` : reservation.notification_delivery.last_error || "Delivery is still being processed."}</span></div></div> : null}
      <details>
        <summary>Open reservation details</summary>
        <div className="owner-reservation-details">
          <dl><div><dt>Course</dt><dd>{course?.nameEn ?? "No course selected"}</dd></div><div><dt><CalendarCheck2 />Date</dt><dd>{reservation.reservation_date}</dd></div><div><dt><Clock3 />Time</dt><dd>{time}</dd></div><div><dt><Users />Guests</dt><dd>{reservation.guest_count}</dd></div><div><dt>Seating</dt><dd>{reservation.seating_preference.replace("_", " ")}</dd></div><div><dt>Occasion</dt><dd>{reservation.occasion}</dd></div><div><dt>Preferred language</dt><dd>{reservation.preferred_language.toUpperCase()}</dd></div><div><dt>Allergies / dietary</dt><dd>{reservation.allergies || "None provided"}</dd></div><div><dt>Special requests</dt><dd>{reservation.special_requests || "None provided"}</dd></div></dl>
          <form className="owner-reservation-edit" action={updateReservationDetails}><input type="hidden" name="id" value={reservation.id} /><label>Date<input type="date" name="reservationDate" min={today} defaultValue={reservation.reservation_date} required /></label><label>Time<select name="reservationTime" defaultValue={time}>{RESERVATION_TIME_SLOTS.map((slot) => <option key={slot}>{slot}</option>)}</select></label><label>Guests<select name="guestCount" defaultValue={reservation.guest_count}>{Array.from({ length: MAX_RESERVATION_GUESTS - MIN_RESERVATION_GUESTS + 1 }, (_, index) => index + MIN_RESERVATION_GUESTS).map((count) => <option key={count}>{count}</option>)}</select></label><label className="owner-notes"><StickyNote />Private owner notes<textarea name="ownerNotes" maxLength={4000} defaultValue={reservation.owner_notes ?? ""} /></label><button className="button button-outline">Save details</button></form>
          <div className="owner-status-actions">{actionStatuses.filter((nextStatus) => nextStatus !== reservation.status).map((nextStatus) => <form action={updateReservationStatus} key={nextStatus}><input type="hidden" name="id" value={reservation.id} /><input type="hidden" name="status" value={nextStatus} /><button className={nextStatus === "confirmed" ? "button button-gold" : "button button-outline"}>{statusLabels[nextStatus]}</button></form>)}</div>
          {canRetryDecisionEmail(reservation) ? <form className="owner-resend-email" action={retryReservationStatusEmail}><input type="hidden" name="id" value={reservation.id} /><button className="button button-outline"><RotateCw />Retry customer email</button></form> : null}
          <p className="owner-reservation-audit">Created {new Date(reservation.created_at).toLocaleString()} · Updated {new Date(reservation.updated_at).toLocaleString()}</p>
        </div>
      </details>
    </article>
  );
}

function canRetryDecisionEmail(reservation: OwnerReservation) {
  if (reservation.status !== "confirmed" && reservation.status !== "rejected") return false;
  return reservation.notification_delivery?.delivery_status !== "sent";
}
