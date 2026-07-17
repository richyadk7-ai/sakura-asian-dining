"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { supabaseEnvironment } from "@/lib/supabase/config";

export function AdminSessionBootstrap() {
  const router = useRouter();
  const [status, setStatus] = useState("Checking the secure invitation session…");

  useEffect(() => {
    let active = true;

    void (async () => {
      const { url, key } = supabaseEnvironment();
      const invitationClient = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: true,
          flowType: "implicit",
          persistSession: false,
        },
      });
      const { data, error } = await invitationClient.auth.getSession();
      if (!active) return;
      if (error || !data.session) {
        setStatus(error
          ? "The invitation session could not be verified. Open the latest invitation email again."
          : "No active invitation was found. Open the latest owner invitation email to continue.");
        return;
      }

      const cookieClient = createSupabaseBrowserClient();
      const { error: cookieError } = await cookieClient.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (!active) return;
      if (cookieError) {
        setStatus("The invitation was verified, but the secure owner session could not be created. Open the invitation again.");
        return;
      }

      router.replace("/admin/set-password");
      router.refresh();
    })();

    return () => {
      active = false;
    };
  }, [router]);

  return <p aria-live="polite">{status}</p>;
}
