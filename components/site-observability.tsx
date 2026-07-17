"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { sanitizePublicObservation } from "@/lib/analytics";

export function SiteObservability() {
  return (
    <>
      <Analytics beforeSend={sanitizePublicObservation} />
      <SpeedInsights beforeSend={sanitizePublicObservation} />
    </>
  );
}
