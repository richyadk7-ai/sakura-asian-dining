import { KeyRound, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { setOwnerPassword } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  if (!isSupabaseConfigured()) return <AdminFrame><StatusCard title="Owner sign-in is not configured" message="The password setup page is unavailable until Supabase is configured." /></AdminFrame>;

  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return <AdminFrame><StatusCard title="Invitation session expired" message="Open the latest owner invitation email again. If the link has expired, request a new invitation." /></AdminFrame>;

  const { data: allowed } = await client.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!allowed) return <AdminFrame><StatusCard title="Owner access was not approved" message="This authenticated account is not on the Sakura owner allowlist." /></AdminFrame>;

  return (
    <AdminFrame>
      <form action={setOwnerPassword} className="admin-auth-card">
        <KeyRound />
        <p className="eyebrow">Secure owner setup</p>
        <h1>Choose your password</h1>
        <p>Signed in as {user.email}. Use at least 12 characters with uppercase, lowercase and a number.</p>
        {typeof query.error === "string" ? <p className="form-error" role="alert">{query.error}</p> : null}
        <label>New password<input type="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
        <label>Confirm password<input type="password" name="confirmation" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
        <button className="button button-gold">Save password &amp; open reservations</button>
      </form>
    </AdminFrame>
  );
}

function StatusCard({ title, message }: { title: string; message: string }) {
  return <div className="admin-auth-card"><ShieldAlert /><p className="eyebrow">Owner setup</p><h1>{title}</h1><p>{message}</p><Link className="button button-outline" href="/admin">Owner sign in</Link></div>;
}

function AdminFrame({ children }: { children: React.ReactNode }) {
  return <main className="admin-page">{children}</main>;
}
