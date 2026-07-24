import { ImageResponse } from "next/og";
import { restaurantConfig } from "@/data/restaurant";

export const alt = `${restaurantConfig.identity.nameEn} — ${restaurantConfig.location.stationNameEn}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#090707", color: "#f7efe4", padding: 72, position: "relative", fontFamily: "serif" }}>
      <div style={{ position: "absolute", inset: 28, border: "1px solid #d2aa58", display: "flex" }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
        <div style={{ display: "flex", color: "#d2aa58", fontSize: 34, letterSpacing: 8 }}>{`${restaurantConfig.location.stationNameJa} · TOKYO`}</div>
        <div style={{ fontSize: 76, lineHeight: 1.05 }}>{restaurantConfig.identity.nameJa}</div>
        <div style={{ fontSize: 46, color: "#f0d28d" }}>{restaurantConfig.identity.nameEn}</div>
        <div style={{ fontSize: 28, color: "#b8a9a4" }}>Indian · Nepalese · Asian dining bar</div>
      </div>
      <div style={{ position: "absolute", right: 90, bottom: 65, fontSize: 150, color: "#6d1027" }}>桜</div>
    </div>,
    size,
  );
}
