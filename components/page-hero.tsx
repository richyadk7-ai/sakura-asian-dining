import Image from "next/image";
import type { Locale, RestaurantPhoto } from "@/types";

export type PageHeroVariant = "default" | "menu" | "courses" | "gallery" | "access" | "reservation" | "about";

export function PageHero({
  eyebrow,
  title,
  intro,
  locale,
  variant = "default",
  photo,
  secondaryPhoto,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  locale: Locale;
  variant?: PageHeroVariant;
  photo?: RestaurantPhoto;
  secondaryPhoto?: RestaurantPhoto;
}) {
  return (
    <section className={`page-hero page-hero-${variant}`} aria-labelledby={`page-hero-${variant}-title`}>
      {photo ? (
        <div className="page-hero-media">
          <Image
            src={photo.src}
            alt={locale === "ja" ? photo.altJa : photo.altEn}
            fill
            sizes="100vw"
            priority
            quality={88}
            placeholder={photo.blurDataUrl ? "blur" : "empty"}
            blurDataURL={photo.blurDataUrl}
          />
        </div>
      ) : null}
      <div className="page-hero-wash" aria-hidden="true" />
      <div className="container page-hero-shell">
        <div className="page-hero-content">
          <p className="eyebrow">{eyebrow}</p>
          <h1 id={`page-hero-${variant}-title`}>{title}</h1>
          <p>{intro}</p>
        </div>
        {secondaryPhoto ? (
          <div className="page-hero-secondary">
            <Image
              src={secondaryPhoto.src}
              alt={locale === "ja" ? secondaryPhoto.altJa : secondaryPhoto.altEn}
              fill
              sizes="(max-width: 760px) 42vw, 24vw"
              priority
              quality={86}
              placeholder={secondaryPhoto.blurDataUrl ? "blur" : "empty"}
              blurDataURL={secondaryPhoto.blurDataUrl}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
