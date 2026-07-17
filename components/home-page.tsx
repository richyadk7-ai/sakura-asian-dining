import { Beer, Clock3, Flame, Images, MapPin, MoonStar, Sparkles, Soup, Sprout, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CourseGrid } from "@/components/course-grid";
import { Gallery } from "@/components/gallery";
import { MotionReveal } from "@/components/motion-reveal";
import { restaurant } from "@/data/restaurant";
import { drinkItems, foodItems, lunchItems } from "@/data/menu";
import { authorizedPhotos } from "@/data/photos";
import { localizePath } from "@/lib/locale";
import type { Dictionary } from "@/locales";
import type { Course, Locale, MenuItem, RestaurantInfo, RestaurantPhoto } from "@/types";

export function HomePage({ locale, dictionary, restaurantInfo = restaurant, menuData = [...foodItems, ...drinkItems, ...lunchItems], courseData, photos = authorizedPhotos }: { locale: Locale; dictionary: Dictionary; restaurantInfo?: RestaurantInfo; menuData?: MenuItem[]; courseData?: Course[]; photos?: RestaurantPhoto[] }) {
  const foods = menuData.filter((item) => item.section === "food");
  const drinks = menuData.filter((item) => item.section === "drinks");
  const lunches = menuData.filter((item) => item.section === "lunch");
  const signatureNames = foods.filter((item) => item.recommended && item.kind !== "notice").slice(0, 10);
  const heroPhoto = photos.find((photo) => photo.featured) ?? photos.find((photo) => photo.width > photo.height);
  return (
    <>
      <section className="home-hero">
        <div className="hero-spotlight" aria-hidden="true" />
        <div className="hero-wordmark" aria-hidden="true">Sakura</div>
        <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
        <div className="container home-hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{dictionary.home.eyebrow}</p>
            <p className="hero-japanese">{restaurantInfo.nameJa}</p>
            <h1>{dictionary.home.title}</h1>
            <p className="hero-subtitle">{restaurantInfo.nameEn}</p>
            <div className="hero-actions">
              <Link className="button button-gold" href={localizePath(locale, "menu")}>{dictionary.common.viewMenu}</Link>
              <Link className="button button-outline" href={localizePath(locale, "reservation")}>{dictionary.common.reserve}</Link>
              <Link className="text-link" href={localizePath(locale, "courses")}>{dictionary.common.viewCourses}</Link>
            </div>
            <div className="hero-facts">
              <span><MapPin />{dictionary.common.location}</span>
              <span><Clock3 />{restaurantInfo.lunchHours} · {restaurantInfo.dinnerHours}</span>
            </div>
          </div>
          <div className={`hero-image-frame ${heroPhoto ? "has-photo" : ""}`} aria-label={heroPhoto ? (locale === "ja" ? heroPhoto.altJa : heroPhoto.altEn) : dictionary.common.photoPending}>
            <span className="hero-frame-label" aria-hidden="true">桜 · SAKURA</span>
            {heroPhoto ? <Image src={heroPhoto.src} alt={locale === "ja" ? heroPhoto.altJa : heroPhoto.altEn} width={heroPhoto.width} height={heroPhoto.height} sizes="(max-width: 1050px) 100vw, 55vw" priority placeholder={heroPhoto.blurDataUrl ? "blur" : "empty"} blurDataURL={heroPhoto.blurDataUrl} /> : <><span className="hero-kanji" aria-hidden="true">桜</span><div><Images aria-hidden="true" /><p>{dictionary.common.photoPending}</p><small>{dictionary.common.photoPendingBody}</small></div></>}
          </div>
        </div>
        <div className="hero-gold-line" aria-hidden="true" />
      </section>

      <section className="section intro-section">
        <div className="container split-copy">
          <MotionReveal><p className="eyebrow">01 · Sakura</p><h2>{dictionary.home.introTitle}</h2></MotionReveal>
          <MotionReveal delay={0.1}><p>{dictionary.home.introBody}</p><Link className="text-link" href={localizePath(locale, "about")}>{dictionary.common.learnMore}</Link></MotionReveal>
        </div>
      </section>

      <section className="section signature-section">
        <div className="container">
          <MotionReveal className="section-heading"><p className="eyebrow">02 · Flavours</p><h2>{dictionary.home.signatures}</h2><p>{dictionary.home.signaturesBody}</p></MotionReveal>
          <div className="signature-grid">
            <Feature icon={<Flame />} title={locale === "ja" ? "窯焼き" : "Tandoor fire"} body={locale === "ja" ? "タンドリーチキン、ティッカ、カバブ、海老を香ばしく。" : "Tandoori chicken, tikka, kebabs and prawns cooked over intense heat."} />
            <Feature icon={<Soup />} title={locale === "ja" ? "豊富なカレー" : "Curries for every mood"} body={locale === "ja" ? "野菜、チキン、マトン、シーフードを幅広く。" : "Vegetable, chicken, mutton and seafood curries across a broad selection."} />
            <Feature icon={<Sprout />} title={locale === "ja" ? "アジアの定番" : "Asian comfort dishes"} body={locale === "ja" ? "モモ、チョウメン、ガパオ、フォー、ナシゴレン。" : "Momo, chow mein, gapao, pho and nasi goreng alongside Indian favorites."} />
          </div>
        </div>
      </section>

      <section className="food-marquee" aria-label={dictionary.home.signatures}>
        <div>{[...signatureNames, ...signatureNames].map((item, index) => <span key={`${item.id}-${index}`}><Sparkles />{locale === "ja" ? item.nameJa : item.nameEn}</span>)}</div>
      </section>

      <section className="section menu-preview-section">
        <div className="container">
          <MotionReveal className="section-heading"><p className="eyebrow">03 · Menu</p><h2>{dictionary.home.menuPreview}</h2></MotionReveal>
          <div className="menu-category-grid">
            <CategoryCard icon={<UtensilsCrossed />} count={foods.length} title={dictionary.menu.food} href={localizePath(locale, "menu")} />
            <CategoryCard icon={<Beer />} count={drinks.length} title={dictionary.menu.drinks} href={localizePath(locale, "menu")} />
            <CategoryCard icon={<MoonStar />} count={lunches.length} title={dictionary.menu.lunch} href={localizePath(locale, "menu")} />
          </div>
        </div>
      </section>

      <section className="section courses-section">
        <div className="container">
          <MotionReveal className="section-heading"><p className="eyebrow">04 · Courses</p><h2>{dictionary.home.courseTitle}</h2></MotionReveal>
          <CourseGrid locale={locale} dictionary={dictionary} limit={3} courseData={courseData} photos={photos} />
          <div className="center-action"><Link className="button button-outline" href={localizePath(locale, "courses")}>{dictionary.common.viewCourses}</Link></div>
        </div>
      </section>

      <StorySection number="05" icon={<Flame />} title={dictionary.home.tandoorTitle} body={dictionary.home.tandoorBody} accent="tandoor" />
      <StorySection number="06" icon={<Soup />} title={dictionary.home.lunchTitle} body={dictionary.home.lunchBody} accent="lunch" cta={{ label: dictionary.common.viewMenu, href: localizePath(locale, "menu") }} />
      <StorySection number="07" icon={<Beer />} title={dictionary.home.drinksTitle} body={dictionary.home.drinksBody} accent="drinks" />
      <StorySection number="08" icon={<MoonStar />} title={dictionary.home.atmosphereTitle} body={dictionary.home.atmosphereBody} accent="atmosphere" />

      <section className="section gallery-preview-section">
        <div className="container">
          <MotionReveal className="section-heading"><p className="eyebrow">09 · Gallery</p><h2>{dictionary.home.galleryTitle}</h2></MotionReveal>
          <Gallery locale={locale} dictionary={dictionary} preview photoData={photos} />
        </div>
      </section>

      <section className="section home-access">
        <div className="container home-access-grid">
          <MotionReveal><p className="eyebrow">10 · Access</p><h2>{dictionary.home.accessTitle}</h2><p>{locale === "ja" ? restaurantInfo.addressJa : restaurantInfo.addressEn}</p><Link className="button button-outline" href={localizePath(locale, "access")}>{dictionary.nav.access}</Link></MotionReveal>
          <div className="hours-card"><MapPin /><strong>{restaurantInfo.stationWalkMinutes} min</strong><span>Takadanobaba Station</span><Clock3 /><strong>{restaurantInfo.lunchHours}</strong><span>{dictionary.common.lunch}</span><Clock3 /><strong>{restaurantInfo.dinnerHours}</strong><span>{dictionary.common.dinner}</span></div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container"><p className="eyebrow">11 · Reservation</p><h2>{dictionary.home.finalTitle}</h2><p>{dictionary.home.finalBody}</p><Link className="button button-gold" href={localizePath(locale, "reservation")}>{dictionary.common.reserve}</Link></div>
      </section>
    </>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return <MotionReveal className="feature-card"><div>{icon}</div><h3>{title}</h3><p>{body}</p></MotionReveal>;
}

function CategoryCard({ icon, count, title, href }: { icon: React.ReactNode; count: number; title: string; href: string }) {
  return <Link className="category-card" href={href}><span>{icon}</span><div><small>{count} entries</small><h3>{title}</h3></div><b>↗</b></Link>;
}

function StorySection({ number, icon, title, body, accent, cta }: { number: string; icon: React.ReactNode; title: string; body: string; accent: string; cta?: { label: string; href: string } }) {
  return (
    <section className={`section story-section story-${accent}`}>
      <div className="container story-grid">
        <MotionReveal className="story-art"><span aria-hidden="true">{icon}</span><b>{number}</b></MotionReveal>
        <MotionReveal className="story-copy"><p className="eyebrow">{number} · Sakura</p><h2>{title}</h2><p>{body}</p>{cta ? <Link className="text-link" href={cta.href}>{cta.label}</Link> : null}</MotionReveal>
      </div>
    </section>
  );
}
