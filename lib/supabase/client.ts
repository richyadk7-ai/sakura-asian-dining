"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnvironment } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  const { url, key } = supabaseEnvironment();
  return createBrowserClient(url, key);
}
