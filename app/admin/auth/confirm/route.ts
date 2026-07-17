import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const acceptedTypes = new Set<EmailOtpType>(["invite", "recovery"]);

function adminErrorRedirect(request: NextRequest, message: string) {
  const target = new URL("/admin", request.url);
  target.searchParams.set("error", message);
  return NextResponse.redirect(target);
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) return adminErrorRedirect(request, "Owner sign-in is not configured.");

  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  if (!tokenHash || !type || !acceptedTypes.has(type)) {
    return adminErrorRedirect(request, "This invitation link is incomplete or invalid.");
  }

  const client = await createSupabaseServerClient();
  const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) return adminErrorRedirect(request, "This invitation link is invalid or has expired. Request a new invitation.");

  return NextResponse.redirect(new URL("/admin/set-password", request.url));
}
