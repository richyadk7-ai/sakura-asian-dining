"use client";

import { Pause, Play } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/types";

export function HeroMotionReel({ locale }: { locale: Locale }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const manuallyPaused = useRef(false);
  const reduceMotion = useReducedMotion();
  const [paused, setPaused] = useState(true);

  const play = useCallback(() => {
    if (!videoRef.current || reduceMotion) return;
    try {
      const playback = videoRef.current.play();
      if (playback) void playback.catch(() => undefined);
    } catch {
      return;
    }
  }, [reduceMotion]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reduceMotion) {
      video.pause();
      return;
    }

    play();
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) video.pause();
      else if (!manuallyPaused.current) play();
    }, { threshold: 0.2 });
    observer.observe(video);
    return () => observer.disconnect();
  }, [play, reduceMotion]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      manuallyPaused.current = false;
      play();
    } else {
      manuallyPaused.current = true;
      video.pause();
    }
  };

  return (
    <section className="hero-motion-reel" aria-label={locale === "ja" ? "さくらの料理と店内の映像" : "Sakura food and dining room film"}>
      <div className="hero-motion-screen">
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/originals/food/food-030.jpg"
          aria-hidden="true"
          onPause={() => setPaused(true)}
          onPlay={() => setPaused(false)}
        >
          <source src="/videos/sakura-kitchen-reel.webm" type="video/webm" />
          <source src="/videos/sakura-kitchen-reel.mp4" type="video/mp4" />
        </video>
        <button type="button" onClick={togglePlayback} aria-label={paused ? (locale === "ja" ? "映像を再生" : "Play restaurant film") : (locale === "ja" ? "映像を一時停止" : "Pause restaurant film")}>
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
        </button>
      </div>
    </section>
  );
}
