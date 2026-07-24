"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import type { Locale } from "@/types";

const chapterNames = {
  en: ["Opening", "Sakura", "Flavours", "Menu", "Courses", "Tandoor", "Lunch", "Drinks", "Atmosphere", "Gallery", "Access", "Reserve"],
  ja: ["序章", "さくら", "味わい", "メニュー", "コース", "タンドール", "ランチ", "ドリンク", "店内", "ギャラリー", "アクセス", "予約"],
} as const;

export function ScrollCinema({ locale }: { locale: Locale }) {
  const reduceMotion = useReducedMotion();
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 105, damping: 28, mass: 0.22 });
  const orbitRotation = useTransform(progress, [0, 1], [0, 520]);
  const orbitScale = useTransform(progress, [0, 0.45, 1], [0.82, 1.08, 0.9]);
  const auraY = useTransform(progress, [0, 1], ["-16vh", "62vh"]);
  const auraOpacity = useTransform(progress, [0, 0.16, 0.72, 1], [0.16, 0.42, 0.3, 0.08]);
  const [activeChapter, setActiveChapter] = useState(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (reduceMotion) return;
    const heroScroll = Math.min(Math.max(latest, 0), 1050);
    const root = document.documentElement;
    root.style.setProperty("--hero-copy-scroll-y", `${heroScroll * 0.075}px`);
    root.style.setProperty("--hero-stage-scroll-y", `${heroScroll * -0.09}px`);
    root.style.setProperty("--hero-wordmark-scroll-x", `${heroScroll * -0.065}px`);
    root.style.setProperty("--hero-rail-scroll-y", `${heroScroll * 0.13}px`);
    root.style.setProperty("--hero-reel-scroll-y", `${heroScroll * -0.045}px`);
  });

  useEffect(() => {
    const root = document.documentElement;
    if (reduceMotion) {
      root.style.setProperty("--hero-copy-scroll-y", "0px");
      root.style.setProperty("--hero-stage-scroll-y", "0px");
      root.style.setProperty("--hero-wordmark-scroll-x", "0px");
      root.style.setProperty("--hero-rail-scroll-y", "0px");
      root.style.setProperty("--hero-reel-scroll-y", "0px");
    }

    const chapters = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-chapter]"));
    if (!("IntersectionObserver" in window) || !chapters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const chapter = Number.parseInt((visible.target as HTMLElement).dataset.scrollChapter ?? "0", 10);
        if (Number.isFinite(chapter)) setActiveChapter(chapter);
      },
      { rootMargin: "-30% 0px -48%", threshold: [0, 0.12, 0.35, 0.65] },
    );

    chapters.forEach((chapter) => observer.observe(chapter));
    return () => {
      observer.disconnect();
      root.style.removeProperty("--hero-copy-scroll-y");
      root.style.removeProperty("--hero-stage-scroll-y");
      root.style.removeProperty("--hero-wordmark-scroll-x");
      root.style.removeProperty("--hero-rail-scroll-y");
      root.style.removeProperty("--hero-reel-scroll-y");
    };
  }, [reduceMotion]);

  const chapter = Math.min(Math.max(activeChapter, 0), 11);

  return (
    <div className="scroll-cinema" data-reduced-motion={reduceMotion ? "true" : "false"} aria-hidden="true">
      <motion.div className="scroll-cinema-aura" style={reduceMotion ? undefined : { y: auraY, opacity: auraOpacity }} />
      <motion.div className="scroll-cinema-orbit" style={reduceMotion ? undefined : { rotate: orbitRotation, scale: orbitScale }}>
        <i />
        <b />
      </motion.div>
      <div className="scroll-chapter-meter" data-active-chapter={String(chapter).padStart(2, "0")}>
        <span>SCENE</span>
        <strong>{String(chapter).padStart(2, "0")}</strong>
        <i><motion.b style={reduceMotion ? { scaleY: 0 } : { scaleY: progress }} /></i>
        <small>{chapterNames[locale][chapter]}</small>
        <em>11</em>
      </div>
    </div>
  );
}
