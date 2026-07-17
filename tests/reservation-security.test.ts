import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/002_reservations.sql"), "utf8");

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
});
