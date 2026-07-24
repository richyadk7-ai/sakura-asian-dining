"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

export function CinematicEffects() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.25 });

  return (
    <div className="cinematic-effects" aria-hidden="true">
      <div className="scroll-progress-track">
        <motion.div className="scroll-progress-fill" style={{ scaleX: reduceMotion ? 0 : progress }} />
      </div>
      <div className="film-grain" />
    </div>
  );
}
