"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { authorizedPhotos } from "@/data/photos";
import type { Dictionary } from "@/locales";
import type { Locale, RestaurantPhotoCategory } from "@/types";

type Filter = "all" | RestaurantPhotoCategory;

export function Gallery({ locale, dictionary, preview = false, photoData = authorizedPhotos }: { locale: Locale; dictionary: Dictionary; preview?: boolean; photoData?: typeof authorizedPhotos }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(preview ? 8 : 12);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const reduce = useReducedMotion();
  const labels: Record<Filter, string> = {
    all: dictionary.gallery.all,
    food: dictionary.gallery.food,
    drinks: dictionary.gallery.drinks,
    interior: dictionary.gallery.interior,
    exterior: dictionary.gallery.exterior,
    menu: dictionary.gallery.menu,
    course: dictionary.gallery.course,
  };
  const usablePhotos = photoData.filter((photo) => photo.authorized && !photo.excluded);
  const categories: Filter[] = (["all", "food", "drinks", "interior", "exterior", "menu", "course"] as Filter[])
    .filter((category) => category === "all" || usablePhotos.some((photo) => photo.category === category));
  const matchingPhotos = filter === "all" ? usablePhotos : usablePhotos.filter((photo) => photo.category === filter);
  const filtered = matchingPhotos.slice(0, preview ? 8 : visibleCount);

  const close = useCallback(() => {
    setSelected(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);
  const previous = useCallback(() => setSelected((current) => current === null ? 0 : (current - 1 + filtered.length) % filtered.length), [filtered.length]);
  const next = useCallback(() => setSelected((current) => current === null ? 0 : (current + 1) % filtered.length), [filtered.length]);

  useEffect(() => {
    if (selected === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
      if (event.key === "Tab") {
        const dialog = closeRef.current?.closest<HTMLElement>(".lightbox");
        const focusable = Array.from(dialog?.querySelectorAll<HTMLElement>("button,a[href]") ?? []);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [close, next, previous, selected]);

  if (!usablePhotos.length) {
    return (
      <div className="gallery-pending">
        <Images aria-hidden="true" />
        <p className="eyebrow">Photo launch dependency</p>
        <h2>{dictionary.common.photoPending}</h2>
        <p>{dictionary.common.photoPendingBody}</p>
      </div>
    );
  }

  return (
    <>
      {!preview ? (
        <div className="gallery-filters" role="group" aria-label={dictionary.gallery.title}>
          {categories.map((category) => <button type="button" key={category} aria-pressed={filter === category} className={filter === category ? "active" : ""} onClick={() => { setFilter(category); setSelected(null); setVisibleCount(12); }}>{labels[category]}</button>)}
        </div>
      ) : null}
      <motion.div className="gallery-grid" layout>
        {filtered.map((photo, index) => (
          <motion.button
            type="button"
            className="gallery-item"
            key={photo.id}
            layout
            onClick={(event) => { triggerRef.current = event.currentTarget; setSelected(index); }}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            aria-label={locale === "ja" ? photo.altJa : photo.altEn}
          >
            <Image
              src={photo.src}
              alt={locale === "ja" ? photo.altJa : photo.altEn}
              width={photo.width}
              height={photo.height}
              sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
              placeholder={photo.blurDataUrl ? "blur" : "empty"}
              blurDataURL={photo.blurDataUrl}
              loading="lazy"
            />
          </motion.button>
        ))}
      </motion.div>
      {!preview && filtered.length < matchingPhotos.length ? <div className="gallery-load-more"><button className="button button-outline" type="button" onClick={() => setVisibleCount((count) => count + 12)}>{locale === "ja" ? "さらに表示" : "Load more"}</button><span>{filtered.length} / {matchingPhotos.length}</span></div> : null}

      <AnimatePresence>
        {selected !== null && filtered[selected] ? (
          <motion.div className="lightbox" role="dialog" aria-modal="true" aria-label={dictionary.gallery.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button ref={closeRef} className="lightbox-close" type="button" onClick={close} aria-label={dictionary.gallery.close}><X /></button>
            <button className="lightbox-prev" type="button" onClick={previous} aria-label={dictionary.gallery.previous}><ChevronLeft /></button>
            <motion.figure drag={reduce ? false : "x"} dragConstraints={{ left: 0, right: 0 }} onDragEnd={(_, info) => { if (info.offset.x > 80) previous(); if (info.offset.x < -80) next(); }}>
              <Image src={filtered[selected].src} alt={locale === "ja" ? filtered[selected].altJa : filtered[selected].altEn} width={filtered[selected].width} height={filtered[selected].height} sizes="95vw" priority />
              <figcaption>{locale === "ja" ? filtered[selected].altJa : filtered[selected].altEn}</figcaption>
              <a className="lightbox-original" href={filtered[selected].src} target="_blank" rel="noopener noreferrer">{locale === "ja" ? "オリジナル解像度で開く" : "Open original resolution"}</a>
            </motion.figure>
            <button className="lightbox-next" type="button" onClick={next} aria-label={dictionary.gallery.next}><ChevronRight /></button>
            <p className="lightbox-counter">{dictionary.gallery.counter.replace("{current}", String(selected + 1)).replace("{total}", String(filtered.length))}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
