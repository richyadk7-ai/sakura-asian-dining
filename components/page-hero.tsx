import { ChevronDown } from "lucide-react";

export function PageHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <section className="page-hero">
      <div className="page-hero-wordmark" aria-hidden="true">Sakura</div>
      <div className="page-hero-orbit" aria-hidden="true" />
      <div className="petal petal-one" aria-hidden="true" />
      <div className="petal petal-two" aria-hidden="true" />
      <div className="container page-hero-content">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      <ChevronDown className="page-hero-chevron" aria-hidden="true" />
    </section>
  );
}
