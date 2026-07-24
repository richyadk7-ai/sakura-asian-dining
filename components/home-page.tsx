import { ArrowRight, Clock3, Flame, MapPin, PhoneCall, Sparkles, Sprout } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CinematicHomeFilm } from "@/components/cinematic-home-film";
import { CinematicHomeHero } from "@/components/cinematic-home-hero";
import { CourseGrid } from "@/components/course-grid";
import { HeroMotionReel } from "@/components/hero-motion-reel";
import { LazyDishScroll3D } from "@/components/lazy-dish-scroll-3d";
import { MotionReveal } from "@/components/motion-reveal";
import { courses } from "@/data/courses";
import { restaurant, restaurantConfig } from "@/data/restaurant";
import { drinkItems, foodItems, lunchItems } from "@/data/menu";
import { authorizedPhotos } from "@/data/photos";
import { localizePath } from "@/lib/locale";
import type { Dictionary } from "@/locales";
import type { Course, Locale, MenuItem, RestaurantInfo, RestaurantPhoto } from "@/types";

const popularPairings = [
  { itemId: "food-032", photoId: "food-030" },
  { itemId: "food-073", photoId: "food-029" },
  { itemId: "food-027", photoId: "food-034" },
  { itemId: "food-049", photoId: "food-022" },
  { itemId: "food-044", photoId: "food-031" },
  { itemId: "food-088", photoId: "food-028" },
] as const;

const atmospherePhotoIds = ["interior-003", "interior-001", "exterior-001", "drinks-001"] as const;

export function HomePage({
  locale,
  dictionary,
  restaurantInfo = restaurant,
  menuData = [...foodItems, ...drinkItems, ...lunchItems],
  courseData = courses,
  photos = authorizedPhotos,
}: {
  locale: Locale;
  dictionary: Dictionary;
  restaurantInfo?: RestaurantInfo;
  menuData?: MenuItem[];
  courseData?: Course[];
  photos?: RestaurantPhoto[];
}) {
  const foods = menuData.filter((item) => item.section === "food");
  const heroPhoto = photos.find((photo) => photo.id === "food-030") ?? photos.find((photo) => photo.category === "food");
  const signatureSet = foods.find((item) => item.id === "food-088");
  const popularDishes = popularPairings.flatMap(({ itemId, photoId }) => {
    const item = foods.find((candidate) => candidate.id === itemId);
    const photo = photos.find((candidate) => candidate.id === photoId);
    return item && photo ? [{ item, photo }] : [];
  });
  const atmospherePhotos = atmospherePhotoIds.flatMap((id) => {
    const photo = photos.find((candidate) => candidate.id === id);
    return photo ? [photo] : [];
  });

  const menuHref = localizePath(locale, "menu");
  const reservationHref = localizePath(locale, "reservation");
  const galleryHref = localizePath(locale, "gallery");
  const accessHref = localizePath(locale, "access");

  return (
    <>
      {heroPhoto ? (
        <CinematicHomeHero
          locale={locale}
          photo={heroPhoto}
          restaurantNameEn={restaurantInfo.nameEn}
          restaurantNameJa={restaurantInfo.nameJa}
          kicker={dictionary.home.heroKicker}
          titleLineOne={dictionary.home.heroTitleLineOne}
          titleLineTwo={dictionary.home.heroTitleLineTwo}
          description={dictionary.home.heroDescription}
          location={dictionary.common.location}
          reserveLabel={dictionary.home.heroReserve}
          menuLabel={dictionary.common.viewMenu}
          menuHref={menuHref}
          reservationHref={reservationHref}
        />
      ) : null}

      <CinematicHomeFilm label={dictionary.home.filmLabel} />

      <section className="home-trust" aria-label={locale === "ja" ? "店舗情報" : "Restaurant information"} data-scroll-chapter="1">
        <div className="container home-trust-grid">
          <div><MapPin aria-hidden="true" /><span>{locale === "ja" ? restaurantConfig.location.stationNameJa : restaurantConfig.location.stationNameEn}</span><strong>{restaurantInfo.stationWalkMinutes} {locale === "ja" ? "分" : "minutes"}</strong></div>
          <div><Flame aria-hidden="true" /><span>{locale === "ja" ? "インド・ネパール・アジア料理" : "Indian · Nepalese · Asian"}</span><strong>{locale === "ja" ? "窯焼きとスパイス" : "Tandoor & spice"}</strong></div>
          <div><Clock3 aria-hidden="true" /><span>{dictionary.access.hours}</span><strong>{restaurantInfo.lunchHours} · {restaurantInfo.dinnerHours}</strong></div>
          <Link href={accessHref}>{dictionary.nav.access}<ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="home-popular" aria-labelledby="popular-dishes-title" data-scroll-chapter="2">
        <div className="container">
          <MotionReveal className="home-scene-heading">
            <p className="eyebrow">{locale === "ja" ? "人気の一皿" : "Popular dishes"}</p>
            <h2 id="popular-dishes-title">{locale === "ja" ? "火とスパイスが生む、サクラの定番。" : "The dishes guests return for."}</h2>
            <p>{locale === "ja" ? "窯焼き、カレー、モモ、焼きたてのナンから、まず味わってほしい六皿を。" : "Six house favourites spanning the tandoor, curries, Nepalese momo and freshly baked naan."}</p>
          </MotionReveal>
          <div className="popular-dish-rail" tabIndex={0} role="region" aria-label={locale === "ja" ? "人気料理を横にスクロール" : "Scrollable popular dishes"}>
            {popularDishes.map(({ item, photo }, index) => (
              <MotionReveal className={`popular-dish-card popular-dish-card-${index + 1}`} delay={Math.min(index * 0.04, 0.16)} key={item.id}>
                <article>
                  <Image
                    src={photo.src}
                    alt={locale === "ja" ? photo.altJa : photo.altEn}
                    width={photo.width}
                    height={photo.height}
                    sizes="(max-width: 760px) 82vw, (max-width: 1100px) 44vw, 31vw"
                    loading="lazy"
                    placeholder={photo.blurDataUrl ? "blur" : "empty"}
                    blurDataURL={photo.blurDataUrl}
                  />
                  <div className="popular-dish-overlay">
                    <div className="popular-dish-badges">
                      {item.recommended ? <span><Sparkles aria-hidden="true" />{locale === "ja" ? "おすすめ" : "Popular"}</span> : null}
                      {item.spicy ? <span><Flame aria-hidden="true" />{locale === "ja" ? "スパイス" : "Spiced"}</span> : null}
                      {item.vegetarian ? <span><Sprout aria-hidden="true" />{locale === "ja" ? "ベジタリアン" : "Vegetarian"}</span> : null}
                    </div>
                    <p>{locale === "ja" ? item.nameEn : item.nameJa}</p>
                    <h3>{locale === "ja" ? item.nameJa : item.nameEn}</h3>
                    <div><small>{locale === "ja" ? item.categoryJa : item.categoryEn}</small><strong>{item.price}</strong></div>
                  </div>
                </article>
              </MotionReveal>
            ))}
          </div>
          <Link className="home-menu-link" href={menuHref}>{dictionary.common.viewMenu}<ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>

      {signatureSet ? (
        <LazyDishScroll3D
          locale={locale}
          item={signatureSet}
          description={locale === "ja" ? "タンドールの熱、豊かなカレー、焼きたてのナン。一皿に重なるサクラの味わい。" : "Tandoor heat, layered curries and freshly baked naan—Sakura’s table brought together in one generous dish."}
          menuHref={menuHref}
          reservationHref={reservationHref}
          menuLabel={dictionary.common.viewMenu}
          reservationLabel={dictionary.common.reserve}
        />
      ) : null}

      <section className="home-courses" aria-labelledby="home-courses-title" data-scroll-chapter="4">
        <div className="container">
          <MotionReveal className="home-scene-heading home-courses-heading">
            <p className="eyebrow">{locale === "ja" ? "コース" : "Group dining"}</p>
            <h2 id="home-courses-title">{dictionary.home.courseTitle}</h2>
            <p>{dictionary.courses.intro}</p>
          </MotionReveal>
          <CourseGrid locale={locale} dictionary={dictionary} courseData={courseData} photos={photos} limit={2} />
          <Link className="home-menu-link" href={localizePath(locale, "courses")}>{dictionary.common.viewCourses}<ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="home-atmosphere" aria-labelledby="atmosphere-title" data-scroll-chapter="5">
        <div className="container atmosphere-heading-row">
          <MotionReveal className="home-scene-heading">
            <p className="eyebrow">{locale === "ja" ? "高田馬場の夜" : "The room"}</p>
            <h2 id="atmosphere-title">{locale === "ja" ? "料理を囲む、あたたかな時間。" : "A warm table in the heart of Takadanobaba."}</h2>
          </MotionReveal>
          <MotionReveal delay={0.1}>
            <p>{dictionary.home.atmosphereBody}</p>
            <Link className="text-link" href={galleryHref}>{locale === "ja" ? "ギャラリーを見る" : "Explore the gallery"}<ArrowRight aria-hidden="true" /></Link>
          </MotionReveal>
        </div>
        <div className="container atmosphere-mosaic">
          {atmospherePhotos.slice(0, 2).map((photo, index) => (
            <Link className={`atmosphere-photo atmosphere-photo-${index + 1}`} href={galleryHref} key={photo.id} aria-label={`${locale === "ja" ? photo.altJa : photo.altEn} · ${dictionary.nav.gallery}`}>
              <Image src={photo.src} alt={locale === "ja" ? photo.altJa : photo.altEn} width={photo.width} height={photo.height} sizes="(max-width: 760px) 100vw, 50vw" loading="lazy" placeholder={photo.blurDataUrl ? "blur" : "empty"} blurDataURL={photo.blurDataUrl} />
            </Link>
          ))}
          <div className="atmosphere-film"><HeroMotionReel locale={locale} /></div>
          {atmospherePhotos.slice(2).map((photo, index) => (
            <Link className={`atmosphere-photo atmosphere-photo-${index + 3}`} href={galleryHref} key={photo.id} aria-label={`${locale === "ja" ? photo.altJa : photo.altEn} · ${dictionary.nav.gallery}`}>
              <Image src={photo.src} alt={locale === "ja" ? photo.altJa : photo.altEn} width={photo.width} height={photo.height} sizes="(max-width: 760px) 100vw, 40vw" loading="lazy" placeholder={photo.blurDataUrl ? "blur" : "empty"} blurDataURL={photo.blurDataUrl} />
            </Link>
          ))}
        </div>
      </section>

      <section className="home-access-summary" aria-labelledby="home-access-title" data-scroll-chapter="6">
        <div className="container home-access-summary-grid">
          <MotionReveal>
            <p className="eyebrow">{locale === "ja" ? "アクセス" : "Find Sakura"}</p>
            <h2 id="home-access-title">{dictionary.home.accessTitle}</h2>
            <p>{locale === "ja" ? restaurantInfo.addressJa : restaurantInfo.addressEn}</p>
          </MotionReveal>
          <MotionReveal className="home-access-summary-actions" delay={0.08}>
            <Link className="button button-gold" href={accessHref}><MapPin aria-hidden="true" />{dictionary.nav.access}</Link>
            <a className="button button-outline" href={`tel:${restaurantInfo.reservationPhone}`}><PhoneCall aria-hidden="true" />{restaurantInfo.reservationPhone}</a>
          </MotionReveal>
        </div>
      </section>

      <section className="home-reservation-finale" aria-labelledby="final-reservation-title" data-scroll-chapter="7">
        <div className="finale-light" aria-hidden="true" />
        <div className="finale-petals" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</div>
        <div className="container finale-layout">
          <MotionReveal className="finale-copy">
            <p className="eyebrow">{locale === "ja" ? "ご予約" : "Your table"}</p>
            <h2 id="final-reservation-title">{dictionary.home.finalTitle}</h2>
            <p>{dictionary.home.finalBody}</p>
            <div className="finale-actions">
              <Link className="button button-gold" href={reservationHref}>{dictionary.common.reserve}<ArrowRight aria-hidden="true" /></Link>
              <Link className="button button-outline" href={accessHref}>{dictionary.nav.access}<MapPin aria-hidden="true" /></Link>
            </div>
          </MotionReveal>
          <MotionReveal className="finale-details" delay={0.1}>
            <div><MapPin aria-hidden="true" /><span>{locale === "ja" ? restaurantInfo.addressJa : restaurantInfo.addressEn}</span></div>
            <div><Clock3 aria-hidden="true" /><span>{dictionary.common.lunch} {restaurantInfo.lunchHours}<br />{dictionary.common.dinner} {restaurantInfo.dinnerHours}</span></div>
            <a href={`tel:${restaurantInfo.reservationPhone}`}><PhoneCall aria-hidden="true" /><span>{restaurantInfo.reservationPhone}</span></a>
          </MotionReveal>
        </div>
      </section>
    </>
  );
}
