import { LOCALES } from "@/lib/constants";
import type { Locale } from "@/types";

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function alternateLocale(locale: Locale): Locale {
  return locale === "ja" ? "en" : "ja";
}

export function localizePath(locale: Locale, path = "") {
  const clean = path.replace(/^\/(en|ja)/, "").replace(/^\//, "");
  return `/${locale}${clean ? `/${clean}` : ""}`;
}
