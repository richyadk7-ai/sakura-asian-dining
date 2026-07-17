import { en } from "@/locales/en";
import { ja } from "@/locales/ja";
import type { Locale } from "@/types";

export type Dictionary = typeof en;

export function getDictionary(locale: Locale): Dictionary {
  return (locale === "ja" ? ja : en) as Dictionary;
}

export const dictionaries = { en, ja };
