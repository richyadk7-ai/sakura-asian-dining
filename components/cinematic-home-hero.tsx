"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Flame, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Locale, RestaurantPhoto } from "@/types";

type CinematicHomeHeroProps = {
  locale: Locale;
  photo: RestaurantPhoto;
  restaurantNameEn: string;
  restaurantNameJa: string;
  kicker: string;
  titleLineOne: string;
  titleLineTwo: string;
  description: string;
  location: string;
  reserveLabel: string;
  menuLabel: string;
  menuHref: string;
  reservationHref: string;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function CinematicHomeHero({
  locale,
  photo,
  restaurantNameEn,
  restaurantNameJa,
  kicker,
  titleLineOne,
  titleLineTwo,
  description,
  location,
  reserveLabel,
  menuLabel,
  menuHref,
  reservationHref,
}: CinematicHomeHeroProps) {
  const reduceMotion = useReducedMotion();
  const intro = (delay: number, y = 24) => reduceMotion
    ? { initial: false as const, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.72, delay, ease } };

  return (
    <section className="fire-hero" aria-labelledby="fire-hero-title" data-scroll-chapter="0">
      <motion.div
        className="fire-hero-light"
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.72 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 1.1, ease }}
      />
      <motion.div
        className="fire-hero-media"
        initial={reduceMotion ? false : { opacity: 0, scale: 1.075 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 1.4, delay: 0.04, ease }}
      >
        <Image
          src={photo.src}
          alt={locale === "ja" ? photo.altJa : photo.altEn}
          fill
          sizes="(max-width: 760px) 100vw, 72vw"
          priority
          quality={90}
          placeholder={photo.blurDataUrl ? "blur" : "empty"}
          blurDataURL={photo.blurDataUrl}
        />
        <div className="fire-hero-photo-veil" aria-hidden="true" />
        <div className="fire-hero-steam" aria-hidden="true"><span /><span /></div>
      </motion.div>
      <div className="container fire-hero-layout">
        <div className="fire-hero-copy">
          <motion.p className="fire-hero-kicker" {...intro(0.08, 12)}>
            <Flame aria-hidden="true" />
            {kicker}
          </motion.p>
          <motion.p className="fire-hero-japanese" {...intro(0.16)}>
            {locale === "ja" ? restaurantNameEn : restaurantNameJa}
          </motion.p>
          <motion.h1 id="fire-hero-title" {...intro(0.22, 34)}>
            <span>{titleLineOne} </span>
            <span>{titleLineTwo}</span>
          </motion.h1>
          <motion.p className="fire-hero-description" {...intro(0.36)}>
            {description}
          </motion.p>
          <motion.div className="fire-hero-location" {...intro(0.44, 14)}>
            <MapPin aria-hidden="true" />
            {location}
          </motion.div>
          <motion.div className="fire-hero-actions" {...intro(0.52, 16)}>
            <Link className="button button-gold" href={reservationHref}>{reserveLabel}<ArrowRight aria-hidden="true" /></Link>
            <Link className="button button-outline" href={menuHref}>{menuLabel}</Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
