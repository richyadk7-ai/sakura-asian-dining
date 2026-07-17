import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sakura Asian Dining & Bar — Owner Reservations",
    short_name: "Sakura Reservations",
    description: "Protected reservation alerts and owner dashboard for Sakura Asian Dining & Bar.",
    start_url: "/admin/reservations",
    scope: "/",
    display: "standalone",
    background_color: "#120708",
    theme_color: "#5c111f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
  };
}
