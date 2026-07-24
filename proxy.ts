import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { restaurantConfig } from "@/data/restaurant";
import { LOCALES, PUBLIC_PATHS } from "@/lib/constants";

function preferredLocale(request: NextRequest) {
  const saved = request.cookies.get("sakura-locale")?.value;
  if (saved === "ja" || saved === "en") return saved;
  return request.headers.get("accept-language")?.toLowerCase().startsWith("ja") ? "ja" : "en";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (host === `www.${restaurantConfig.canonicalHost}`) {
    const canonical = request.nextUrl.clone();
    canonical.protocol = "https";
    canonical.hostname = restaurantConfig.canonicalHost;
    canonical.port = "";
    return NextResponse.redirect(canonical, 308);
  }
  const firstSegment = pathname.split("/")[1];
  const barePath = pathname.replace(/^\//, "");
  const isPublicBare = PUBLIC_PATHS.includes(barePath as (typeof PUBLIC_PATHS)[number]);

  if (!LOCALES.includes(firstSegment as "en" | "ja") && isPublicBare) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  const locale = firstSegment === "ja" ? "ja" : preferredLocale(request);
  requestHeaders.set("x-sakura-locale", locale);
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set("sakura-locale", locale, { path: "/", maxAge: 31_536_000, sameSite: "lax" });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getClaims();
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
