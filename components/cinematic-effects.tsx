"use client";

import { motion, useMotionValue, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export function CinematicEffects() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.25 });
  const pointerX = useMotionValue(-500);
  const pointerY = useMotionValue(-500);
  const smoothX = useSpring(pointerX, { stiffness: 180, damping: 30, mass: 0.18 });
  const smoothY = useSpring(pointerY, { stiffness: 180, damping: 30, mass: 0.18 });
  const [pointerActive, setPointerActive] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (reduceMotion || !finePointer.matches) return;

    const move = (event: PointerEvent) => {
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);
      setPointerActive(true);
    };
    const leave = () => setPointerActive(false);

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, [pointerX, pointerY, reduceMotion]);

  return (
    <div className="cinematic-effects" aria-hidden="true">
      <div className="scroll-progress-track">
        <motion.div className="scroll-progress-fill" style={{ scaleX: reduceMotion ? 0 : progress }} />
      </div>
      <div className="film-grain" />
      <motion.div className="pointer-aura" data-active={pointerActive ? "true" : "false"} style={{ x: smoothX, y: smoothY }}>
        <span />
      </motion.div>
    </div>
  );
}
