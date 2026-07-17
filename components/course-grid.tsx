import { Clock3, Images, Infinity as InfinityIcon, Utensils } from "lucide-react";
import Image from "next/image";
import { ExternalLink } from "@/components/external-link";
import { courses } from "@/data/courses";
import { authorizedPhotos } from "@/data/photos";
import type { Dictionary } from "@/locales";
import type { Course, Locale, RestaurantPhoto } from "@/types";

export function CourseGrid({ locale, dictionary, limit, courseData = courses, photos = authorizedPhotos }: { locale: Locale; dictionary: Dictionary; limit?: number; courseData?: Course[]; photos?: RestaurantPhoto[] }) {
  const visible = courseData.filter((course) => course.enabled).slice(0, limit);
  return (
    <div className="course-grid">
      {visible.map((course) => {
        const photo = course.imageId ? photos.find((item) => item.id === course.imageId && item.authorized && !item.excluded) : undefined;
        return (
        <article className="course-card" key={course.id} data-course-id={course.id}>
          {photo ? <div className="course-image"><Image src={photo.src} alt={locale === "ja" ? photo.altJa : photo.altEn} width={photo.width} height={photo.height} sizes="(max-width: 1050px) 100vw, 50vw" placeholder={photo.blurDataUrl ? "blur" : "empty"} blurDataURL={photo.blurDataUrl} /></div> : <div className="course-image-pending" aria-label={dictionary.courses.imagePending}><Images aria-hidden="true" /><span>{dictionary.courses.imagePending}</span></div>}
          <div className="course-card-body">
            <div className="course-badges">
              {course.allYouCanEat ? <span><InfinityIcon size={14} />{dictionary.courses.allEat}</span> : null}
              {course.allYouCanDrink ? <span><InfinityIcon size={14} />{dictionary.courses.allDrink}</span> : null}
            </div>
            <p className="course-japanese">{course.nameJa}</p>
            <h2>{course.nameEn}</h2>
            <p>{locale === "ja" ? course.summaryJa : course.summaryEn}</p>
            <dl className="course-facts">
              <div><Clock3 aria-hidden="true" /><dt>{course.durationMinutes}</dt><dd>{dictionary.courses.minutes}</dd></div>
              {course.itemCount ? <div><Utensils aria-hidden="true" /><dt>{course.itemCount}</dt><dd>{dictionary.courses.dishes}</dd></div> : null}
            </dl>
            <div className="course-card-footer">
              <div className="course-price">{course.previousPrice ? <del>{course.previousPrice}</del> : null}<strong>{course.price}</strong><small>{dictionary.common.taxIncluded}</small></div>
              <ExternalLink className="text-link" href={course.tabelogUrl} showIcon aria-label={`${dictionary.courses.viewReserve}: ${locale === "ja" ? course.nameJa : course.nameEn}`}>
                {dictionary.courses.viewReserve}
              </ExternalLink>
            </div>
          </div>
        </article>
      )})}
    </div>
  );
}
