import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { reservationStatusSnapshotSchema } from "@/lib/reservation-request";
import { isSupabaseConfigured, supabaseEnvironment } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const referencePattern = /^SKR-\d{8}-[A-Z0-9]{6}$/;
const tokenPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "status_service_unavailable" }, { status: 503 });
  const reference = request.nextUrl.searchParams.get("reference") ?? "";
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!referencePattern.test(reference) || !tokenPattern.test(token)) return NextResponse.json({ error: "invalid_status_credentials" }, { status: 400 });

  const { url, key } = supabaseEnvironment();
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await client.rpc("get_reservation_status", { p_reservation_reference: reference, p_submission_token: token });
  if (error) {
    console.error("Reservation status lookup failed", { code: error.code, message: error.message });
    return NextResponse.json({ error: "status_lookup_failed" }, { status: 500 });
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return NextResponse.json({ error: "reservation_not_found" }, { status: 404 });

  const parsed = reservationStatusSnapshotSchema.safeParse({
    reservationReference: row.reservation_reference,
    courseId: row.course_id ?? null,
    customerName: row.customer_name,
    reservationDate: row.reservation_date,
    reservationTime: typeof row.reservation_time === "string" ? row.reservation_time.slice(0, 5) : row.reservation_time,
    guestCount: row.guest_count,
    status: row.status,
    updatedAt: row.updated_at,
  });
  if (!parsed.success) return NextResponse.json({ error: "invalid_status_response" }, { status: 500 });

  return NextResponse.json({ reservation: parsed.data }, { headers: { "cache-control": "private, no-store, max-age=0" } });
}
