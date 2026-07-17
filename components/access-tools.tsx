"use client";

import { Check, Copy, MapPinned } from "lucide-react";
import { useState } from "react";
import { ExternalLink } from "@/components/external-link";
import { restaurant } from "@/data/restaurant";
import { GOOGLE_MAPS_URL } from "@/lib/constants";
import type { Dictionary } from "@/locales";
import type { Locale, RestaurantInfo } from "@/types";

export function AccessTools({ locale, dictionary, restaurantInfo = restaurant }: { locale: Locale; dictionary: Dictionary; restaurantInfo?: RestaurantInfo }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const address = locale === "ja" ? restaurantInfo.addressJa : restaurantInfo.addressEn;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(restaurantInfo.addressJa);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("error");
    }
  };
  return (
    <div className="access-actions">
      <p>{address}</p>
      <button className="button button-outline" type="button" onClick={copy}>{status === "copied" ? <Check /> : <Copy />}{status === "copied" ? dictionary.access.copied : status === "error" ? dictionary.access.copyError : dictionary.access.copy}</button>
      <ExternalLink className="button button-gold" href={GOOGLE_MAPS_URL}><MapPinned />{dictionary.access.maps}</ExternalLink>
    </div>
  );
}
