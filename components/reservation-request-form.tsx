"use client";

import { CalendarDays, CheckCircle2, Clock3, Mail, Phone, ShieldCheck, UserRound, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { courses } from "@/data/courses";
import { restaurant } from "@/data/restaurant";
import { getRequestableTimes, getTokyoNow, MAX_RESERVATION_GUESTS, MIN_RESERVATION_GUESTS, parseReservationConfirmation, reservationIssueField, reservationRequestSchema } from "@/lib/reservation-request";
import { localizePath } from "@/lib/locale";
import type { Dictionary } from "@/locales";
import type { Course, Locale, ReservationOccasion, RestaurantInfo, SeatingPreference } from "@/types";

function issueMessage(field: string, dictionary: Dictionary) {
  if (field === "customerEmail") return dictionary.reservation.invalidEmail;
  if (field === "customerPhone") return dictionary.reservation.invalidPhone;
  if (field === "reservationDate") return dictionary.reservation.invalidDate;
  if (field === "reservationTime") return dictionary.reservation.invalidTime;
  if (field === "guestCount") return dictionary.reservation.invalidGuests;
  if (field === "courseId") return dictionary.reservation.invalidCourse;
  if (field === "agreement") return dictionary.reservation.agreementRequired;
  return dictionary.reservation.requiredFields;
}

export function ReservationRequestForm({ locale, dictionary, restaurantInfo = restaurant, courseData = courses, initialCourseId = null }: { locale: Locale; dictionary: Dictionary; restaurantInfo?: RestaurantInfo; courseData?: Course[]; initialCourseId?: string | null }) {
  const router = useRouter();
  const minimumDate = useMemo(() => getTokyoNow().date, []);
  const tomorrow = useMemo(() => {
    const date = new Date(`${minimumDate}T00:00:00+09:00`);
    date.setDate(date.getDate() + 1);
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }, [minimumDate]);
  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState("19:00");
  const [guests, setGuests] = useState(2);
  const [courseId, setCourseId] = useState(initialCourseId ?? "");
  const [seatingPreference, setSeatingPreference] = useState<SeatingPreference>("no_preference");
  const [occasion, setOccasion] = useState<ReservationOccasion>("none");
  const [preferredLanguage, setPreferredLanguage] = useState<Locale>(locale);
  const [agreement, setAgreement] = useState(false);
  const submissionToken = useRef("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const requestableTimes = useMemo(() => getRequestableTimes(date), [date]);
  const selectedTime = requestableTimes.includes(time as (typeof requestableTimes)[number]) ? time : (requestableTimes[0] ?? "");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const form = new FormData(event.currentTarget);
    if (!submissionToken.current) submissionToken.current = crypto.randomUUID();
    const candidate = {
      courseId: courseId || null,
      customerName: String(form.get("customerName") ?? ""),
      customerEmail: String(form.get("customerEmail") ?? ""),
      customerPhone: String(form.get("customerPhone") ?? ""),
      reservationDate: date,
      reservationTime: selectedTime,
      guestCount: guests,
      seatingPreference,
      occasion,
      allergies: String(form.get("allergies") ?? ""),
      specialRequests: String(form.get("specialRequests") ?? ""),
      preferredLanguage,
      agreement,
      submissionToken: submissionToken.current,
    };
    const parsed = reservationRequestSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(issueMessage(reservationIssueField(parsed.error), dictionary));
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/reservations", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data) });
      const payload = await response.json().catch(() => null) as { error?: string; field?: string; reservation?: unknown; customerEmailSent?: boolean } | null;
      if (!response.ok) {
        if (payload?.error === "reservation_service_unavailable") setError(dictionary.reservation.serviceUnavailable);
        else if (payload?.error === "invalid_request" && payload.field) setError(issueMessage(payload.field, dictionary));
        else setError(dictionary.reservation.submissionFailed);
        return;
      }
      const confirmation = parseReservationConfirmation(payload?.reservation);
      if (!confirmation) {
        setError(dictionary.reservation.submissionFailed);
        return;
      }
      sessionStorage.setItem(`sakura-reservation:${confirmation.reservationReference}`, JSON.stringify(confirmation));
      sessionStorage.setItem(`sakura-reservation-token:${confirmation.reservationReference}`, parsed.data.submissionToken);
      sessionStorage.setItem(`sakura-reservation-email:${confirmation.reservationReference}`, payload?.customerEmailSent ? "sent" : "not-sent");
      router.push(`/${locale}/reservation/confirmation?reference=${encodeURIComponent(confirmation.reservationReference)}&token=${encodeURIComponent(parsed.data.submissionToken)}`);
    } catch {
      setError(dictionary.reservation.submissionFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reservation-panel" id="book">
      <div className="reservation-panel-ornament" aria-hidden="true"><span /><span /><span /></div>
      <div className="reservation-intro">
        <p className="eyebrow"><ShieldCheck aria-hidden="true" /> Sakura reservation request</p>
        <h2>{dictionary.reservation.title}</h2>
        <p>{dictionary.reservation.intro}</p>
        <p className="reservation-notice">{dictionary.reservation.notice}</p>
      </div>
      <form onSubmit={submit} className="reservation-form reservation-request-form" noValidate>
        <label><span>{dictionary.reservation.course}</span><select aria-label={dictionary.reservation.course} value={courseId} onChange={(event) => setCourseId(event.target.value)}><option value="">{dictionary.reservation.noCourse}</option>{courseData.filter((course) => course.enabled).map((course) => <option key={course.id} value={course.id}>{locale === "ja" ? course.nameJa : course.nameEn} — {course.price}</option>)}</select></label>
        <label><span><UserRound />{dictionary.reservation.fullName}</span><input name="customerName" type="text" autoComplete="name" minLength={2} maxLength={120} required /></label>
        <label><span><Mail />{dictionary.reservation.email}</span><input name="customerEmail" type="email" autoComplete="email" maxLength={254} required /></label>
        <label><span><Phone />{dictionary.reservation.phone}</span><input name="customerPhone" type="tel" autoComplete="tel" inputMode="tel" minLength={7} maxLength={24} required /></label>
        <div className="reservation-form-row">
          <label><span><CalendarDays />{dictionary.reservation.date}</span><input type="date" min={minimumDate} value={date} onChange={(event) => setDate(event.target.value)} required /></label>
          <label><span><Clock3 />{dictionary.reservation.time}</span><select value={selectedTime} onChange={(event) => setTime(event.target.value)} required disabled={!requestableTimes.length}>{requestableTimes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span><Users />{dictionary.reservation.guests}</span><select value={guests} onChange={(event) => setGuests(Number(event.target.value))} required>{Array.from({ length: MAX_RESERVATION_GUESTS - MIN_RESERVATION_GUESTS + 1 }, (_, index) => index + MIN_RESERVATION_GUESTS).map((count) => <option key={count} value={count}>{count}</option>)}</select></label>
        </div>
        {!requestableTimes.length ? <p className="form-error" role="alert">{dictionary.reservation.noTimes}</p> : null}
        <div className="reservation-form-row reservation-form-row-two">
          <label><span>{dictionary.reservation.seating}</span><select value={seatingPreference} onChange={(event) => setSeatingPreference(event.target.value as SeatingPreference)}><option value="no_preference">{dictionary.reservation.seatingOptions.noPreference}</option><option value="table">{dictionary.reservation.seatingOptions.table}</option><option value="booth">{dictionary.reservation.seatingOptions.booth}</option></select></label>
          <label><span>{dictionary.reservation.occasion}</span><select value={occasion} onChange={(event) => setOccasion(event.target.value as ReservationOccasion)}><option value="none">{dictionary.reservation.occasionOptions.none}</option><option value="birthday">{dictionary.reservation.occasionOptions.birthday}</option><option value="anniversary">{dictionary.reservation.occasionOptions.anniversary}</option><option value="business">{dictionary.reservation.occasionOptions.business}</option><option value="celebration">{dictionary.reservation.occasionOptions.celebration}</option><option value="other">{dictionary.reservation.occasionOptions.other}</option></select></label>
        </div>
        <label><span>{dictionary.reservation.allergies}</span><textarea name="allergies" maxLength={2000} placeholder={dictionary.reservation.allergiesPlaceholder} /></label>
        <label><span>{dictionary.reservation.specialRequests}</span><textarea name="specialRequests" maxLength={4000} placeholder={dictionary.reservation.specialRequestsPlaceholder} /></label>
        <label><span>{dictionary.reservation.preferredLanguage}</span><select value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value as Locale)}><option value="en">{dictionary.reservation.english}</option><option value="ja">{dictionary.reservation.japanese}</option></select></label>
        <label className="reservation-agreement"><input type="checkbox" checked={agreement} onChange={(event) => setAgreement(event.target.checked)} required /><span><CheckCircle2 />{dictionary.reservation.agreement}</span></label>
        <details className="reservation-privacy"><summary>{dictionary.reservation.privacyTitle}</summary><p>{dictionary.reservation.privacySummary}</p><Link href={localizePath(locale, "privacy")}>{dictionary.reservation.privacyPolicyLink}</Link></details>
        {error ? <p className="form-error" role="alert" aria-live="assertive">{error}</p> : null}
        <button className="button button-gold" type="submit" disabled={submitting || !requestableTimes.length}>{submitting ? dictionary.reservation.submitting : dictionary.reservation.submit}</button>
      </form>
      <div className="reservation-fallbacks">
        <a className="text-link" href={`tel:${restaurantInfo.reservationPhone}`}>{dictionary.reservation.phoneFallback} {restaurantInfo.reservationPhone}</a>
      </div>
    </div>
  );
}
