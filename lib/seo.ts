import type { Metadata } from "next";
import type { Locale } from "@/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function pageMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  const clean = path ? `/${path}` : "";
  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}${clean}`,
      languages: {
        en: `${siteUrl}/en${clean}`,
        ja: `${siteUrl}/ja${clean}`,
        "x-default": `${siteUrl}/en${clean}`,
      },
    },
    openGraph: { title, description, locale: locale === "ja" ? "ja_JP" : "en_US", url: `${siteUrl}/${locale}${clean}` },
  };
}
