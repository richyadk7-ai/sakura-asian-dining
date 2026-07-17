import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/002_reservations.sql"), "utf8");
const courseMigration = readFileSync(resolve(process.cwd(), "supabase/migrations/003_reservation_courses.sql"), "utf8");
const realtimeMigration = readFileSync(resolve(process.cwd(), "supabase/migrations/004_realtime_reservation_alerts.sql"), "utf8");
const pushMigration = readFileSync(resolve(process.cwd(), "supabase/migrations/005_owner_web_push.sql"), "utf8");

describe("reservation database boundary", () => {
  it("stores new requests as pending behind an idempotent server function", () => {
    expect(migration).toContain("submission_token uuid not null unique");
    expect(migration).toContain("reservation_reference text not null unique");
    expect(migration).toContain("p_submission_token uuid");
    expect(migration).toMatch(/preferred_language, status[\s\S]*p_preferred_language, 'pending'/);
  });

  it("allows only allowlisted admins to read or update reservations", () => {
    expect(migration).toContain("alter table public.reservations enable row level security");
    expect(migration).toContain('for select using (public.is_admin())');
    expect(migration).toContain('for update using (public.is_admin()) with check (public.is_admin())');
    expect(migration).toContain("revoke all on public.reservations from anon");
    expect(migration).not.toMatch(/grant\s+(select|update|delete)[^;]*reservations\s+to\s+anon/i);
  });

  it("queues notifications without claiming provider delivery", () => {
    expect(migration).toContain("reservation_notification_outbox");
    expect(migration).toContain("owner_new_request");
    expect(migration).toContain("customer_request_received");
    expect(migration).toContain("customer_confirmed");
    expect(migration).toContain("customer_rejected");
    expect(migration).toContain("customer_cancelled");
  });

  it("stores only nullable, allowlisted course identifiers", () => {
    expect(courseMigration).toContain("add column if not exists course_id text");
    expect(courseMigration).toContain("reservations_course_id_check");
    expect(courseMigration).toContain("p_course_id text");
    expect(courseMigration).toMatch(/insert into public\.reservations[\s\S]*course_id[\s\S]*p_course_id/);
    expect(courseMigration).toContain("then raise exception 'invalid course'");
  });

  it("publishes reservation inserts to authenticated owners without weakening RLS", () => {
    expect(realtimeMigration).toContain("pg_publication_tables");
    expect(realtimeMigration).toContain("alter publication supabase_realtime add table public.reservations");
    expect(realtimeMigration).not.toMatch(/create\s+policy/i);
  });

  it("stores push subscriptions behind owner RLS and a server-only dispatch secret", () => {
    expect(pushMigration).toContain("alter table public.owner_push_subscriptions enable row level security");
    expect(pushMigration).toMatch(/for insert with check \(public\.is_admin\(\) and user_id = auth\.uid\(\)\)/);
    expect(pushMigration).toContain("revoke all on public.owner_push_subscriptions from anon");
    expect(pushMigration).not.toMatch(/grant\s+(select|insert|update|delete)[^;]*owner_push_subscriptions\s+to\s+anon/i);
    expect(pushMigration).toContain("private.owner_push_dispatch_config");
    expect(pushMigration).toContain("extensions.digest(p_dispatch_secret, 'sha256')");
    expect(pushMigration).toContain("revoke all on schema private from public, anon, authenticated");
    expect(pushMigration).toContain("security definer");
  });
});
