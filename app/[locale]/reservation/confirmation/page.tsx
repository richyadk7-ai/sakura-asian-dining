import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { ReservationConfirmation } from "@/components/reservation-confirmation";
import { getPublishedDictionary } from "@/lib/content";
import { isLocale } from "@/lib/locale";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ReservationConfirmationPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ reference?: string; token?: string }> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const lang = isLocale(locale) ? locale : "en";
  const dictionary = await getPublishedDictionary(lang);
  const reference = typeof query.reference === "string" && /^SKR-\d{8}-[A-Z0-9]{6}$/.test(query.reference) ? query.reference : "—";
  const statusToken = typeof query.token === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(query.token) ? query.token : "";
  return <><PageHero locale={lang} variant="reservation" eyebrow={dictionary.reservation.heroEyebrow} title={dictionary.reservation.confirmationTitle} intro={dictionary.reservation.confirmationIntro} /><section className="section reservation-confirmation-stage"><div className="container"><ReservationConfirmation locale={lang} dictionary={dictionary} reference={reference} statusToken={statusToken} /></div></section></>;
}
