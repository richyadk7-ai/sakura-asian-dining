import { Clock3, MapPin, Phone, TrainFront } from "lucide-react";
import { AccessTools } from "@/components/access-tools";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld";
import { PageHero } from "@/components/page-hero";
import { restaurant, trainLines } from "@/data/restaurant";
import { getPublishedDictionary, getPublishedPayload } from "@/lib/content";
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
  const [d, restaurantInfo] = await Promise.all([getPublishedDictionary(lang), getPublishedPayload("restaurant", restaurant)]);
  return <><BreadcrumbJsonLd locale={lang} path="access" label={d.access.title} /><PageHero eyebrow="Sakura · Takadanobaba" title={d.access.title} intro={d.access.intro} /><section className="section"><div className="container access-layout"><div><AccessTools locale={lang} dictionary={d} restaurantInfo={restaurantInfo} /><div className="access-detail-grid"><article><Clock3 /><h2>{d.access.hours}</h2><p>{d.common.lunch} {restaurantInfo.lunchHours}<br />{d.common.dinner} {restaurantInfo.dinnerHours}<br />{d.common.openDaily}</p></article><article><TrainFront /><h2>{d.access.lines}</h2><p>{trainLines.join(" · ")}<br />{restaurantInfo.stationWalkMinutes} {lang === "ja" ? "分" : "minutes"}</p></article><article><Phone /><h2>{d.access.phone}</h2><p><a href={`tel:${restaurantInfo.reservationPhone}`}>{restaurantInfo.reservationPhone}</a><br />{d.access.directPhone}: <a href={`tel:${restaurantInfo.directPhone}`}>{restaurantInfo.directPhone}</a></p></article><article><MapPin /><h2>{lang === "ja" ? "駐車場" : "Parking"}</h2><p>{d.access.parking}</p></article></div></div><iframe className="map-frame" title={d.access.mapTitle} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=%E6%9D%B1%E4%BA%AC%E9%83%BD%E6%96%B0%E5%AE%BF%E5%8C%BA%E9%AB%98%E7%94%B0%E9%A6%AC%E5%A0%B43-22-5%20%E7%9B%B8%E6%B2%A2%E3%83%93%E3%83%AB&output=embed" /></div></section></>;
}
