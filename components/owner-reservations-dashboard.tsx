"use client";

import { CalendarCheck2, Clock3, LogOut, Mail, Phone, Search, StickyNote, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { logout } from "@/app/admin/actions";
import { updateReservationDetails, updateReservationStatus } from "@/app/admin/reservations/actions";
import { getCourseById } from "@/data/courses";
import { MAX_RESERVATION_GUESTS, MIN_RESERVATION_GUESTS, RESERVATION_TIME_SLOTS } from "@/lib/reservation-request";
import { ReservationLiveAlerts } from "@/components/reservation-live-alerts";
import type { OwnerReservation, ReservationStatus } from "@/types";

const statusLabels: Record<ReservationStatus, string> = { pending: "Pending", confirmed: "Confirmed", rejected: "Rejected", cancelled: "Cancelled", completed: "Completed", no_show: "No-show" };
const actionStatuses: ReservationStatus[] = ["confirmed", "rejected", "cancelled", "completed", "no_show"];

export function OwnerReservationsDashboard({ reservations, today, liveAlerts = false, pushPublicKey = "" }: { reservations: OwnerReservation[]; today: string; liveAlerts?: boolean; pushPublicKey?: string }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ReservationStatus>("all");
  const [view, setView] = useState<"all" | "today" | "upcoming">("all");
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
        && (view === "all" || (view === "today" ? reservation.reservation_date === today : reservation.reservation_date > today));
    });
  }, [date, reservations, search, status, today, view]);

  return (
    <div className="admin-dashboard reservations-dashboard">
      <header className="admin-header"><div><p className="eyebrow">Protected owner area</p><h1>Reservations</h1><p className="admin-reservation-summary">{pendingCount} pending · {reservations.length} total</p></div><div className="admin-header-actions">{liveAlerts ? <ReservationLiveAlerts pushPublicKey={pushPublicKey} initialLatestCreatedAt={latestCreatedAt} /> : null}<Link className="button button-outline" href="/admin">Content studio</Link><form action={logout}><button className="button button-outline"><LogOut />Sign out</button></form></div></header>
      <section className="reservation-admin-tools" aria-label="Reservation filters">
        <label className="reservation-admin-search"><Search /><span className="sr-only">Search reservations</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, phone, email or reference" /></label>
        <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <input aria-label="Filter by date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <div className="reservation-view-tabs">{(["all", "today", "upcoming"] as const).map((item) => <button type="button" key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item}</button>)}</div>
      </section>
      <section className="owner-reservation-list" aria-live="polite">
        {filtered.length ? filtered.map((reservation) => <OwnerReservationCard key={reservation.id} reservation={reservation} today={today} />) : <div className="admin-panel"><h2>No matching reservations</h2><p>Adjust the search or filters.</p></div>}
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
      <details>
        <summary>Open reservation details</summary>
        <div className="owner-reservation-details">
          <dl><div><dt>Course</dt><dd>{course?.nameEn ?? "No course selected"}</dd></div><div><dt><CalendarCheck2 />Date</dt><dd>{reservation.reservation_date}</dd></div><div><dt><Clock3 />Time</dt><dd>{time}</dd></div><div><dt><Users />Guests</dt><dd>{reservation.guest_count}</dd></div><div><dt>Seating</dt><dd>{reservation.seating_preference.replace("_", " ")}</dd></div><div><dt>Occasion</dt><dd>{reservation.occasion}</dd></div><div><dt>Preferred language</dt><dd>{reservation.preferred_language.toUpperCase()}</dd></div><div><dt>Allergies / dietary</dt><dd>{reservation.allergies || "None provided"}</dd></div><div><dt>Special requests</dt><dd>{reservation.special_requests || "None provided"}</dd></div></dl>
          <form className="owner-reservation-edit" action={updateReservationDetails}><input type="hidden" name="id" value={reservation.id} /><label>Date<input type="date" name="reservationDate" min={today} defaultValue={reservation.reservation_date} required /></label><label>Time<select name="reservationTime" defaultValue={time}>{RESERVATION_TIME_SLOTS.map((slot) => <option key={slot}>{slot}</option>)}</select></label><label>Guests<select name="guestCount" defaultValue={reservation.guest_count}>{Array.from({ length: MAX_RESERVATION_GUESTS - MIN_RESERVATION_GUESTS + 1 }, (_, index) => index + MIN_RESERVATION_GUESTS).map((count) => <option key={count}>{count}</option>)}</select></label><label className="owner-notes"><StickyNote />Private owner notes<textarea name="ownerNotes" maxLength={4000} defaultValue={reservation.owner_notes ?? ""} /></label><button className="button button-outline">Save details</button></form>
          <div className="owner-status-actions">{actionStatuses.filter((nextStatus) => nextStatus !== reservation.status).map((nextStatus) => <form action={updateReservationStatus} key={nextStatus}><input type="hidden" name="id" value={reservation.id} /><input type="hidden" name="status" value={nextStatus} /><button className={nextStatus === "confirmed" ? "button button-gold" : "button button-outline"}>{statusLabels[nextStatus]}</button></form>)}</div>
          <p className="owner-reservation-audit">Created {new Date(reservation.created_at).toLocaleString()} · Updated {new Date(reservation.updated_at).toLocaleString()}</p>
        </div>
      </details>
    </article>
  );
}
