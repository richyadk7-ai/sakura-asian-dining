"use client";

import { Check, Copy, MapPinned } from "lucide-react";
import { useState } from "react";
import { ExternalLink } from "@/components/external-link";
import { restaurant } from "@/data/restaurant";
import { restaurantConfig } from "@/data/restaurant";
import type { Dictionary } from "@/locales";
import type { Locale, RestaurantInfo } from "@/types";

export function AccessTools({ locale, dictionary, restaurantInfo = restaurant }: { locale: Locale; dictionary: Dictionary; restaurantInfo?: RestaurantInfo }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const address = locale === "ja" ? restaurantInfo.addressJa : restaurantInfo.addressEn;
  const copy = async () => {
    try {
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(address);
          copied = true;
        } catch {
          copied = false;
        }
      }
      if (!copied) {
        const field = document.createElement("textarea");
        field.value = address;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        copied = document.execCommand("copy");
        field.remove();
        if (!copied) throw new Error("copy_failed");
      }
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("error");
    }
  };
  return (
    <div className="access-actions">
      <p>{address}</p>
      <button className="button button-outline access-copy-button" type="button" onClick={copy}>
        {status === "copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        <span aria-live="polite">{status === "copied" ? dictionary.access.copied : status === "error" ? dictionary.access.copyError : dictionary.access.copy}</span>
      </button>
      <ExternalLink className="button button-gold" href={restaurantConfig.location.mapsUrl}><MapPinned aria-hidden="true" />{dictionary.access.maps}<span className="sr-only"> — {dictionary.common.external}</span></ExternalLink>
    </div>
  );
}
