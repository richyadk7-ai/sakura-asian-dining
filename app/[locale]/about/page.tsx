import { Flame, HeartHandshake, Wheat } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld";
import { MotionReveal } from "@/components/motion-reveal";
import { PageHero } from "@/components/page-hero";
import { getPublishedDictionary } from "@/lib/content";
import type { LocalePageProps } from "@/types";
import { isLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "en";
  const d = await getPublishedDictionary(lang);
  return pageMetadata(lang, "about", d.about.title, d.about.intro);
}

export default async function AboutPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "en";
  const d = await getPublishedDictionary(lang);
  const stories = [
    { icon: <Wheat />, title: d.about.naanTitle, body: d.about.naanBody },
    { icon: <Flame />, title: d.about.grillTitle, body: d.about.grillBody },
    { icon: <HeartHandshake />, title: d.about.tableTitle, body: d.about.tableBody },
  ];
  return <><BreadcrumbJsonLd locale={lang} path="about" label={d.about.title} /><PageHero eyebrow="Sakura · Story" title={d.about.title} intro={d.about.intro} /><section className="section"><div className="container about-grid">{stories.map((story, index) => <MotionReveal className="about-card" delay={index * .08} key={story.title}><span>{story.icon}</span><p className="eyebrow">0{index + 1}</p><h2>{story.title}</h2><p>{story.body}</p></MotionReveal>)}</div></section><section className="about-statement"><div className="container"><span aria-hidden="true">桜</span><p>{lang === "ja" ? "昼のひと皿から、仲間と囲む夜のテーブルまで。" : "From a midday plate to an evening table shared with friends."}</p></div></section></>;
}
