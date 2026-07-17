"use server";

import { createHash } from "node:crypto";
import sharp from "sharp";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import inventory from "@/data/authorized-image-inventory.json";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { assertValidContentDocument } from "@/lib/content-validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ContentDocument, ImageInventoryEntry } from "@/types";

async function requireAdmin() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured");
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Authentication required");
  const { data } = await client.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!data) throw new Error("This account is not on the owner allowlist");
  return { client, user };
}

export async function login(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/admin?error=Supabase%20is%20not%20configured");
  const client = await createSupabaseServerClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  redirect("/admin");
}

export async function logout() {
  if (isSupabaseConfigured()) { const client = await createSupabaseServerClient(); await client.auth.signOut(); }
  redirect("/admin");
}

export async function saveDraft(formData: FormData) {
  const { client, user } = await requireAdmin();
  const id = String(formData.get("id")) as ContentDocument["id"];
  if (!["restaurant", "menu", "courses", "pages"].includes(id)) throw new Error("Unsupported document");
  let payload: unknown;
  try { payload = JSON.parse(String(formData.get("payload"))); } catch { throw new Error("Draft must be valid JSON"); }
  assertValidContentDocument(id, payload);
  const { error } = await client.from("content_drafts").upsert({ id, payload, updated_by: user.id, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function publishDocument(formData: FormData) {
  const { client } = await requireAdmin();
  const id = String(formData.get("id")) as ContentDocument["id"];
  const { data: draft } = await client.from("content_drafts").select("payload").eq("id", id).maybeSingle();
  if (!draft) throw new Error("Save a valid draft before publishing");
  assertValidContentDocument(id, draft.payload);
  const { error } = await client.rpc("publish_content_document", { document_id: id });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

function photoHash(data: Buffer) {
  return createHash("sha256").update(data).digest("hex");
}

export async function uploadPhoto(formData: FormData) {
  const { client, user } = await requireAdmin();
  const referenceId = String(formData.get("referenceId") ?? "");
  const slot = (inventory as ImageInventoryEntry[]).find((entry) => entry.referenceId === referenceId);
  if (!slot) throw new Error("Unknown image inventory slot");
  if (formData.get("authorized") !== "yes") throw new Error("Publication authorization must be confirmed");
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) throw new Error("Choose an image file");
  if (file.size > 30 * 1024 * 1024) throw new Error("Original is larger than the 30 MB upload limit");
  const bytes = Buffer.from(await file.arrayBuffer());
  const image = sharp(bytes, { failOn: "error" });
  const meta = await image.metadata();
  if (!meta.width || !meta.height || !meta.format) throw new Error("The image could not be decoded");
  const sha256 = photoHash(bytes);
  const { data: duplicate } = await client.from("restaurant_photos").select("id").eq("sha256", sha256).maybeSingle();
  if (duplicate) throw new Error(`Exact duplicate of ${duplicate.id}; no upload was made`);
  const { data: pixels } = await image.resize(9, 8, { fit: "fill" }).greyscale().raw().toBuffer({ resolveWithObject: true });
  let bits = 0n;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits = (bits << 1n) | BigInt(pixels[y * 9 + x] > pixels[y * 9 + x + 1] ? 1 : 0);
  const perceptualHash = bits.toString(16).padStart(16, "0");
  const extension = meta.format === "jpeg" ? "jpg" : meta.format;
  const storagePath = `${slot.category}/${referenceId}.${extension}`;
  const { error: uploadError } = await client.storage.from("restaurant-originals").upload(storagePath, bytes, { contentType: file.type || `image/${meta.format}`, upsert: false });
  if (uploadError) throw new Error(uploadError.message);
  const blur = await sharp(bytes).resize({ width: 24, withoutEnlargement: true }).webp({ quality: 35 }).toBuffer();
  const { error } = await client.from("restaurant_photos").insert({ id: referenceId, category: slot.category, source_order: slot.sourceOrder, storage_path: storagePath, original_filename: file.name, alt_en: String(formData.get("altEn") ?? ""), alt_ja: String(formData.get("altJa") ?? ""), width: meta.width, height: meta.height, sha256, perceptual_hash: perceptualHash, blur_data_url: `data:image/webp;base64,${blur.toString("base64")}`, authorized: true, featured: formData.get("featured") === "yes", published: false, uploaded_by: user.id });
  if (error) { await client.storage.from("restaurant-originals").remove([storagePath]); throw new Error(error.message); }
  revalidatePath("/admin");
}

export async function publishPhoto(formData: FormData) {
  const { client } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const { error } = await client.from("restaurant_photos").update({ published: true, published_at: new Date().toISOString() }).eq("id", id).eq("authorized", true).eq("excluded", false);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function toggleFeatured(formData: FormData) {
  const { client } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const featured = formData.get("featured") === "yes";
  const { error } = await client.from("restaurant_photos").update({ featured }).eq("id", id).eq("authorized", true);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
