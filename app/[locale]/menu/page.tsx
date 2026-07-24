import Image from "next/image";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld";
import { MenuExplorer } from "@/components/menu-explorer";
import { MotionReveal } from "@/components/motion-reveal";
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
  const heroPhoto = photos.find((photo) => photo.id === "food-029") ?? photos.find((photo) => photo.category === "food");

  return (
    <>
      <BreadcrumbJsonLd locale={lang} path="menu" label={d.menu.title} />
      <PageHero
        locale={lang}
        variant="menu"
        eyebrow={d.menu.heroEyebrow}
        title={d.menu.heroTitle}
        intro={d.menu.heroIntro}
        photo={heroPhoto}
      />
      <section className="menu-curry-feature" aria-labelledby="menu-curry-feature-title">
        <MotionReveal className="menu-curry-feature-frame">
          <Image
            src="/images/features/curries-from-the-fire.png"
            alt={d.menu.curryFeatureAlt}
            width={1672}
            height={941}
            sizes="(max-width: 760px) 100vw, 94vw"
            quality={92}
          />
          <div className="menu-curry-feature-shade" aria-hidden="true" />
          <p id="menu-curry-feature-title">{d.menu.curryFeature}</p>
        </MotionReveal>
      </section>
      <section className="section">
        <div className="container">
          <MenuExplorer locale={lang} dictionary={d} items={items} courseData={courseData} photos={photos} />
        </div>
      </section>
    </>
  );
}
