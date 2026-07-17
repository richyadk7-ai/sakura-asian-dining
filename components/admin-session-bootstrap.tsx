"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminSessionBootstrap() {
  const router = useRouter();
  const [status, setStatus] = useState("Checking the secure invitation session…");

  useEffect(() => {
    let active = true;
    let completed = false;
    const client = createSupabaseBrowserClient();

    const finish = () => {
      if (!active || completed) return;
      completed = true;
      router.replace("/admin/set-password");
      router.refresh();
    };

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (session) queueMicrotask(finish);
    });

    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (data.session) finish();
      else if (error) setStatus("The invitation session could not be verified. Open the latest invitation email again.");
      else setStatus("No active invitation was found. Open the latest owner invitation email to continue.");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  return <p aria-live="polite">{status}</p>;
}
