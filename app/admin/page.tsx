import { ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AdminDashboard } from "@/components/admin-dashboard";
import inventory from "@/data/authorized-image-inventory.json";
import { courses } from "@/data/courses";
import { allMenuItems } from "@/data/menu";
import { restaurant } from "@/data/restaurant";
import { en } from "@/locales/en";
import { ja } from "@/locales/ja";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { login, logout } from "@/app/admin/actions";
import type { ContentDocument, ImageInventoryEntry } from "@/types";

export const dynamic = "force-dynamic";

const staticDocuments: Record<ContentDocument["id"], unknown> = {
  restaurant,
  menu: allMenuItems,
  courses,
  pages: { en, ja },
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  if (!isSupabaseConfigured()) return <AdminFrame><div className="admin-auth-card"><ShieldAlert /><p className="eyebrow">Phase 2 setup</p><h1>Supabase is not configured</h1><p>The complete public website remains available from its static dataset. Add the Supabase variables, apply the migration, and create an allowlisted owner to activate this dashboard.</p><Link className="button button-gold" href="/en">View public site</Link></div></AdminFrame>;

  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return <AdminFrame><form action={login} className="admin-auth-card"><ShieldCheck /><p className="eyebrow">Owner sign in</p><h1>Sakura content studio</h1>{typeof query.error === "string" ? <p className="form-error" role="alert">{query.error}</p> : null}<label>Email<input type="email" name="email" autoComplete="email" required /></label><label>Password<input type="password" name="password" autoComplete="current-password" required /></label><button className="button button-gold">Sign in</button><p>First time here? Open the latest owner invitation email to create your password.</p><Link href="/en" className="text-link">Return to restaurant</Link></form></AdminFrame>;

  const { data: allowed } = await client.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!allowed) return <AdminFrame><div className="admin-auth-card"><ShieldAlert /><p className="eyebrow">Access denied</p><h1>Not on the owner allowlist</h1><p>{user.email} is authenticated but cannot access drafts or uploads.</p><form action={logout}><button className="button button-outline">Sign out</button></form></div></AdminFrame>;

  const [{ data: drafts }, { data: published }, { data: photoRows }] = await Promise.all([
    client.from("content_drafts").select("id,payload,updated_at"),
    client.from("published_content").select("id,published_at"),
    client.from("restaurant_photos").select("id,published,authorized,featured,category").order("source_order"),
  ]);
  const draftMap = new Map((drafts ?? []).map((item) => [item.id, item]));
  const publishedMap = new Map((published ?? []).map((item) => [item.id, item.published_at]));
  const documents = (Object.keys(staticDocuments) as ContentDocument["id"][]).map((id) => ({ id, payload: draftMap.get(id)?.payload ?? staticDocuments[id], publishedAt: publishedMap.get(id) ?? null }));
  return <AdminFrame><AdminDashboard initialDocuments={documents} inventory={inventory as ImageInventoryEntry[]} photoRows={photoRows ?? []} /></AdminFrame>;
}

function AdminFrame({ children }: { children: React.ReactNode }) {
  return <main className="admin-page">{children}</main>;
}
