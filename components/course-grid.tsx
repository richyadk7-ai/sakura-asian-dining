import { ChevronDown, Clock3, Images, Infinity as InfinityIcon, Utensils } from "lucide-react";
import Image from "next/image";
import { ExternalLink } from "@/components/external-link";
import { courseDetailsById } from "@/data/course-details";
import { courses } from "@/data/courses";
import { authorizedPhotos } from "@/data/photos";
import type { Dictionary } from "@/locales";
import type { Course, Locale, RestaurantPhoto } from "@/types";

export function CourseGrid({ locale, dictionary, limit, courseData = courses, photos = authorizedPhotos, showDetails = false }: { locale: Locale; dictionary: Dictionary; limit?: number; courseData?: Course[]; photos?: RestaurantPhoto[]; showDetails?: boolean }) {
  const visible = courseData.filter((course) => course.enabled).slice(0, limit);
  return (
    <div className="course-grid">
      {visible.map((course) => {
        const photo = course.imageId ? photos.find((item) => item.id === course.imageId && item.authorized && !item.excluded) : undefined;
        const details = course.details ?? courseDetailsById[course.id];
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
            {showDetails && details ? (
              <details className="course-details" data-course-details={course.id}>
                <summary>{dictionary.courses.viewDetails}<ChevronDown aria-hidden="true" /></summary>
                <div className="course-details-body">
                  {details.menuItems.length ? (
                    <section className="course-detail-section">
                      <h3>{dictionary.courses.courseContents}</h3>
                      <ul className="course-detail-menu">
                        {details.menuItems.map((menuItem) => (
                          <li key={`${course.id}-${menuItem.nameEn}`}>
                            <strong>{locale === "ja" ? menuItem.nameJa : menuItem.nameEn}</strong>
                            {(locale === "ja" ? menuItem.descriptionJa : menuItem.descriptionEn) ? <span>{locale === "ja" ? menuItem.descriptionJa : menuItem.descriptionEn}</span> : null}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  <CourseDrinkDetails title={dictionary.courses.drinkPlan} groups={details.drinkGroups} locale={locale} />
                  {details.premiumDrinkUpgrade ? (
                    <section className="course-detail-section course-premium-upgrade">
                      <h3>{dictionary.courses.premiumUpgrade} <span>{details.premiumDrinkUpgrade.price}</span></h3>
                      <p>{locale === "ja" ? details.premiumDrinkUpgrade.descriptionJa : details.premiumDrinkUpgrade.descriptionEn}</p>
                      <CourseDrinkGroups groups={details.premiumDrinkUpgrade.groups} locale={locale} />
                    </section>
                  ) : null}
                  <section className="course-detail-section course-conditions">
                    <h3>{dictionary.courses.conditions}</h3>
                    <ul>{(locale === "ja" ? details.notesJa : details.notesEn).map((note) => <li key={note}>{note}</li>)}</ul>
                  </section>
                </div>
              </details>
            ) : null}
            <div className="course-card-footer">
              <div className="course-price">{course.previousPrice ? <del>{course.previousPrice}</del> : null}<strong>{course.price}</strong><small>{dictionary.common.taxIncluded}</small></div>
              <ExternalLink className="text-link" href={`/${locale}/reservation?course=${encodeURIComponent(course.id)}`} showIcon aria-label={`${dictionary.courses.viewReserve}: ${locale === "ja" ? course.nameJa : course.nameEn}`}>
                {dictionary.courses.viewReserve}
              </ExternalLink>
            </div>
          </div>
        </article>
      )})}
    </div>
  );
}

function CourseDrinkDetails({ title, groups, locale }: { title: string; groups: NonNullable<Course["details"]>["drinkGroups"]; locale: Locale }) {
  return <section className="course-detail-section"><h3>{title}</h3><CourseDrinkGroups groups={groups} locale={locale} /></section>;
}

function CourseDrinkGroups({ groups, locale }: { groups: NonNullable<Course["details"]>["drinkGroups"]; locale: Locale }) {
  return (
    <div className="course-drink-groups">
      {groups.map((group) => <div key={group.nameEn}><h4>{locale === "ja" ? group.nameJa : group.nameEn}</h4><p>{(locale === "ja" ? group.itemsJa : group.itemsEn).join(" · ")}</p></div>)}
    </div>
  );
}
