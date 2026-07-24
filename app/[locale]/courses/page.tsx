import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld";
import { CourseGrid } from "@/components/course-grid";
import { PageHero } from "@/components/page-hero";
import { courses } from "@/data/courses";
import { authorizedPhotos } from "@/data/photos";
import { getPublishedDictionary, getPublishedPayload, getPublishedPhotos } from "@/lib/content";
import type { LocalePageProps } from "@/types";
import { isLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "en";
  const d = await getPublishedDictionary(lang);
  return pageMetadata(lang, "courses", d.courses.title, d.courses.intro);
}

export default async function CoursesPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "en";
  const [d, courseData, photos] = await Promise.all([getPublishedDictionary(lang), getPublishedPayload("courses", courses), getPublishedPhotos(authorizedPhotos)]);
  const heroPhoto = photos.find((photo) => photo.id === "food-013") ?? photos.find((photo) => photo.category === "food");

  return (
    <>
      <BreadcrumbJsonLd locale={lang} path="courses" label={d.courses.title} />
      <PageHero
        locale={lang}
        variant="courses"
        eyebrow={d.courses.heroEyebrow}
        title={d.courses.heroTitle}
        intro={d.courses.heroIntro}
        photo={heroPhoto}
      />
      <section className="section">
        <div className="container">
          <CourseGrid locale={lang} dictionary={d} courseData={courseData} photos={photos} showDetails />
        </div>
      </section>
    </>
  );
}
