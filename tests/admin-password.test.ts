import { describe, expect, it } from "vitest";
import { validateOwnerPassword } from "@/lib/admin-password";

describe("owner password validation", () => {
  it("accepts matching strong passwords", () => {
    expect(validateOwnerPassword("SakuraOwner2026", "SakuraOwner2026")).toBeNull();
  });

  it.each([
    ["short1A", "Use at least 12 characters."],
    ["SAKURAOWNER2026", "Include at least one lowercase letter."],
    ["sakuraowner2026", "Include at least one uppercase letter."],
    ["SakuraOwnerOnly", "Include at least one number."],
  ])("rejects an invalid password", (password, message) => {
    expect(validateOwnerPassword(password, password)).toBe(message);
  });

  it("rejects a mismatched confirmation", () => {
    expect(validateOwnerPassword("SakuraOwner2026", "SakuraOwner2027")).toBe("The passwords do not match.");
  });
});
