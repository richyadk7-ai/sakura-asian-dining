import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { deliverReservationStatusEmail, RESERVATION_EMAIL_COLUMNS, type ReservationEmailRow } from "@/lib/reservations/status-email";
import { isSupabaseConfigured, supabaseEnvironment } from "@/lib/supabase/config";

export const runtime = "nodejs";

const requestSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "rejected", "cancelled", "completed", "no_show"]),
});

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "reservation_service_unavailable" }, { status: 503 });
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const { url, key } = supabaseEnvironment();
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authError } = await client.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  const { data: allowed, error: allowlistError } = await client.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (allowlistError || !allowed) return NextResponse.json({ error: "owner_access_required" }, { status: 403 });

  const { data, error } = await client.from("reservations")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .select(RESERVATION_EMAIL_COLUMNS)
    .single();
  if (error) return NextResponse.json({ error: "status_update_failed" }, { status: 400 });
  const customerEmail = await deliverReservationStatusEmail(client, data as ReservationEmailRow);
  return NextResponse.json({ reservation: { id: data.id, status: data.status }, customerEmail });
}
