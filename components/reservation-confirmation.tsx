"use client";

import { Ban, CalendarPlus, CheckCircle2, Clock3, MapPinned, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getCourseById } from "@/data/courses";
import { restaurantConfig } from "@/data/restaurant";
import { parseReservationConfirmation, parseReservationStatusSnapshot } from "@/lib/reservation-request";
import type { Dictionary } from "@/locales";
import type { Locale, ReservationConfirmation as Confirmation, ReservationStatus, ReservationStatusSnapshot } from "@/types";

export function ReservationConfirmation({ locale, dictionary, reference, statusToken = "" }: { locale: Locale; dictionary: Dictionary; reference: string; statusToken?: string }) {
  const [activeReference, setActiveReference] = useState(reference);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [snapshot, setSnapshot] = useState<ReservationStatusSnapshot | null>(null);
  const [token, setToken] = useState(statusToken);
  const [loaded, setLoaded] = useState(false);
  const [checking, setChecking] = useState(false);
  const [statusError, setStatusError] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      let resolvedReference = reference;
      let resolvedToken = statusToken;
      if (reference === "—" || !statusToken) {
        try {
          const latest = JSON.parse(sessionStorage.getItem("sakura-reservation:last") ?? "null") as { reference?: unknown; token?: unknown } | null;
          if (reference === "—" && typeof latest?.reference === "string" && /^SKR-\d{8}-[A-Z0-9]{6}$/.test(latest.reference)) resolvedReference = latest.reference;
          if (!statusToken && typeof latest?.token === "string" && /^[0-9a-f-]{36}$/i.test(latest.token)) resolvedToken = latest.token;
        } catch { /* Ignore malformed browser session data. */ }
      }
      setActiveReference(resolvedReference);
      const storedConfirmation = sessionStorage.getItem(`sakura-reservation:${resolvedReference}`);
      if (storedConfirmation) {
        try { setConfirmation(parseReservationConfirmation(JSON.parse(storedConfirmation))); } catch { setConfirmation(null); }
      }
      const storedToken = sessionStorage.getItem(`sakura-reservation-token:${resolvedReference}`) ?? "";
      setToken(resolvedToken || storedToken);
      setLoaded(true);
    });
    return () => { active = false; };
  }, [reference, statusToken]);

  const checkStatus = useCallback(async () => {
    if (!token || activeReference === "—") return;
    setChecking(true);
    try {
      const response = await fetch(`/api/reservations/status?reference=${encodeURIComponent(activeReference)}&token=${encodeURIComponent(token)}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null) as { reservation?: unknown } | null;
      const next = response.ok ? parseReservationStatusSnapshot(payload?.reservation) : null;
      if (!next) {
        setStatusError(true);
        return;
      }
      setSnapshot(next);
      setStatusError(false);
    } catch {
      setStatusError(true);
    } finally {
      setChecking(false);
    }
  }, [activeReference, token]);

  useEffect(() => {
    if (!token) return;
    const initialCheck = window.setTimeout(() => void checkStatus(), 0);
    if (snapshot?.status && snapshot.status !== "pending") return;
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") void checkStatus(); }, 5000);
    const onVisibility = () => { if (document.visibilityState === "visible") void checkStatus(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(initialCheck);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [checkStatus, snapshot?.status, token]);

  const details = snapshot ?? confirmation;
  const status: ReservationStatus = snapshot?.status ?? confirmation?.status ?? "pending";
  const selectedCourse = getCourseById(details?.courseId);
  const statusCopy = getStatusCopy(status, dictionary);
  const StatusIcon = status === "confirmed" || status === "completed" ? CheckCircle2 : status === "pending" ? Clock3 : status === "cancelled" ? Ban : XCircle;
  const stepResult = status === "confirmed" || status === "completed" ? dictionary.reservation.confirmed : status === "pending" ? dictionary.reservation.awaitingDecision : statusCopy.label;
  const lastUpdated = snapshot?.updatedAt ? new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: restaurantConfig.timeZone }).format(new Date(snapshot.updatedAt)) : "";
  const calendarHref = details ? `data:text/calendar;charset=utf-8,${encodeURIComponent(["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${restaurantConfig.identity.nameEn}//Reservation//EN`, "BEGIN:VEVENT", `UID:${activeReference}@${restaurantConfig.canonicalHost}`, `DTSTART;TZID=${restaurantConfig.timeZone}:${details.reservationDate.replaceAll("-", "")}T${details.reservationTime.replace(":", "")}00`, "DURATION:PT2H", `SUMMARY:${status === "confirmed" ? "Sakura reservation" : "Sakura reservation request (pending)"}`, `LOCATION:${restaurantConfig.identity.nameEn}, ${restaurantConfig.location.addressEn}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n"))}` : "";

  return (
    <div className={`reservation-confirmation-card is-${status}`} aria-live="polite">
      <div className={`reservation-decision-banner is-${status}`} role="status"><StatusIcon aria-hidden="true" /><span>{status === "pending" ? dictionary.reservation.onHold : statusCopy.label}</span><strong>{statusCopy.title}</strong></div>
      <div className="reservation-status-theatre">
        {status === "confirmed" ? <div className="reservation-success-burst" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <span key={index} />)}</div> : null}
        <div className="reservation-status-icon"><StatusIcon aria-hidden="true" /></div>
        <p className="eyebrow">Sakura · {statusCopy.label}</p>
        <h2>{statusCopy.title}</h2>
        <p>{statusCopy.message}</p>
      </div>

      <div className={`reservation-live-tracker ${token ? "is-connected" : "is-static"}`}>
        <span className="reservation-live-dot" aria-hidden="true" />
        <div><strong>{token ? dictionary.reservation.liveTracking : dictionary.reservation.statusUnavailable}</strong><small>{lastUpdated ? `${dictionary.reservation.lastUpdated} ${lastUpdated}` : dictionary.reservation.liveTrackingBody}</small></div>
        {token ? <button type="button" onClick={() => void checkStatus()} disabled={checking}><RefreshCw className={checking ? "is-spinning" : ""} />{checking ? dictionary.reservation.checkingStatus : dictionary.reservation.checkNow}</button> : null}
      </div>

      <ol className="reservation-status-timeline" aria-label={dictionary.reservation.statusJourney}>
        <li className="is-complete"><span>1</span><strong>{dictionary.reservation.requestReceived}</strong></li>
        <li className={status !== "pending" ? "is-complete" : "is-current"}><span>2</span><strong>{dictionary.reservation.staffReview}</strong></li>
        <li className={status !== "pending" ? `is-current is-${status}` : ""}><span>3</span><strong>{stepResult}</strong></li>
      </ol>

      <dl>
        <div><dt>{dictionary.reservation.reference}</dt><dd>{activeReference}</dd></div>
        {details ? <><div><dt>{dictionary.reservation.course}</dt><dd>{selectedCourse ? (locale === "ja" ? selectedCourse.nameJa : selectedCourse.nameEn) : dictionary.reservation.noCourse}</dd></div><div><dt>{dictionary.reservation.customer}</dt><dd>{details.customerName}</dd></div><div><dt>{dictionary.reservation.date}</dt><dd>{details.reservationDate}</dd></div><div><dt>{dictionary.reservation.time}</dt><dd>{details.reservationTime}</dd></div><div><dt>{dictionary.reservation.guests}</dt><dd>{details.guestCount}</dd></div></> : null}
        <div><dt>{dictionary.reservation.status}</dt><dd><span className={`reservation-status-result is-${status}`}>{statusCopy.label}</span></dd></div>
      </dl>

      {statusError ? <p className="form-error">{dictionary.reservation.statusCheckFailed}</p> : null}
      {loaded && !details ? <p className="form-error">{dictionary.reservation.confirmationUnavailable}</p> : null}
      <div className="reservation-confirmation-actions">
        <Link className="button button-gold" href={`/${locale}/access`}><MapPinned aria-hidden="true" />{locale === "ja" ? "道順を見る" : "Directions"}</Link>
        {calendarHref ? <a className="button button-outline" href={calendarHref} download={`sakura-${activeReference}.ics`}><CalendarPlus aria-hidden="true" />{locale === "ja" ? "カレンダーに追加" : "Add to calendar"}</a> : null}
        <Link className="text-link" href={`/${locale}`}>{dictionary.reservation.returnHome}</Link>
      </div>
    </div>
  );
}

function getStatusCopy(status: ReservationStatus, dictionary: Dictionary) {
  if (status === "confirmed") return { label: dictionary.reservation.confirmed, title: dictionary.reservation.confirmedTitle, message: dictionary.reservation.confirmedMessage };
  if (status === "rejected") return { label: dictionary.reservation.rejected, title: dictionary.reservation.rejectedTitle, message: dictionary.reservation.rejectedMessage };
  if (status === "cancelled") return { label: dictionary.reservation.cancelled, title: dictionary.reservation.cancelledTitle, message: dictionary.reservation.cancelledMessage };
  if (status === "completed") return { label: dictionary.reservation.completed, title: dictionary.reservation.completedTitle, message: dictionary.reservation.completedMessage };
  if (status === "no_show") return { label: dictionary.reservation.noShow, title: dictionary.reservation.noShowTitle, message: dictionary.reservation.noShowMessage };
  return { label: dictionary.reservation.pending, title: dictionary.reservation.confirmationTitle, message: dictionary.reservation.pendingMessage };
}
