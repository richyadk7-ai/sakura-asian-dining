"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { type ReactNode, useRef } from "react";

export function MotionReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 94%", "end 8%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 115, damping: 27, mass: 0.24 });
  const y = useTransform(progress, [0, 0.24, 0.78, 1], [72, 0, 0, -28]);
  const x = useTransform(progress, [0, 0.24, 1], [delay > 0 ? 28 : -28, 0, 0]);
  const opacity = useTransform(progress, [0, 0.17, 0.84, 1], [0, 1, 1, 0.72]);
  const scale = useTransform(progress, [0, 0.25, 0.82, 1], [0.955, 1, 1, 0.985]);
  const rotateX = useTransform(progress, [0, 0.27, 1], [5, 0, -1.5]);

  return (
    <motion.div
      ref={ref}
      className={className}
      data-scroll-reveal
      style={reduce ? undefined : { y, x, opacity, scale, rotateX, transformPerspective: 1200 }}
    >
      {children}
    </motion.div>
  );
}
