import type { MetadataRoute } from "next";
import { restaurantConfig } from "@/data/restaurant";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || restaurantConfig.canonicalUrl;
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/admin"] }, sitemap: `${siteUrl}/sitemap.xml` };
}
