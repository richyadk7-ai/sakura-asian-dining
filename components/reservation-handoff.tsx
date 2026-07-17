"use client";

import { CalendarDays, Clock3, ExternalLink as ExternalIcon, ShieldCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { ExternalLink } from "@/components/external-link";
import { restaurant } from "@/data/restaurant";
import { TABELOG_AVAILABILITY_URL } from "@/lib/constants";
import { buildTabelogReservationUrl, getTokyoDate } from "@/lib/reservation";
import type { Dictionary } from "@/locales";
import type { RestaurantInfo } from "@/types";

const times = ["11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];

export function ReservationHandoff({ dictionary, restaurantInfo = restaurant }: { dictionary: Dictionary; restaurantInfo?: RestaurantInfo }) {
  const minimumDate = useMemo(() => getTokyoDate(0), []);
  const [date, setDate] = useState(() => getTokyoDate(1));
  const [time, setTime] = useState("19:00");
  const [guests, setGuests] = useState(2);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (date < minimumDate) {
      setError(dictionary.reservation.invalidDate);
      return;
    }
    setError("");
    setOpening(true);
    const url = buildTabelogReservationUrl({ date, time, guests });
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => setOpening(false), 900);
  };

  return (
    <div className="reservation-panel" id="book">
      <div className="reservation-intro">
        <p className="eyebrow"><ShieldCheck aria-hidden="true" /> Official Tabelog handoff</p>
        <h2>{dictionary.reservation.title}</h2>
        <p>{dictionary.reservation.intro}</p>
        <p className="reservation-notice">{dictionary.reservation.notice}</p>
      </div>
      <form onSubmit={submit} className="reservation-form">
        <label><span><CalendarDays />{dictionary.reservation.date}</span><input type="date" min={minimumDate} value={date} onChange={(event) => setDate(event.target.value)} required /></label>
        <label><span><Clock3 />{dictionary.reservation.time}</span><select value={time} onChange={(event) => setTime(event.target.value)}>{times.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span><Users />{dictionary.reservation.guests}</span><select value={guests} onChange={(event) => setGuests(Number(event.target.value))}>{Array.from({ length: 40 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count}</option>)}</select></label>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="button button-gold" type="submit" aria-describedby="handoff-note">{opening ? dictionary.reservation.opening : dictionary.reservation.continue}<ExternalIcon aria-hidden="true" /></button>
        <p id="handoff-note">{dictionary.common.external}</p>
      </form>
      <div className="reservation-fallbacks">
        <ExternalLink className="text-link" href={TABELOG_AVAILABILITY_URL} showIcon>{dictionary.reservation.fallback}</ExternalLink>
        <a className="text-link" href={`tel:${restaurantInfo.reservationPhone}`}>{dictionary.reservation.phoneFallback} {restaurantInfo.reservationPhone}</a>
      </div>
    </div>
  );
}
