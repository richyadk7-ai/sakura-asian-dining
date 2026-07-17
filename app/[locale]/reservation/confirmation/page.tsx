import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { ReservationConfirmation } from "@/components/reservation-confirmation";
import { getPublishedDictionary } from "@/lib/content";
import { isLocale } from "@/lib/locale";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ReservationConfirmationPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ reference?: string }> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const lang = isLocale(locale) ? locale : "en";
  const dictionary = await getPublishedDictionary(lang);
  const reference = typeof query.reference === "string" && /^SKR-\d{8}-[A-Z0-9]{6}$/.test(query.reference) ? query.reference : "—";
  return <><PageHero eyebrow="Sakura · Reservation" title={dictionary.reservation.confirmationTitle} intro={dictionary.reservation.confirmationIntro} /><section className="section"><div className="container"><ReservationConfirmation locale={lang} dictionary={dictionary} reference={reference} /></div></section></>;
}
