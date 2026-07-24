import { BreadcrumbJsonLd } from "@/components/breadcrumb-json-ld";
import { MotionReveal } from "@/components/motion-reveal";
import { PageHero } from "@/components/page-hero";
import { restaurantConfig } from "@/data/restaurant";
import { getPublishedDictionary } from "@/lib/content";
import { isLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/seo";
import type { LocalePageProps } from "@/types";

export async function generateMetadata({ params }: LocalePageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "en";
  const d = await getPublishedDictionary(lang);
  return pageMetadata(lang, "privacy", d.privacy.title, d.privacy.intro);
}

export default async function PrivacyPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "en";
  const d = await getPublishedDictionary(lang);
  const operatorBody = lang === "ja"
    ? `${restaurantConfig.identity.nameJa}（${restaurantConfig.location.addressJa}）は、当ウェブサイトを通じて送信された個人情報を管理します。`
    : `${restaurantConfig.identity.nameEn}, ${restaurantConfig.location.addressEn}, manages the personal information submitted through this website.`;
  const sections = [
    [d.privacy.operatorTitle, operatorBody],
    [d.privacy.collectionTitle, d.privacy.collectionBody],
    [d.privacy.purposeTitle, d.privacy.purposeBody],
    [d.privacy.sharingTitle, d.privacy.sharingBody],
    [d.privacy.retentionTitle, d.privacy.retentionBody],
    [d.privacy.securityTitle, d.privacy.securityBody],
    [d.privacy.analyticsTitle, d.privacy.analyticsBody],
    [d.privacy.rightsTitle, d.privacy.rightsBody],
    [d.privacy.reservationTitle, d.privacy.reservationBody],
  ] as const;

  return (
    <>
      <BreadcrumbJsonLd locale={lang} path="privacy" label={d.privacy.title} />
      <PageHero locale={lang} eyebrow={d.privacy.eyebrow} title={d.privacy.title} intro={d.privacy.intro} />
      <section className="section privacy-section">
        <div className="container privacy-layout">
          <aside className="privacy-summary">
            <span aria-hidden="true">桜</span>
            <p className="eyebrow">{d.privacy.effective}</p>
            <p>{d.privacy.intro}</p>
          </aside>
          <div className="privacy-cards">
            {sections.map(([title, body], index) => (
              <MotionReveal className="privacy-card" delay={Math.min(index * 0.035, 0.2)} key={title}>
                <span className="privacy-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div><h2>{title}</h2><p>{body}</p></div>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
