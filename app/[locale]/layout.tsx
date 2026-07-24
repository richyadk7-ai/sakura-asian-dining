import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { restaurant, restaurantConfig } from "@/data/restaurant";
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || restaurantConfig.canonicalUrl;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurantInfo.nameEn,
    alternateName: restaurantInfo.nameJa,
    url: `${siteUrl}/${locale}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurantConfig.location.streetAddress,
      addressLocality: restaurantConfig.location.addressLocality,
      addressRegion: restaurantConfig.location.addressRegion,
      postalCode: restaurantConfig.location.postalCode,
      addressCountry: restaurantConfig.location.countryCode,
    },
    servesCuisine: ["Indian", "Nepalese", "Asian", "Curry", "Tandoori"],
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: restaurantConfig.service.lunch.opens, closes: restaurantConfig.service.lunch.closes },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: restaurantConfig.service.dinner.opens, closes: restaurantConfig.service.dinner.closes },
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
