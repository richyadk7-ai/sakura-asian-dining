"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Flame, Images, Search, Sparkles, Sprout, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CourseGrid } from "@/components/course-grid";
import { ExternalLink } from "@/components/external-link";
import { allMenuItems, menuPhotoEntries } from "@/data/menu";
import { courses } from "@/data/courses";
import { authorizedPhotos } from "@/data/photos";
import { TABELOG_GALLERY_URL } from "@/lib/constants";
import type { Dictionary } from "@/locales";
import type { Course, Locale, MenuItem, MenuSection, RestaurantPhoto } from "@/types";

const sections: MenuSection[] = ["food", "courses", "drinks", "lunch", "photos"];

export function MenuExplorer({ locale, dictionary, items = allMenuItems, courseData = courses, photos = authorizedPhotos }: { locale: Locale; dictionary: Dictionary; items?: MenuItem[]; courseData?: Course[]; photos?: RestaurantPhoto[] }) {
  const [section, setSection] = useState<MenuSection>("food");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [vegetarian, setVegetarian] = useState(false);
  const [spicy, setSpicy] = useState(false);
  const [recommended, setRecommended] = useState(false);
  const reduce = useReducedMotion();

  const labels: Record<MenuSection, string> = {
    food: dictionary.menu.food,
    courses: dictionary.menu.courses,
    drinks: dictionary.menu.drinks,
    lunch: dictionary.menu.lunch,
    photos: dictionary.menu.photos,
  };

  const sectionItems = useMemo(() => items.filter((item) => item.section === section), [items, section]);
  const categories = useMemo(() => Array.from(new Set(sectionItems.map((item) => locale === "ja" ? item.categoryJa : item.categoryEn))), [locale, sectionItems]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return sectionItems.filter((item) => {
      const itemCategory = locale === "ja" ? item.categoryJa : item.categoryEn;
      const matchesSearch = !normalized || `${item.nameEn} ${item.nameJa} ${item.categoryEn} ${item.categoryJa}`.toLocaleLowerCase().includes(normalized);
      return item.enabled && matchesSearch && (category === "all" || itemCategory === category) && (!vegetarian || item.vegetarian === true) && (!spicy || item.spicy === true) && (!recommended || item.recommended === true);
    });
  }, [category, locale, query, recommended, sectionItems, spicy, vegetarian]);

  const reset = () => {
    setQuery("");
    setCategory("all");
    setVegetarian(false);
    setSpicy(false);
    setRecommended(false);
  };

  const changeSection = (next: MenuSection) => {
    setSection(next);
    reset();
  };

  return (
    <div className="menu-explorer">
      <div className="menu-tabs" role="tablist" aria-label={dictionary.menu.title}>
        {sections.map((item) => (
          <button key={item} role="tab" aria-selected={section === item} className={section === item ? "active" : ""} onClick={() => changeSection(item)}>
            {labels[item]}
          </button>
        ))}
      </div>

      {section === "courses" ? <div className="menu-section-content"><CourseGrid locale={locale} dictionary={dictionary} courseData={courseData} photos={photos} /></div> : null}

      {section === "photos" ? (
        <div className="gallery-pending menu-photo-pending">
          <Images aria-hidden="true" />
          <p className="eyebrow">{menuPhotoEntries.length} {dictionary.menu.itemCount}</p>
          <h2>{dictionary.menu.photoPendingTitle}</h2>
          <p>{dictionary.menu.photoPendingBody}</p>
          <ExternalLink className="button button-outline" href={TABELOG_GALLERY_URL} showIcon>{dictionary.gallery.sourceLink}</ExternalLink>
        </div>
      ) : null}

      {section === "food" || section === "drinks" || section === "lunch" ? (
        <div className="menu-section-content">
          <div className="menu-tools">
            <label className="search-field">
              <Search aria-hidden="true" />
              <span className="sr-only">{dictionary.menu.search}</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={dictionary.menu.searchPlaceholder} />
              {query ? <button type="button" onClick={() => setQuery("")} aria-label={dictionary.menu.clear}><X /></button> : null}
            </label>
            <label className="category-field">
              <span className="sr-only">{dictionary.menu.allCategories}</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="all">{dictionary.menu.allCategories}</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <div className="filter-pills" aria-label="Menu filters">
              {section === "food" ? (
                <>
                  <FilterButton active={vegetarian} onClick={() => setVegetarian(!vegetarian)} icon={<Sprout />} label={dictionary.menu.vegetarian} />
                  <FilterButton active={spicy} onClick={() => setSpicy(!spicy)} icon={<Flame />} label={dictionary.menu.spicy} />
                  <FilterButton active={recommended} onClick={() => setRecommended(!recommended)} icon={<Sparkles />} label={dictionary.menu.recommended} />
                </>
              ) : null}
            </div>
          </div>

          <div className="menu-results-meta"><span>{filtered.length} {dictionary.menu.itemCount}</span><button type="button" onClick={reset}>{dictionary.menu.clear}</button></div>
          <AnimatePresence mode="popLayout">
            {filtered.length ? (
              <motion.div className="menu-grid" layout>
                {filtered.map((item) => (
                  <motion.article
                    className={`menu-item ${item.kind === "notice" ? "menu-notice" : ""}`}
                    key={item.id}
                    layout
                    initial={reduce ? false : { opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                  >
                    <div>
                      <p className="menu-item-japanese">{item.nameJa}</p>
                      <h2>{item.nameEn}</h2>
                    </div>
                    <div className="menu-item-price">{item.price}</div>
                    <div className="menu-item-meta">
                      <span>{locale === "ja" ? item.categoryJa : item.categoryEn}</span>
                      {item.vegetarian ? <Sprout aria-label={dictionary.menu.vegetarian} /> : null}
                      {item.spicy ? <Flame aria-label={dictionary.menu.spicy} /> : null}
                      {item.recommended ? <Sparkles aria-label={dictionary.menu.recommended} /> : null}
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            ) : <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{dictionary.menu.noResults}</motion.div>}
          </AnimatePresence>
          <p className="source-notice"><Check aria-hidden="true" />{dictionary.common.sourceNotice}</p>
        </div>
      ) : null}
    </div>
  );
}

function FilterButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button className={active ? "active" : ""} type="button" aria-pressed={active} onClick={onClick}>{icon}{label}</button>;
}
