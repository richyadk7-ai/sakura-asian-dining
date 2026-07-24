import type { MetadataRoute } from "next";
import { restaurantConfig } from "@/data/restaurant";
import { LOCALES, PUBLIC_PATHS } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || restaurantConfig.canonicalUrl;
  return LOCALES.flatMap((locale) => PUBLIC_PATHS.map((path) => ({
    url: `${siteUrl}/${locale}${path ? `/${path}` : ""}`,
    lastModified: new Date(restaurantConfig.lastVerified),
    changeFrequency: path === "menu" || path === "courses" ? "weekly" as const : "monthly" as const,
    priority: path === "" ? 1 : 0.8,
    alternates: { languages: { en: `${siteUrl}/en${path ? `/${path}` : ""}`, ja: `${siteUrl}/ja${path ? `/${path}` : ""}` } },
  })));
}
