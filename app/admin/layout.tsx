import { CinematicEffects } from "@/components/cinematic-effects";
import { SakuraPetals } from "@/components/sakura-petals";

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
