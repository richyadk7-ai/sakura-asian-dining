import type { MetadataRoute } from "next";
import { restaurantConfig } from "@/data/restaurant";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${restaurantConfig.identity.nameEn} — Owner Reservations`,
    short_name: "Sakura Reservations",
    description: `Protected reservation alerts and owner dashboard for ${restaurantConfig.identity.nameEn}.`,
    start_url: "/admin/reservations",
    scope: "/",
    display: "standalone",
    background_color: "#120708",
    theme_color: "#5c111f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
  };
}
