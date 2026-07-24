import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { sendOwnerReservationPush } from "@/lib/notifications/owner-web-push";
import { reservationConfirmationSchema, reservationIssueField, reservationRequestSchema, reservationRpcParams } from "@/lib/reservation-request";
import { isSupabaseConfigured, supabaseEnvironment } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) return NextResponse.json({ error: "invalid_content_type" }, { status: 415 });
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 32_768) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "reservation_service_unavailable" }, { status: 503 });

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 32_768) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = reservationRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_request", field: reservationIssueField(parsed.error) }, { status: 400 });

  const { url, key } = supabaseEnvironment();
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await client.rpc("submit_reservation_request", reservationRpcParams(parsed.data));
  if (error) {
    console.error("Reservation submission failed", { code: error.code, message: error.message });
    return NextResponse.json({ error: "reservation_submission_failed" }, { status: 500 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  const confirmation = reservationConfirmationSchema.safeParse({
    reservationReference: row?.reservation_reference,
    courseId: row?.course_id ?? null,
    customerName: row?.customer_name,
    reservationDate: row?.reservation_date,
    reservationTime: typeof row?.reservation_time === "string" ? row.reservation_time.slice(0, 5) : row?.reservation_time,
    guestCount: row?.guest_count,
    status: row?.status,
  });
  if (!confirmation.success) {
    console.error("Reservation confirmation payload was invalid", confirmation.error.flatten());
    return NextResponse.json({ error: "reservation_submission_failed" }, { status: 500 });
  }

  if (row?.was_created) {
    await sendOwnerReservationPush(confirmation.data);
  }

  return NextResponse.json(
    { reservation: confirmation.data },
    { status: row?.was_created ? 201 : 200, headers: { "Cache-Control": "no-store" } },
  );
}
