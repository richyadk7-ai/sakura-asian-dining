"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export function CinematicHomeFilm({ label }: { label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useRef(true);
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);

  const play = useCallback(() => {
    if (!videoRef.current || reduceMotion) return;
    const playback = videoRef.current.play();
    if (playback) void playback.catch(() => undefined);
  }, [reduceMotion]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reduceMotion) {
      video.pause();
      return;
    }

    play();
    const observer = new IntersectionObserver(([entry]) => {
      inView.current = entry.isIntersecting;
      if (entry.isIntersecting) play();
      else video.pause();
    }, { rootMargin: "20% 0px", threshold: 0.08 });
    observer.observe(video);

    const handleVisibility = () => {
      if (document.hidden) video.pause();
      else if (inView.current) play();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [play, reduceMotion]);

  return (
    <motion.section
      className="home-film"
      aria-label={label}
      initial={reduceMotion ? false : { opacity: 0.6, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.18, once: true }}
      transition={{ duration: reduceMotion ? 0 : 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="home-film-frame">
        <Image
          className="home-film-poster"
          src="/videos/sakura-dining-cinematic-poster.jpg"
          alt=""
          fill
          sizes="100vw"
        />
        <video
          ref={videoRef}
          className={ready && !reduceMotion ? "is-ready" : ""}
          muted
          loop
          playsInline
          autoPlay={!reduceMotion}
          preload={reduceMotion ? "none" : "metadata"}
          poster="/videos/sakura-dining-cinematic-poster.jpg"
          aria-hidden="true"
          tabIndex={-1}
          onLoadedData={() => setReady(true)}
        >
          <source src="/videos/sakura-dining-cinematic.mp4" type="video/mp4" />
        </video>
        <div className="home-film-vignette" aria-hidden="true" />
        <p>{label}</p>
      </div>
    </motion.section>
  );
}
