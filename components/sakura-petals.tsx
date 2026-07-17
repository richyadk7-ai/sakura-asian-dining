import type { CSSProperties } from "react";

type Petal = {
  left: number;
  delay: number;
  duration: number;
  drift: number;
  scale: number;
  rotation: number;
  opacity: number;
  blur: number;
  mobile: boolean;
  tone: "blush" | "rose" | "ivory";
};

const petals: Petal[] = [
  { left: 3, delay: -4.2, duration: 15.8, drift: 82, scale: 0.62, rotation: 18, opacity: 0.58, blur: 0.2, mobile: true, tone: "blush" },
  { left: 11, delay: -12.1, duration: 20.4, drift: -74, scale: 0.42, rotation: 76, opacity: 0.36, blur: 0.8, mobile: false, tone: "ivory" },
  { left: 18, delay: -7.4, duration: 17.6, drift: 118, scale: 0.78, rotation: 132, opacity: 0.52, blur: 0, mobile: true, tone: "rose" },
  { left: 26, delay: -15.3, duration: 22.2, drift: -96, scale: 0.48, rotation: 39, opacity: 0.4, blur: 0.5, mobile: false, tone: "blush" },
  { left: 34, delay: -2.8, duration: 16.9, drift: 68, scale: 0.7, rotation: 188, opacity: 0.55, blur: 0.1, mobile: true, tone: "ivory" },
  { left: 43, delay: -18.7, duration: 24.8, drift: -134, scale: 0.38, rotation: 242, opacity: 0.3, blur: 1.2, mobile: false, tone: "rose" },
  { left: 51, delay: -9.6, duration: 18.7, drift: 104, scale: 0.84, rotation: 95, opacity: 0.54, blur: 0, mobile: true, tone: "blush" },
  { left: 59, delay: -5.5, duration: 21.5, drift: -88, scale: 0.52, rotation: 158, opacity: 0.42, blur: 0.5, mobile: false, tone: "ivory" },
  { left: 67, delay: -14.8, duration: 17.2, drift: 126, scale: 0.68, rotation: 284, opacity: 0.5, blur: 0.2, mobile: true, tone: "rose" },
  { left: 76, delay: -1.6, duration: 23.4, drift: -112, scale: 0.44, rotation: 51, opacity: 0.35, blur: 1, mobile: false, tone: "blush" },
  { left: 84, delay: -11.9, duration: 19.3, drift: 76, scale: 0.76, rotation: 214, opacity: 0.56, blur: 0, mobile: true, tone: "ivory" },
  { left: 93, delay: -6.2, duration: 16.4, drift: -92, scale: 0.58, rotation: 121, opacity: 0.48, blur: 0.3, mobile: true, tone: "rose" },
  { left: 7, delay: -19.5, duration: 25.1, drift: 148, scale: 0.34, rotation: 307, opacity: 0.28, blur: 1.4, mobile: false, tone: "rose" },
  { left: 22, delay: -1.1, duration: 19.8, drift: -58, scale: 0.55, rotation: 167, opacity: 0.46, blur: 0.4, mobile: true, tone: "blush" },
  { left: 38, delay: -10.4, duration: 15.4, drift: 92, scale: 0.9, rotation: 24, opacity: 0.5, blur: 0, mobile: false, tone: "rose" },
  { left: 47, delay: -4.9, duration: 22.7, drift: -126, scale: 0.46, rotation: 269, opacity: 0.34, blur: 0.9, mobile: true, tone: "ivory" },
  { left: 63, delay: -16.2, duration: 18.1, drift: 84, scale: 0.72, rotation: 143, opacity: 0.52, blur: 0.1, mobile: false, tone: "blush" },
  { left: 72, delay: -8.7, duration: 20.8, drift: -68, scale: 0.6, rotation: 331, opacity: 0.45, blur: 0.3, mobile: true, tone: "rose" },
  { left: 88, delay: -3.5, duration: 24.2, drift: 138, scale: 0.4, rotation: 82, opacity: 0.31, blur: 1.1, mobile: false, tone: "ivory" },
  { left: 97, delay: -17.8, duration: 17.9, drift: -116, scale: 0.66, rotation: 195, opacity: 0.48, blur: 0.2, mobile: true, tone: "blush" },
  { left: 15, delay: -6.8, duration: 23.9, drift: 96, scale: 0.36, rotation: 229, opacity: 0.3, blur: 1.3, mobile: false, tone: "ivory" },
  { left: 31, delay: -13.6, duration: 18.9, drift: -104, scale: 0.64, rotation: 63, opacity: 0.47, blur: 0.2, mobile: true, tone: "rose" },
  { left: 56, delay: -2.2, duration: 16.7, drift: 114, scale: 0.82, rotation: 174, opacity: 0.55, blur: 0, mobile: false, tone: "blush" },
  { left: 81, delay: -10.9, duration: 21.9, drift: -82, scale: 0.5, rotation: 296, opacity: 0.39, blur: 0.6, mobile: true, tone: "ivory" },
];

type PetalStyle = CSSProperties & {
  "--petal-left": string;
  "--petal-delay": string;
  "--petal-duration": string;
  "--petal-flutter": string;
  "--petal-drift": string;
  "--petal-drift-half": string;
  "--petal-drift-reverse": string;
  "--petal-scale": number;
  "--petal-rotation": string;
  "--petal-opacity": number;
  "--petal-blur": string;
};

export function SakuraPetals() {
  return (
    <div className="sakura-petals" data-sakura-petals aria-hidden="true">
      {petals.map((petal, index) => {
        const style: PetalStyle = {
          "--petal-left": `${petal.left}vw`,
          "--petal-delay": `${petal.delay}s`,
          "--petal-duration": `${petal.duration}s`,
          "--petal-flutter": `${2.4 + (index % 5) * 0.35}s`,
          "--petal-drift": `${petal.drift}px`,
          "--petal-drift-half": `${petal.drift * 0.48}px`,
          "--petal-drift-reverse": `${petal.drift * -0.22}px`,
          "--petal-scale": petal.scale,
          "--petal-rotation": `${petal.rotation}deg`,
          "--petal-opacity": petal.opacity,
          "--petal-blur": `${petal.blur}px`,
        };

        return (
          <span
            className={`sakura-petal sakura-petal-${petal.tone}${petal.mobile ? "" : " sakura-petal-desktop"}`}
            style={style}
            key={`${petal.left}-${petal.delay}`}
          >
            <svg viewBox="0 0 32 38" focusable="false">
              <path d="M18.2 2.1C10.6 3.2 2.7 11.4 2.2 21.3c-.4 8.1 5.7 13.6 12.6 11.2 8.1-2.8 13.1-13.8 10.5-24.2-.9-3.5-3.4-6.7-7.1-6.2Z" />
              <path className="sakura-petal-vein" d="M19.2 5.2c-2.5 8.2-5.2 15.6-9.8 23.1" />
            </svg>
          </span>
        );
      })}
    </div>
  );
}
