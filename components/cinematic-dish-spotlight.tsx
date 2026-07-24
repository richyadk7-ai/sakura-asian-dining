"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Flame } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Locale, MenuItem, RestaurantPhoto } from "@/types";

type CinematicDishSpotlightProps = {
  locale: Locale;
  item: MenuItem;
  photo: RestaurantPhoto;
  description: string;
  menuHref: string;
  reservationHref: string;
  menuLabel: string;
  reservationLabel: string;
};

export function CinematicDishSpotlight({ locale, item, photo, description, menuHref, reservationHref, menuLabel, reservationLabel }: CinematicDishSpotlightProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [mobile, setMobile] = useState(false);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 82, damping: 24, mass: 0.28 });

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const backdropY = useTransform(progress, [0, 1], mobile ? [-18, 24] : [-90, 90]);
  const backdropScale = useTransform(progress, [0, 1], mobile ? [1.06, 1.02] : [1.22, 1.08]);
  const visualX = useTransform(progress, [0, 0.56, 0.76, 1], mobile ? [0, 0, 0, 0] : [210, 92, 0, 0]);
  const visualY = useTransform(progress, [0, 0.52, 0.86, 1], mobile ? [26, 0, -5, -8] : [72, 12, -12, -18]);
  const imageScale = useTransform(progress, [0, 0.55, 0.84, 1], mobile ? [1.12, 1.025, 1, 1.015] : [1.3, 1.08, 1, 1.035]);
  const mask = useTransform(progress, [0, 0.26, 0.74, 1], ["circle(13% at 50% 50%)", "circle(31% at 50% 50%)", "circle(64% at 50% 50%)", "circle(100% at 50% 50%)"]);
  const spotlightOpacity = useTransform(progress, [0, 0.3, 0.78, 1], [0.16, 0.46, 0.82, 0.68]);
  const spotlightScale = useTransform(progress, [0, 0.8, 1], [0.62, 1.06, 1]);
  const copyOpacity = useTransform(progress, [0, 0.62, 0.79, 1], [0, 0, 1, 1]);
  const copyY = useTransform(progress, [0, 0.64, 0.84, 1], mobile ? [28, 28, 0, 0] : [58, 58, 0, -6]);
  const progressScale = useTransform(progress, [0, 1], [0, 1]);
  const title = locale === "ja" ? item.nameJa : item.nameEn;
  const secondaryTitle = locale === "ja" ? item.nameEn : item.nameJa;
  const alt = locale === "ja" ? photo.altJa : photo.altEn;

  const animated = reduceMotion ? undefined : true;

  return (
    <section className="dish-scroll-section" ref={sectionRef} aria-labelledby="dish-scroll-title" data-dish-scroll-section data-reduced-motion={reduceMotion ? "true" : "false"}>
      <div className="dish-scroll-sticky">
        <motion.div className="dish-scroll-backdrop" aria-hidden="true" style={animated ? { y: backdropY, scale: backdropScale } : undefined}>
          <Image src={photo.src} alt="" fill sizes="100vw" />
        </motion.div>
        <div className="dish-scroll-vignette" aria-hidden="true" />
        <div className="container dish-scroll-layout">
          <motion.div className="dish-scroll-visual" style={animated ? { x: visualX, y: visualY } : undefined}>
            <motion.div className="dish-scroll-spotlight" aria-hidden="true" style={animated ? { opacity: spotlightOpacity, scale: spotlightScale } : undefined} />
            <motion.div className="dish-scroll-mask" style={animated ? { clipPath: mask, scale: imageScale } : undefined}>
              <Image
                className="dish-scroll-image"
                src={photo.src}
                alt={alt}
                width={photo.width}
                height={photo.height}
                sizes="(max-width: 760px) calc(100vw - 40px), 58vw"
                placeholder={photo.blurDataUrl ? "blur" : "empty"}
                blurDataURL={photo.blurDataUrl}
              />
              <span className="dish-scroll-image-line" aria-hidden="true" />
            </motion.div>
            <div className="dish-scroll-seal" aria-hidden="true"><Flame /><span>{String(item.sourceOrder).padStart(2, "0")}</span></div>
          </motion.div>

          <motion.div className="dish-scroll-copy" style={animated ? { opacity: copyOpacity, y: copyY } : undefined}>
            <p className="eyebrow">{locale === "ja" ? "窯からの一皿" : "From the tandoor"}</p>
            <p className="dish-scroll-secondary">{secondaryTitle}</p>
            <h2 id="dish-scroll-title">{title}</h2>
            <p className="dish-scroll-description">{description}</p>
            <div className="dish-scroll-price"><small>{locale === "ja" ? "税込価格" : "Tax included"}</small><strong>{item.price}</strong></div>
            <div className="dish-scroll-actions">
              <Link className="button button-gold" href={reservationHref}>{reservationLabel}<ArrowRight /></Link>
              <Link className="button button-outline" href={menuHref}>{menuLabel}</Link>
            </div>
          </motion.div>
        </div>
        <div className="dish-scroll-progress" aria-hidden="true"><motion.span style={animated ? { scaleX: progressScale } : { scaleX: 1 }} /></div>
      </div>
    </section>
  );
}
