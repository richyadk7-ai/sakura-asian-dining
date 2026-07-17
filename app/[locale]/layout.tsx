import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { restaurant } from "@/data/restaurant";
import { getPublishedDictionary, getPublishedPayload } from "@/lib/content";
import type { LocalePageProps } from "@/types";
import { isLocale } from "@/lib/locale";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ja" }];
}

export default async function LocaleLayout({ children, params }: LocalePageProps & { children: React.ReactNode }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dictionary, restaurantInfo] = await Promise.all([getPublishedDictionary(locale), getPublishedPayload("restaurant", restaurant)]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurantInfo.nameEn,
    alternateName: restaurantInfo.nameJa,
    url: `${siteUrl}/${locale}`,
    telephone: restaurantInfo.reservationPhone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "高田馬場3-22-5 相沢ビル",
      addressLocality: "新宿区",
      addressRegion: "東京都",
      postalCode: "169-0075",
      addressCountry: "JP",
    },
    servesCuisine: ["Indian", "Nepalese", "Asian", "Curry", "Tandoori"],
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "11:00", closes: "15:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "17:00", closes: "23:00" },
    ],
    menu: `${siteUrl}/${locale}/menu`,
    acceptsReservations: true,
  };
  return (
    <AppShell locale={locale} dictionary={dictionary} restaurantInfo={restaurantInfo}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }} />
      {children}
    </AppShell>
  );
}
