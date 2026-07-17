import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnvironment } from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  const { url, key } = supabaseEnvironment();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Components cannot always set cookies; proxy refreshes sessions. */ }
      },
    },
  });
}
