import { Clock3, MapPin, Phone, TrainFront } from "lucide-react";
import { AccessTools } from "@/components/access-tools";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld";
import { PageHero } from "@/components/page-hero";
import { authorizedPhotos } from "@/data/photos";
import { restaurant, restaurantConfig } from "@/data/restaurant";
import { getPublishedDictionary, getPublishedPayload, getPublishedPhotos } from "@/lib/content";
import type { LocalePageProps } from "@/types";
import { isLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "en";
  const d = await getPublishedDictionary(lang);
  return pageMetadata(lang, "access", d.access.title, d.access.intro);
}

export default async function AccessPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "en";
  const [d, restaurantInfo, photos] = await Promise.all([
    getPublishedDictionary(lang),
    getPublishedPayload("restaurant", restaurant),
    getPublishedPhotos(authorizedPhotos),
  ]);
  const stationName = lang === "ja" ? restaurantConfig.location.stationNameJa : restaurantConfig.location.stationNameEn;
  const heroPhoto = photos.find((photo) => photo.id === "exterior-001") ?? photos.find((photo) => photo.category === "exterior");

  return (
    <>
      <BreadcrumbJsonLd locale={lang} path="access" label={d.access.title} />
      <PageHero
        locale={lang}
        variant="access"
        eyebrow={d.access.heroEyebrow}
        title={d.access.heroTitle}
        intro={d.access.heroIntro}
        photo={heroPhoto}
      />
      <section className="section">
        <div className="container access-layout">
          <div>
            <AccessTools locale={lang} dictionary={d} restaurantInfo={restaurantInfo} />
            <div className="access-detail-grid">
              <article><Clock3 /><h2>{d.access.hours}</h2><p>{d.common.lunch} {restaurantInfo.lunchHours}<br />{d.common.dinner} {restaurantInfo.dinnerHours}<br />{d.common.openDaily}</p></article>
              <article><TrainFront /><h2>{d.access.lines}</h2><p>{stationName}<br />{restaurantConfig.location.trainLines.join(" · ")}<br />{restaurantInfo.stationWalkMinutes} {lang === "ja" ? "分" : "minutes"}</p></article>
              <article><Phone /><h2>{d.access.phone}</h2><p>{d.access.phone}: <a href={`tel:${restaurantInfo.reservationPhone}`}>{restaurantInfo.reservationPhone}</a><br />{d.access.directPhone}: <a href={`tel:${restaurantInfo.directPhone}`}>{restaurantInfo.directPhone}</a></p></article>
              <article><MapPin /><h2>{lang === "ja" ? "駐車場" : "Parking"}</h2><p>{d.access.parking}</p></article>
            </div>
          </div>
          <iframe className="map-frame" title={d.access.mapTitle} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={restaurantConfig.location.mapsEmbedUrl} />
        </div>
      </section>
    </>
  );
}
