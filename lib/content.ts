import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseEnvironment } from "@/lib/supabase/config";
import type { ContentDocument, RestaurantPhoto } from "@/types";
import { validateContentDocument } from "@/lib/content-validation";
import { getDictionary, type Dictionary } from "@/locales";
import type { Locale } from "@/types";

export async function getPublishedPayload<T>(id: ContentDocument["id"], fallback: T): Promise<T> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    const { url, key } = supabaseEnvironment();
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.from("published_content").select("payload").eq("id", id).maybeSingle();
    if (error || !data?.payload || !validateContentDocument(id, data.payload).success) return fallback;
    return data.payload as T;
  } catch { return fallback; }
}

export async function getPublishedDictionary(locale: Locale): Promise<Dictionary> {
  const fallback = getDictionary(locale);
  const pages = await getPublishedPayload<Record<Locale, Dictionary>>("pages", { en: getDictionary("en"), ja: getDictionary("ja") });
  return pages?.[locale] ?? fallback;
}

export async function getPublishedPhotos(fallback: RestaurantPhoto[] = []): Promise<RestaurantPhoto[]> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    const { url, key } = supabaseEnvironment();
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.from("restaurant_photos").select("id,category,storage_path,alt_en,alt_ja,width,height,featured,authorized,published,excluded,blur_data_url").eq("published", true).eq("authorized", true).eq("excluded", false).order("source_order");
    if (error || !data?.length) return fallback;
    const photos = await Promise.all(data.map(async (record) => {
      const { data: signed } = await client.storage.from("restaurant-originals").createSignedUrl(record.storage_path, 3600);
      if (!signed?.signedUrl) return null;
      return { id: record.id, src: signed.signedUrl, category: record.category, altEn: record.alt_en, altJa: record.alt_ja, width: record.width, height: record.height, featured: record.featured, authorized: record.authorized, excluded: record.excluded, blurDataUrl: record.blur_data_url } as RestaurantPhoto;
    }));
    const valid = photos.filter((photo): photo is RestaurantPhoto => Boolean(photo));
    return valid.length ? valid : fallback;
  } catch { return fallback; }
}
