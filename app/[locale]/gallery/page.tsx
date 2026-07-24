import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld";
import { Gallery } from "@/components/gallery";
import { PageHero } from "@/components/page-hero";
import { authorizedPhotos } from "@/data/photos";
import { getPublishedDictionary, getPublishedPhotos } from "@/lib/content";
import type { LocalePageProps } from "@/types";
import { isLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "en";
  const d = await getPublishedDictionary(lang);
  return pageMetadata(lang, "gallery", d.gallery.title, d.gallery.intro);
}

export default async function GalleryPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "en";
  const [d, photos] = await Promise.all([getPublishedDictionary(lang), getPublishedPhotos(authorizedPhotos)]);
  const heroPhoto = photos.find((photo) => photo.id === "interior-003") ?? photos[0];
  const secondaryPhoto = photos.find((photo) => photo.id === "drinks-001");

  return (
    <>
      <BreadcrumbJsonLd locale={lang} path="gallery" label={d.gallery.title} />
      <PageHero
        locale={lang}
        variant="gallery"
        eyebrow={d.gallery.heroEyebrow}
        title={d.gallery.heroTitle}
        intro={d.gallery.heroIntro}
        photo={heroPhoto}
        secondaryPhoto={secondaryPhoto}
      />
      <section className="section">
        <div className="container">
          <Gallery locale={lang} dictionary={d} photoData={photos} />
        </div>
      </section>
    </>
  );
}
