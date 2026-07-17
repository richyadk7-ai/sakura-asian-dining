import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2048).refine((value) => value.startsWith("https://")),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(16).max(512).regex(/^[A-Za-z0-9_-]+$/),
    auth: z.string().min(8).max(256).regex(/^[A-Za-z0-9_-]+$/),
  }),
});

async function authenticatedOwner() {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { client, user: null };
  const { data: owner } = await client.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  return { client, user: owner ? user : null };
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) return NextResponse.json({ error: "invalid_content_type" }, { status: 415 });
  const parsed = pushSubscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
  const { client, user } = await authenticatedOwner();
  if (!user) return NextResponse.json({ error: "not_authorized" }, { status: 401 });
  const { error } = await client.from("owner_push_subscriptions").upsert({
    user_id: user.id,
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    auth: parsed.data.keys.auth,
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: "subscription_save_failed" }, { status: 500 });
  return NextResponse.json({ saved: true });
}

export async function DELETE(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  const body = z.object({ endpoint: z.string().url().max(2048) }).safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
  const { client, user } = await authenticatedOwner();
  if (!user) return NextResponse.json({ error: "not_authorized" }, { status: 401 });
  const { error } = await client.from("owner_push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", body.data.endpoint);
  if (error) return NextResponse.json({ error: "subscription_delete_failed" }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
