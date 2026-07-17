import type { Metadata } from "next";
import { headers } from "next/headers";
import { Cormorant_Garamond, Noto_Sans_JP } from "next/font/google";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Sakura Asian Dining & Bar | Takadanobaba", template: "%s | Sakura Asian Dining & Bar" },
  description: "Indian, Nepalese and Asian dining bar in Takadanobaba, Tokyo. Curries, tandoori, lunch, drinks and group dining.",
  applicationName: "Sakura Asian Dining & Bar",
  icons: { icon: "/icon.svg" },
  openGraph: { type: "website", siteName: "Sakura Asian Dining & Bar", images: ["/opengraph-image"] },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-sakura-locale") === "ja" ? "ja" : "en";
  return (
    <html lang={locale} className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
