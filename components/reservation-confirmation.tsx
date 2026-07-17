"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { parseReservationConfirmation } from "@/lib/reservation-request";
import type { Dictionary } from "@/locales";
import type { Locale, ReservationConfirmation as Confirmation } from "@/types";

const subscribeToSessionStorage = () => () => undefined;

export function ReservationConfirmation({ locale, dictionary, reference }: { locale: Locale; dictionary: Dictionary; reference: string }) {
  const stored = useSyncExternalStore(subscribeToSessionStorage, () => sessionStorage.getItem(`sakura-reservation:${reference}`) ?? "__missing__", () => "__server__");
  const confirmation = useMemo<Confirmation | null>(() => {
    if (stored === "__missing__" || stored === "__server__") return null;
    try { return parseReservationConfirmation(JSON.parse(stored)); } catch { return null; }
  }, [stored]);
  const loaded = stored !== "__server__";

  return (
    <div className="reservation-confirmation-card">
      <CheckCircle2 aria-hidden="true" />
      <p className="eyebrow">Sakura · {dictionary.reservation.pending}</p>
      <h2>{dictionary.reservation.confirmationTitle}</h2>
      <p>{dictionary.reservation.confirmationIntro}</p>
      <dl>
        <div><dt>{dictionary.reservation.reference}</dt><dd>{reference}</dd></div>
        {confirmation ? <><div><dt>{dictionary.reservation.customer}</dt><dd>{confirmation.customerName}</dd></div><div><dt>{dictionary.reservation.date}</dt><dd>{confirmation.reservationDate}</dd></div><div><dt>{dictionary.reservation.time}</dt><dd>{confirmation.reservationTime}</dd></div><div><dt>{dictionary.reservation.guests}</dt><dd>{confirmation.guestCount}</dd></div></> : null}
        <div><dt>{dictionary.reservation.status}</dt><dd><span className="reservation-pending-status">{dictionary.reservation.pending}</span></dd></div>
      </dl>
      <p className="reservation-notice">{dictionary.reservation.pendingMessage}</p>
      {loaded && !confirmation ? <p className="form-error">{dictionary.reservation.confirmationUnavailable}</p> : null}
      <Link className="button button-gold" href={`/${locale}`}>{dictionary.reservation.returnHome}</Link>
    </div>
  );
}
