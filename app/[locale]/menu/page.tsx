import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld";
import { MenuExplorer } from "@/components/menu-explorer";
import { PageHero } from "@/components/page-hero";
import { courses } from "@/data/courses";
import { allMenuItems } from "@/data/menu";
import { authorizedPhotos } from "@/data/photos";
import { getPublishedDictionary, getPublishedPayload, getPublishedPhotos } from "@/lib/content";
import type { LocalePageProps } from "@/types";
import { isLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "en";
  const d = await getPublishedDictionary(lang);
  return pageMetadata(lang, "menu", d.menu.title, d.menu.intro);
}

export default async function MenuPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "en";
  const [d, items, courseData, photos] = await Promise.all([getPublishedDictionary(lang), getPublishedPayload("menu", allMenuItems), getPublishedPayload("courses", courses), getPublishedPhotos(authorizedPhotos)]);
  return <><BreadcrumbJsonLd locale={lang} path="menu" label={d.menu.title} /><PageHero eyebrow="Sakura · Menu" title={d.menu.title} intro={d.menu.intro} /><section className="section"><div className="container"><MenuExplorer locale={lang} dictionary={d} items={items} courseData={courseData} photos={photos} /></div></section></>;
}
