"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Flame, Search, Sparkles, Sprout, X } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CourseGrid } from "@/components/course-grid";
import { allMenuItems } from "@/data/menu";
import { courses } from "@/data/courses";
import { authorizedPhotos } from "@/data/photos";
import type { Dictionary } from "@/locales";
import type { Course, Locale, MenuItem, MenuSection, RestaurantPhoto } from "@/types";

type VisibleMenuSection = Exclude<MenuSection, "photos">;

const sections: VisibleMenuSection[] = ["food", "courses", "drinks", "lunch"];
const featuredPairings = [
  ["food-032", "food-030"],
  ["food-073", "food-029"],
  ["food-027", "food-034"],
  ["food-049", "food-022"],
  ["food-044", "food-031"],
  ["food-088", "food-028"],
] as const;

export function MenuExplorer({ locale, dictionary, items = allMenuItems, courseData = courses, photos = authorizedPhotos }: { locale: Locale; dictionary: Dictionary; items?: MenuItem[]; courseData?: Course[]; photos?: RestaurantPhoto[] }) {
  const searchParams = useSearchParams();
  const requestedSection = searchParams?.get("section");
  const [section, setSection] = useState<VisibleMenuSection>(() => requestedSection && sections.includes(requestedSection as VisibleMenuSection) ? requestedSection as VisibleMenuSection : "food");
  const [query, setQuery] = useState(() => searchParams?.get("q") ?? "");
  const [category, setCategory] = useState(() => searchParams?.get("category") ?? "all");
  const [vegetarian, setVegetarian] = useState(() => searchParams?.get("vegetarian") === "1");
  const [spicy, setSpicy] = useState(() => searchParams?.get("spicy") === "1");
  const [recommended, setRecommended] = useState(() => searchParams?.get("recommended") === "1");
  const reduce = useReducedMotion();

  const labels: Record<VisibleMenuSection, string> = {
    food: dictionary.menu.food,
    courses: dictionary.menu.courses,
    drinks: dictionary.menu.drinks,
    lunch: dictionary.menu.lunch,
  };

  const sectionItems = useMemo(() => items.filter((item) => item.section === section), [items, section]);
  const categories = useMemo(() => Array.from(new Set(sectionItems.map((item) => locale === "ja" ? item.categoryJa : item.categoryEn))), [locale, sectionItems]);
  const activeCategory = category === "all" || categories.includes(category) ? category : "all";

  useEffect(() => {
    const url = new URL(window.location.href);
    const setOrDelete = (key: string, value: string, defaultValue = "") => value && value !== defaultValue ? url.searchParams.set(key, value) : url.searchParams.delete(key);
    setOrDelete("section", section, "food");
    setOrDelete("q", query.trim());
    setOrDelete("category", activeCategory, "all");
    setOrDelete("vegetarian", vegetarian ? "1" : "");
    setOrDelete("spicy", spicy ? "1" : "");
    setOrDelete("recommended", recommended ? "1" : "");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [activeCategory, query, recommended, section, spicy, vegetarian]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return sectionItems.filter((item) => {
      const itemCategory = locale === "ja" ? item.categoryJa : item.categoryEn;
      const matchesSearch = !normalized || `${item.nameEn} ${item.nameJa} ${item.categoryEn} ${item.categoryJa}`.toLocaleLowerCase().includes(normalized);
      return item.enabled && matchesSearch && (activeCategory === "all" || itemCategory === activeCategory) && (!vegetarian || item.vegetarian === true) && (!spicy || item.spicy === true) && (!recommended || item.recommended === true);
    });
  }, [activeCategory, locale, query, recommended, sectionItems, spicy, vegetarian]);
  const featured = useMemo(() => featuredPairings.flatMap(([itemId, photoId]) => {
    const item = items.find((candidate) => candidate.id === itemId && candidate.enabled);
    const photo = photos.find((candidate) => candidate.id === photoId && candidate.authorized && !candidate.excluded);
    return item && photo ? [{ item, photo }] : [];
  }), [items, photos]);

  const reset = () => {
    setQuery("");
    setCategory("all");
    setVegetarian(false);
    setSpicy(false);
    setRecommended(false);
  };

  const changeSection = (next: VisibleMenuSection) => {
    setSection(next);
    reset();
  };

  return (
    <div className="menu-explorer">
      {featured.length ? (
        <section className="menu-featured" aria-labelledby="menu-featured-title">
          <div className="menu-featured-heading"><p className="eyebrow">{locale === "ja" ? "サクラのおすすめ" : "Sakura favourites"}</p><h2 id="menu-featured-title">{locale === "ja" ? "まず味わってほしい一皿" : "A first taste of Sakura"}</h2></div>
          <div className="menu-featured-grid">
            {featured.map(({ item, photo }) => (
              <button key={item.id} type="button" onClick={() => { setSection("food"); setQuery(locale === "ja" ? item.nameJa : item.nameEn); setCategory("all"); document.querySelector(".menu-tabs")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }}>
                <Image src={photo.src} alt={locale === "ja" ? photo.altJa : photo.altEn} width={photo.width} height={photo.height} sizes="(max-width: 560px) calc(100vw - 28px), (max-width: 900px) 50vw, (max-width: 1366px) 33vw, 25vw" loading="lazy" placeholder={photo.blurDataUrl ? "blur" : "empty"} blurDataURL={photo.blurDataUrl} />
                <span><small>{locale === "ja" ? item.nameEn : item.nameJa}</small><strong>{locale === "ja" ? item.nameJa : item.nameEn}</strong><b>{item.price}</b></span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
      <div className="menu-tabs" role="tablist" aria-label={dictionary.menu.title}>
        {sections.map((item) => (
          <button key={item} role="tab" aria-selected={section === item} className={section === item ? "active" : ""} onClick={() => changeSection(item)}>
            {labels[item]}
          </button>
        ))}
      </div>

      {section === "courses" ? <div className="menu-section-content"><CourseGrid locale={locale} dictionary={dictionary} courseData={courseData} photos={photos} /></div> : null}

      {section === "food" || section === "drinks" || section === "lunch" ? (
        <div className="menu-section-content">
          <div className="menu-tools">
            <label className="search-field">
              <Search aria-hidden="true" />
              <span className="sr-only">{dictionary.menu.search}</span>
              <input aria-label={dictionary.menu.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={dictionary.menu.searchPlaceholder} />
              {query ? <button type="button" onClick={() => setQuery("")} aria-label={dictionary.menu.clear}><X /></button> : null}
            </label>
            <label className="category-field">
              <span className="sr-only">{dictionary.menu.allCategories}</span>
              <select value={activeCategory} onChange={(event) => setCategory(event.target.value)}>
                <option value="all">{dictionary.menu.allCategories}</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <div className="filter-pills" aria-label={locale === "ja" ? "メニュー絞り込み" : "Menu filters"}>
              {section === "food" ? (
                <>
                  <FilterButton active={vegetarian} onClick={() => setVegetarian(!vegetarian)} icon={<Sprout />} label={dictionary.menu.vegetarian} />
                  <FilterButton active={spicy} onClick={() => setSpicy(!spicy)} icon={<Flame />} label={dictionary.menu.spicy} />
                  <FilterButton active={recommended} onClick={() => setRecommended(!recommended)} icon={<Sparkles />} label={dictionary.menu.recommended} />
                </>
              ) : null}
            </div>
          </div>

          <p className="menu-allergy-notice" role="note"><Check aria-hidden="true" />{dictionary.menu.ingredientNotice}</p>

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
                    <div className="menu-item-meta" aria-label={locale === "ja" ? "料理情報" : "Dish information"}>
                      {item.vegetarian ? <Sprout aria-label={dictionary.menu.vegetarian} /> : null}
                      {item.spicy ? <Flame aria-label={dictionary.menu.spicy} /> : null}
                      {item.recommended ? <Sparkles aria-label={dictionary.menu.recommended} /> : null}
                    </div>
                    {item.kind !== "notice" && (locale === "ja" ? item.descriptionJa : item.descriptionEn) ? (
                      <details className="menu-item-details">
                        <summary>
                          <span>{locale === "ja" ? "詳細" : "Details"}</span>
                          <ChevronDown aria-hidden="true" />
                        </summary>
                        <div>
                          <p>{locale === "ja" ? item.descriptionJa : item.descriptionEn}</p>
                        </div>
                      </details>
                    ) : null}
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
