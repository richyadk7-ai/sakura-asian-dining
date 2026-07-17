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
  return <><BreadcrumbJsonLd locale={lang} path="courses" label={d.courses.title} /><PageHero eyebrow="Sakura · Courses" title={d.courses.title} intro={d.courses.intro} /><section className="section"><div className="container"><CourseGrid locale={lang} dictionary={d} courseData={courseData} photos={photos} useInternalReservationLinks /></div></section></>;
}
