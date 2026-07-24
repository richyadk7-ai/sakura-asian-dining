import { restaurantConfig } from "@/data/restaurant";
import type { Locale } from "@/types";

export function BreadcrumbJsonLd({ locale, path, label }: { locale: Locale; path: string; label: string }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || restaurantConfig.canonicalUrl;
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "ja" ? "ホーム" : "Home", item: `${siteUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: label, item: `${siteUrl}/${locale}/${path}` },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll("<", "\\u003c") }} />;
}
