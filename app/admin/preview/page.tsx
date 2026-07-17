import Link from "next/link";
import { redirect } from "next/navigation";
import { HomePage } from "@/components/home-page";
import { courses } from "@/data/courses";
import { allMenuItems } from "@/data/menu";
import { restaurant } from "@/data/restaurant";
import { getDictionary, type Dictionary } from "@/locales";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Course, Locale, MenuItem, RestaurantInfo, RestaurantPhoto } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminPreviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!isSupabaseConfigured()) redirect("/admin");
  const query = await searchParams;
  const locale: Locale = query.locale === "ja" ? "ja" : "en";
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/admin");
  const { data: allowed } = await client.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!allowed) redirect("/admin");
  const [{ data: drafts }, { data: photoRows }] = await Promise.all([
    client.from("content_drafts").select("id,payload"),
    client.from("restaurant_photos").select("id,category,storage_path,alt_en,alt_ja,width,height,featured,authorized,excluded,blur_data_url").eq("authorized", true).eq("excluded", false).order("source_order"),
  ]);
  const documents = new Map((drafts ?? []).map((item) => [item.id, item.payload]));
  const pages = documents.get("pages") as Record<Locale, Dictionary> | undefined;
  const photos = (await Promise.all((photoRows ?? []).map(async (photo) => {
    const { data } = await client.storage.from("restaurant-originals").createSignedUrl(photo.storage_path, 1800);
    return data?.signedUrl ? { id: photo.id, src: data.signedUrl, category: photo.category, altEn: photo.alt_en, altJa: photo.alt_ja, width: photo.width, height: photo.height, featured: photo.featured, authorized: photo.authorized, excluded: photo.excluded, blurDataUrl: photo.blur_data_url } as RestaurantPhoto : null;
  }))).filter((photo): photo is RestaurantPhoto => Boolean(photo));
  return <><div className="preview-banner"><span>Private draft preview · {locale.toUpperCase()}</span><span><Link href={`/admin/preview?locale=${locale === "en" ? "ja" : "en"}`}>Switch locale</Link> · <Link href="/admin">Back to dashboard</Link></span></div><HomePage locale={locale} dictionary={pages?.[locale] ?? getDictionary(locale)} restaurantInfo={(documents.get("restaurant") as RestaurantInfo | undefined) ?? restaurant} menuData={(documents.get("menu") as MenuItem[] | undefined) ?? allMenuItems} courseData={(documents.get("courses") as Course[] | undefined) ?? courses} photos={photos} /></>;
}
