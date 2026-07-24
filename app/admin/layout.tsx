import type { Metadata } from "next";
import { CinematicEffects } from "@/components/cinematic-effects";
import { SakuraPetals } from "@/components/sakura-petals";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CinematicEffects />
      <SakuraPetals />
      <div className="admin-atmosphere" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {children}
    </>
  );
}
