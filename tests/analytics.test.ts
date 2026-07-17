import { describe, expect, it } from "vitest";
import { sanitizePublicObservation } from "@/lib/analytics";

describe("public observability privacy", () => {
  it("strips public query strings and fragments", () => {
    expect(sanitizePublicObservation({ url: "https://sakura.example/en/menu?category=food#items", name: "pageview" }))
      .toEqual({ url: "https://sakura.example/en/menu", name: "pageview" });
  });

  it("excludes private reservation confirmation and admin pages", () => {
    expect(sanitizePublicObservation({ url: "https://sakura.example/en/reservation/confirmation?token=secret" })).toBeNull();
    expect(sanitizePublicObservation({ url: "https://sakura.example/admin/reservations" })).toBeNull();
  });
});
