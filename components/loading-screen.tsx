"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/locales";

const SEEN_KEY = "sakura-intro-seen";

export function LoadingScreen({ dictionary }: { dictionary: Dictionary }) {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reduce || window.localStorage.getItem(SEEN_KEY)) return;
    const frame = window.requestAnimationFrame(() => setVisible(true));
    const timer = window.setTimeout(() => {
      setVisible(false);
      window.localStorage.setItem(SEEN_KEY, "1");
    }, 1200);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, [reduce]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          aria-live="polite"
          aria-label={dictionary.common.loading}
        >
          <motion.span className="loading-monogram" initial={{ scale: 0.92 }} animate={{ scale: 1 }}>桜</motion.span>
          <p>さくら</p>
          <motion.div className="loading-line" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.9 }} />
          <span>{dictionary.common.loading}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
