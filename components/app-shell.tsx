"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Clock3, MapPin, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { CinematicEffects } from "@/components/cinematic-effects";
import { SakuraPetals } from "@/components/sakura-petals";
import { restaurant } from "@/data/restaurant";
import { alternateLocale, localizePath } from "@/lib/locale";
import type { Dictionary } from "@/locales";
import type { Locale, RestaurantInfo } from "@/types";

export function AppShell({ children, locale, dictionary, restaurantInfo = restaurant }: { children: React.ReactNode; locale: Locale; dictionary: Dictionary; restaurantInfo?: RestaurantInfo }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const navigationStartedAt = useRef<number | null>(null);
  const navigationSafetyTimer = useRef<number | null>(null);
  const switchLocale = alternateLocale(locale);

  const nav = useMemo(() => [
    [dictionary.nav.home, localizePath(locale)],
    [dictionary.nav.menu, localizePath(locale, "menu")],
    [dictionary.nav.courses, localizePath(locale, "courses")],
    [dictionary.nav.gallery, localizePath(locale, "gallery")],
    [dictionary.nav.about, localizePath(locale, "about")],
    [dictionary.nav.access, localizePath(locale, "access")],
  ] as const, [dictionary, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      [...nav.map(([, href]) => href), localizePath(locale, "reservation")].forEach((href) => router.prefetch(href));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [locale, nav, router]);

  useEffect(() => {
    const onInternalLinkClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const destination = new URL(link.href, window.location.href);
      const current = new URL(window.location.href);
      if (destination.origin !== current.origin) return;
      if (destination.pathname === current.pathname && destination.search === current.search) return;

      navigationStartedAt.current = performance.now();
      setNavigating(true);
      if (navigationSafetyTimer.current) window.clearTimeout(navigationSafetyTimer.current);
      navigationSafetyTimer.current = window.setTimeout(() => setNavigating(false), 6000);
    };

    document.addEventListener("click", onInternalLinkClick, true);
    return () => {
      document.removeEventListener("click", onInternalLinkClick, true);
      if (navigationSafetyTimer.current) window.clearTimeout(navigationSafetyTimer.current);
    };
  }, []);

  useEffect(() => {
    const elapsed = navigationStartedAt.current ? performance.now() - navigationStartedAt.current : 0;
    const minimumDisplay = reduce ? 0 : 320;
    const timer = window.setTimeout(() => {
      setNavigating(false);
      navigationStartedAt.current = null;
      if (navigationSafetyTimer.current) window.clearTimeout(navigationSafetyTimer.current);
      navigationSafetyTimer.current = null;
    }, Math.max(0, minimumDisplay - elapsed));
    return () => window.clearTimeout(timer);
  }, [path, reduce]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("a,button:not([disabled])"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("button")?.focus());
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleLocale = () => {
    window.localStorage.setItem("sakura-locale", switchLocale);
    document.cookie = `sakura-locale=${switchLocale}; path=/; max-age=31536000; samesite=lax`;
  };

  const switchedPath = path.replace(/^\/(en|ja)/, `/${switchLocale}`);

  return (
    <>
      <LoadingScreen dictionary={dictionary} />
      <AnimatePresence>
        {navigating ? (
          <motion.div
            className="route-transition"
            role="status"
            aria-live="polite"
            aria-label={dictionary.common.loading}
            initial={reduce ? { opacity: 0 } : { opacity: 1, clipPath: "inset(100% 0 0 0)" }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, clipPath: "inset(0% 0 0 0)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 1, clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: reduce ? 0.01 : 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span className="route-transition-mark" aria-hidden="true" animate={reduce ? undefined : { opacity: [0.72, 1, 0.72], scale: [0.88, 1.04, 0.88] }} transition={{ duration: 1.1, repeat: Infinity }}>桜</motion.span>
            <span className="route-transition-label" aria-hidden="true">{dictionary.common.loading}</span>
            <span className="route-transition-line" aria-hidden="true" />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <CinematicEffects />
      <SakuraPetals />
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <Link className="brand" href={localizePath(locale)} aria-label={restaurantInfo.nameEn}>
          <span className="brand-mark" aria-hidden="true">桜</span>
          <span><b>{restaurantInfo.nameJa}</b><small>{restaurantInfo.nameEn}</small></span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {nav.map(([label, href]) => <Link key={href} className={path === href ? "active" : ""} href={href}>{label}</Link>)}
        </nav>
        <div className="header-actions">
          <Link className="language-link" href={switchedPath} onClick={handleLocale}><span className="language-desktop">{locale === "en" ? "日本語" : "EN"}</span><span className="language-mobile">{locale === "en" ? "JA" : "EN"}</span></Link>
          <Link className="button button-gold header-reserve" href={localizePath(locale, "reservation")}>{dictionary.nav.reservation}</Link>
          <button className="menu-toggle" type="button" onClick={() => setOpen(true)} aria-label={dictionary.nav.open} aria-expanded={open}>
            <Menu aria-hidden="true" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            ref={dialogRef}
            className="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label={dictionary.nav.open}
            initial={reduce ? false : { opacity: 0, clipPath: "circle(0% at 95% 5%)" }}
            animate={{ opacity: 1, clipPath: "circle(150% at 95% 5%)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, clipPath: "circle(0% at 95% 5%)" }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          >
            <button type="button" onClick={() => setOpen(false)} aria-label={dictionary.nav.close}><X /></button>
            <div className="mobile-nav-meta"><MapPin size={16} /> {dictionary.common.location}</div>
            <nav aria-label="Mobile navigation">
              {nav.map(([label, href], index) => (
                <motion.div key={href} initial={reduce ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * index }}>
                  <Link href={href} onClick={() => setOpen(false)}>{label}</Link>
                </motion.div>
              ))}
            </nav>
            <Link className="button button-gold" href={localizePath(locale, "reservation")} onClick={() => setOpen(false)}>{dictionary.common.reserve}</Link>
            <div className="mobile-nav-hours"><Clock3 size={16} /> {restaurantInfo.dinnerHours}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <div className="footer-grid">
          <div>
            <div className="footer-monogram" aria-hidden="true">桜</div>
            <h2>{restaurantInfo.nameJa}</h2>
            <p>{dictionary.footer.tagline}</p>
          </div>
          <div><h3>{dictionary.access.address}</h3><p>{locale === "ja" ? restaurantInfo.addressJa : restaurantInfo.addressEn}</p><p>{dictionary.common.location}</p></div>
          <div><h3>{dictionary.access.hours}</h3><p>{dictionary.common.lunch} {restaurantInfo.lunchHours}</p><p>{dictionary.common.dinner} {restaurantInfo.dinnerHours}</p></div>
          <div><h3>{dictionary.nav.menu}</h3>{nav.slice(1).map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} {restaurantInfo.nameEn}</span><span>{dictionary.footer.verify}</span><Link href="/admin">{dictionary.footer.admin}</Link></div>
      </footer>
    </>
  );
}
