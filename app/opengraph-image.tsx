import { ImageResponse } from "next/og";

export const alt = "Sakura Asian Dining & Bar — Takadanobaba";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#090707", color: "#f7efe4", padding: 72, position: "relative", fontFamily: "serif" }}>
      <div style={{ position: "absolute", inset: 28, border: "1px solid #d2aa58", display: "flex" }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
        <div style={{ color: "#d2aa58", fontSize: 34, letterSpacing: 8 }}>高田馬場 · TOKYO</div>
        <div style={{ fontSize: 76, lineHeight: 1.05 }}>さくらアジアンダイニング&バー</div>
        <div style={{ fontSize: 46, color: "#f0d28d" }}>Sakura Asian Dining & Bar</div>
        <div style={{ fontSize: 28, color: "#b8a9a4" }}>Indian · Nepalese · Asian dining bar</div>
      </div>
      <div style={{ position: "absolute", right: 90, bottom: 65, fontSize: 150, color: "#6d1027" }}>桜</div>
    </div>,
    size,
  );
}
