"use client";

import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { DishScroll3DProps } from "@/components/DishScroll3D";

const DishScroll3D = dynamic(
  () => import("@/components/DishScroll3D").then((module) => module.DishScroll3D),
  { ssr: false },
);

export function LazyDishScroll3D(props: DishScroll3DProps) {
  const placeholderRef = useRef<HTMLElement>(null);
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    const section = placeholderRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setNearViewport(true);
      observer.disconnect();
    }, { rootMargin: "70% 0px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  if (nearViewport) return <DishScroll3D {...props} />;

  const title = props.locale === "ja" ? props.item.nameJa : props.item.nameEn;
  const secondaryTitle = props.locale === "ja" ? props.item.nameEn : props.item.nameJa;
  return (
    <section
      ref={placeholderRef}
      className="dish3d-section dish3d-lazy-placeholder"
      aria-labelledby="dish3d-title"
      data-dish-3d-section
      data-scroll-chapter="3"
      data-model-ready="false"
      data-render-active="false"
    >
      <div className="dish3d-sticky">
        <div className="dish3d-atmosphere" aria-hidden="true"><i /><i /><i /></div>
        <p className="dish3d-kicker" aria-hidden="true">{props.locale === "ja" ? "火から食卓へ" : "From fire to table"}</p>
        <div className="dish3d-canvas-shell" role="img" aria-label={props.locale === "ja" ? `${title}の料理写真` : `Photograph of ${title}`}>
          <div className="dish3d-image-fallback" aria-hidden="true">
            <Image src="/images/originals/food/food-028.jpg" alt="" width={956} height={635} sizes="(max-width: 760px) 92vw, 58vw" loading="lazy" />
          </div>
        </div>
        <div className="dish3d-copy">
          <p className="eyebrow">{props.locale === "ja" ? "サクラのシグネチャー" : "Sakura signature"}</p>
          <p className="dish3d-secondary">{secondaryTitle}</p>
          <h2 id="dish3d-title">{title}</h2>
          <p>{props.description}</p>
          {props.item.price ? <div className="dish3d-price"><small>{props.locale === "ja" ? "税込価格" : "Tax included"}</small><strong>{props.item.price}</strong></div> : null}
          <div className="dish3d-actions">
            <Link className="button button-gold" href={props.reservationHref}>{props.reservationLabel}<ArrowRight aria-hidden="true" /></Link>
            <Link className="button button-outline" href={props.menuHref}>{props.menuLabel}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
