import type { Metadata } from "next";
import { headers } from "next/headers";
import { Cormorant_Garamond, Noto_Sans_JP } from "next/font/google";
import { SiteObservability } from "@/components/site-observability";
import { restaurantConfig } from "@/data/restaurant";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sans = Noto_Sans_JP({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || restaurantConfig.canonicalUrl;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${restaurantConfig.identity.nameEn} | Takadanobaba`, template: `%s | ${restaurantConfig.identity.nameEn}` },
  description: "Indian, Nepalese and Asian dining bar in Takadanobaba, Tokyo. Curries, tandoori, lunch, drinks and group dining.",
  applicationName: restaurantConfig.identity.nameEn,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Sakura Reservations" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: { type: "website", siteName: restaurantConfig.identity.nameEn, images: ["/opengraph-image"] },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-sakura-locale") === "ja" ? "ja" : "en";
  return (
    <html lang={locale} className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <body>{children}<SiteObservability /></body>
    </html>
  );
}
