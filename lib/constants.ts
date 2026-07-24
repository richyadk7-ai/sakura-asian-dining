import { restaurantConfig } from "@/data/restaurant";

export const SITE_NAME_EN = restaurantConfig.identity.nameEn;
export const SITE_NAME_JA = restaurantConfig.identity.nameJa;
export const GOOGLE_MAPS_URL = restaurantConfig.location.mapsUrl;

export const PUBLIC_PATHS = ["", "menu", "courses", "gallery", "about", "access", "reservation", "privacy"] as const;
export const LOCALES = ["en", "ja"] as const;
export const LAST_VERIFIED = restaurantConfig.lastVerified;
