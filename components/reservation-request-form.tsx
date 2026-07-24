"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock3, Mail, Phone, ShieldCheck, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { courses } from "@/data/courses";
import { restaurant, restaurantConfig } from "@/data/restaurant";
import { localizePath } from "@/lib/locale";
import { getRequestableTimes, getTokyoNow, MAX_RESERVATION_GUESTS, MIN_RESERVATION_GUESTS, parseReservationConfirmation, reservationIssueField, reservationRequestSchema } from "@/lib/reservation-request";
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
  const reduceMotion = useReducedMotion();
  const minimumDate = useMemo(() => getTokyoNow().date, []);
  const dateOptions = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const value = new Date(`${minimumDate}T00:00:00+09:00`);
    value.setUTCDate(value.getUTCDate() + index + 1);
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: restaurantConfig.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
    const formatLocale = locale === "ja" ? "ja-JP" : "en-GB";
    const weekday = new Intl.DateTimeFormat(formatLocale, { timeZone: restaurantConfig.timeZone, weekday: "short" }).format(value);
    const dateLabel = new Intl.DateTimeFormat(formatLocale, { timeZone: restaurantConfig.timeZone, month: "short", day: "numeric" }).format(value);
    return { date, weekday, dateLabel };
  }), [locale, minimumDate]);

  const [step, setStep] = useState(1);
  const [date, setDate] = useState(dateOptions[0]?.date ?? minimumDate);
  const [time, setTime] = useState("19:00");
  const [guests, setGuests] = useState(2);
  const [courseId, setCourseId] = useState(initialCourseId ?? "");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [seatingPreference, setSeatingPreference] = useState<SeatingPreference>("no_preference");
  const [occasion, setOccasion] = useState<ReservationOccasion>("none");
  const [allergies, setAllergies] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [agreement, setAgreement] = useState(false);
  const submissionToken = useRef("");
  const submissionInFlight = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const requestableTimes = useMemo(() => getRequestableTimes(date), [date]);
  const selectedTime = requestableTimes.includes(time as (typeof requestableTimes)[number]) ? time : (requestableTimes[0] ?? "");
  const selectedCourse = courseData.find((course) => course.id === courseId && course.enabled);

  const stepLabels = locale === "ja" ? ["日時・人数", "ご連絡先", "ご希望", "確認"] : ["Visit", "Contact", "Details", "Review"];

  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (!date || date < minimumDate) return setError(dictionary.reservation.invalidDate);
      if (!selectedTime) return setError(dictionary.reservation.invalidTime);
      if (guests < MIN_RESERVATION_GUESTS || guests > MAX_RESERVATION_GUESTS) return setError(dictionary.reservation.invalidGuests);
      if (courseId && !selectedCourse) return setError(dictionary.reservation.invalidCourse);
    }
    if (step === 2) {
      if (customerName.trim().length < 2) return setError(dictionary.reservation.requiredFields);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) return setError(dictionary.reservation.invalidEmail);
      if (customerPhone.replace(/\D/g, "").length < 7) return setError(dictionary.reservation.invalidPhone);
    }
    setStep((current) => Math.min(4, current + 1));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || submissionInFlight.current || step !== 4) return;
    if (!submissionToken.current) submissionToken.current = crypto.randomUUID();
    const candidate = {
      courseId: courseId || null,
      customerName,
      customerEmail,
      customerPhone,
      reservationDate: date,
      reservationTime: selectedTime,
      guestCount: guests,
      seatingPreference,
      occasion,
      allergies,
      specialRequests,
      preferredLanguage: locale,
      agreement,
      submissionToken: submissionToken.current,
    };
    const parsed = reservationRequestSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(issueMessage(reservationIssueField(parsed.error), dictionary));
      return;
    }

    submissionInFlight.current = true;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/reservations", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data) });
      const payload = await response.json().catch(() => null) as { error?: string; field?: string; reservation?: unknown } | null;
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
      sessionStorage.setItem("sakura-reservation:last", JSON.stringify({ reference: confirmation.reservationReference, token: parsed.data.submissionToken }));
      router.push(`/${locale}/reservation/confirmation?reference=${encodeURIComponent(confirmation.reservationReference)}&token=${encodeURIComponent(parsed.data.submissionToken)}`);
    } catch {
      setError(dictionary.reservation.submissionFailed);
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="reservation-panel" id="book">
      <div className="reservation-panel-ornament" aria-hidden="true"><span /><span /><span /></div>
      <div className="reservation-intro">
        <p className="eyebrow"><ShieldCheck aria-hidden="true" /> {locale === "ja" ? "サクラ公式予約" : "Sakura direct reservation"}</p>
        <h2>{locale === "ja" ? "予約内容を入力" : "Your request details"}</h2>
        <p className="reservation-notice">{dictionary.reservation.notice}</p>
        <dl className="reservation-trust-facts">
          <div><dt>{dictionary.reservation.hoursLabel}</dt><dd>{restaurantInfo.lunchHours} · {restaurantInfo.dinnerHours}</dd></div>
          <div><dt>{dictionary.reservation.responseLabel}</dt><dd>{dictionary.reservation.responseValue}</dd></div>
        </dl>
      </div>

      <form onSubmit={submit} className="reservation-form reservation-request-form reservation-step-form" noValidate aria-describedby={error ? "reservation-form-error" : undefined}>
        <ol className="reservation-step-progress" aria-label={locale === "ja" ? "予約手順" : "Reservation progress"}>
          {stepLabels.map((label, index) => {
            const number = index + 1;
            return <li className={number === step ? "is-current" : number < step ? "is-complete" : ""} key={label}><button type="button" disabled={number > step} aria-current={number === step ? "step" : undefined} onClick={() => { setStep(number); setError(""); }}><span>{number < step ? <CheckCircle2 aria-hidden="true" /> : number}</span><strong>{label}</strong></button></li>;
          })}
        </ol>

        <AnimatePresence mode="wait" initial={false}>
          <motion.fieldset key={step} className="reservation-step" initial={reduceMotion ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -18 }} transition={{ duration: reduceMotion ? 0 : 0.28 }}>
            <legend>{stepLabels[step - 1]}</legend>
            {step === 1 ? (
              <>
                <label><span>{dictionary.reservation.course}</span><select aria-label={dictionary.reservation.course} value={courseId} onChange={(event) => setCourseId(event.target.value)}><option value="">{dictionary.reservation.noCourse}</option>{courseData.filter((course) => course.enabled).map((course) => <option key={course.id} value={course.id}>{locale === "ja" ? course.nameJa : course.nameEn} — {course.price}</option>)}</select></label>
                <div className="reservation-chip-group"><span><CalendarDays aria-hidden="true" />{dictionary.reservation.date}</span><div className="reservation-date-chips">{dateOptions.map((option) => <button type="button" className={date === option.date ? "active" : ""} aria-pressed={date === option.date} onClick={() => setDate(option.date)} key={option.date}><small>{option.weekday}</small><strong>{option.dateLabel}</strong></button>)}</div><label className="reservation-exact-date"><span>{locale === "ja" ? "別の日を選ぶ" : "Choose another date"}</span><input aria-label={dictionary.reservation.date} type="date" min={minimumDate} value={date} onChange={(event) => setDate(event.target.value)} /></label></div>
                <div className="reservation-chip-group"><span><Clock3 aria-hidden="true" />{dictionary.reservation.time}</span><div className="reservation-time-chips">{requestableTimes.map((item) => <button type="button" className={selectedTime === item ? "active" : ""} aria-pressed={selectedTime === item} onClick={() => setTime(item)} key={item}>{item}</button>)}</div></div>
                <label className="reservation-guests-select"><span><Users aria-hidden="true" />{dictionary.reservation.guests}</span><select aria-label={dictionary.reservation.guests} value={guests} onChange={(event) => setGuests(Number(event.target.value))}>{Array.from({ length: MAX_RESERVATION_GUESTS - MIN_RESERVATION_GUESTS + 1 }, (_, index) => index + MIN_RESERVATION_GUESTS).map((count) => <option value={count} key={count}>{count}</option>)}</select></label>
                {!requestableTimes.length ? <p className="form-error" role="alert">{dictionary.reservation.noTimes}</p> : null}
              </>
            ) : null}

            {step === 2 ? (
              <>
                <label><span><UserRound />{dictionary.reservation.fullName}</span><input aria-label={dictionary.reservation.fullName} value={customerName} onChange={(event) => setCustomerName(event.target.value)} type="text" autoComplete="name" minLength={2} maxLength={120} /></label>
                <label><span><Mail />{dictionary.reservation.email}</span><input aria-label={dictionary.reservation.email} value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} type="email" autoComplete="email" maxLength={254} /></label>
                <label><span><Phone />{dictionary.reservation.phone}</span><input aria-label={dictionary.reservation.phone} value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} type="tel" autoComplete="tel" inputMode="tel" minLength={7} maxLength={24} /></label>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <div className="reservation-form-row reservation-form-row-two">
                  <label><span>{dictionary.reservation.seating}</span><select value={seatingPreference} onChange={(event) => setSeatingPreference(event.target.value as SeatingPreference)}><option value="no_preference">{dictionary.reservation.seatingOptions.noPreference}</option><option value="table">{dictionary.reservation.seatingOptions.table}</option><option value="booth">{dictionary.reservation.seatingOptions.booth}</option></select></label>
                  <label><span>{dictionary.reservation.occasion}</span><select value={occasion} onChange={(event) => setOccasion(event.target.value as ReservationOccasion)}><option value="none">{dictionary.reservation.occasionOptions.none}</option><option value="birthday">{dictionary.reservation.occasionOptions.birthday}</option><option value="anniversary">{dictionary.reservation.occasionOptions.anniversary}</option><option value="business">{dictionary.reservation.occasionOptions.business}</option><option value="celebration">{dictionary.reservation.occasionOptions.celebration}</option><option value="other">{dictionary.reservation.occasionOptions.other}</option></select></label>
                </div>
                <label><span>{dictionary.reservation.allergies}</span><textarea value={allergies} onChange={(event) => setAllergies(event.target.value)} maxLength={2000} placeholder={dictionary.reservation.allergiesPlaceholder} /></label>
                <label><span>{dictionary.reservation.specialRequests}</span><textarea value={specialRequests} onChange={(event) => setSpecialRequests(event.target.value)} maxLength={4000} placeholder={dictionary.reservation.specialRequestsPlaceholder} /></label>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <div className="reservation-review" aria-live="polite">
                  <h3>{locale === "ja" ? "予約内容をご確認ください" : "Review your request"}</h3>
                  <dl>
                    <div><dt>{dictionary.reservation.date}</dt><dd>{date}</dd></div><div><dt>{dictionary.reservation.time}</dt><dd>{selectedTime}</dd></div><div><dt>{dictionary.reservation.guests}</dt><dd>{guests}</dd></div><div><dt>{dictionary.reservation.course}</dt><dd>{selectedCourse ? (locale === "ja" ? selectedCourse.nameJa : selectedCourse.nameEn) : dictionary.reservation.noCourse}</dd></div><div><dt>{dictionary.reservation.fullName}</dt><dd>{customerName}</dd></div><div><dt>{dictionary.reservation.email}</dt><dd>{customerEmail}</dd></div><div><dt>{dictionary.reservation.phone}</dt><dd>{customerPhone}</dd></div>
                  </dl>
                </div>
                <label className="reservation-agreement"><input type="checkbox" checked={agreement} onChange={(event) => setAgreement(event.target.checked)} /><span><CheckCircle2 />{dictionary.reservation.agreement}</span></label>
                <details className="reservation-privacy"><summary>{dictionary.reservation.privacyTitle}</summary><p>{dictionary.reservation.privacySummary}</p><Link href={localizePath(locale, "privacy")}>{dictionary.reservation.privacyPolicyLink}</Link></details>
              </>
            ) : null}
          </motion.fieldset>
        </AnimatePresence>

        {error ? <p id="reservation-form-error" className="form-error" role="alert" aria-live="assertive">{error}</p> : null}
        <div className="reservation-step-actions">
          {step > 1 ? <button className="button button-outline" type="button" onClick={() => { setStep((current) => current - 1); setError(""); }}><ArrowLeft aria-hidden="true" />{locale === "ja" ? "戻る" : "Back"}</button> : <span />}
          {step < 4 ? <button className="button button-gold" type="button" onClick={nextStep} disabled={!requestableTimes.length}>{locale === "ja" ? "次へ" : "Continue"}<ArrowRight aria-hidden="true" /></button> : <button className="button button-gold" type="submit" disabled={submitting}>{submitting ? dictionary.reservation.submitting : dictionary.reservation.submit}</button>}
        </div>
      </form>
      <div className="reservation-fallbacks"><a className="text-link" href={`tel:${restaurantInfo.reservationPhone}`}>{dictionary.reservation.phoneFallback} {restaurantInfo.reservationPhone}</a></div>
    </div>
  );
}
