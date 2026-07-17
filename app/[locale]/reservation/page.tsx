import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld";
import { CourseGrid } from "@/components/course-grid";
import { PageHero } from "@/components/page-hero";
import { ReservationRequestForm } from "@/components/reservation-request-form";
import { courses, getCourseById } from "@/data/courses";
import { authorizedPhotos } from "@/data/photos";
import { restaurant } from "@/data/restaurant";
import { getPublishedDictionary, getPublishedPayload, getPublishedPhotos } from "@/lib/content";
import type { LocalePageProps } from "@/types";
import { isLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "en";
  const d = await getPublishedDictionary(lang);
  return pageMetadata(lang, "reservation", d.reservation.title, d.reservation.intro);
}

export default async function ReservationPage({ params, searchParams }: LocalePageProps & { searchParams: Promise<{ course?: string | string[] }> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const lang = isLocale(locale) ? locale : "en";
  const [d, restaurantInfo, courseData, photos] = await Promise.all([getPublishedDictionary(lang), getPublishedPayload("restaurant", restaurant), getPublishedPayload("courses", courses), getPublishedPhotos(authorizedPhotos)]);
  const selectedCourse = getCourseById(query.course, courseData);
  return <><BreadcrumbJsonLd locale={lang} path="reservation" label={d.reservation.title} /><PageHero eyebrow="Sakura · Reservation" title={d.reservation.title} intro={d.reservation.intro} /><section className="section reservation-stage"><div className="container"><ReservationRequestForm locale={lang} dictionary={d} restaurantInfo={restaurantInfo} courseData={courseData} initialCourseId={selectedCourse?.id} /></div></section><section className="section reservation-courses"><div className="container"><div className="section-heading"><p className="eyebrow">Sakura · Group dining</p><h2>{d.reservation.groups}</h2><p>{d.reservation.groupsBody}</p></div><CourseGrid locale={lang} dictionary={d} courseData={courseData} photos={photos} /></div></section></>;
}
