import { describe, expect, it } from "vitest";
import { en } from "@/locales/en";
import { ja } from "@/locales/ja";

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, shape(child)]));
  return typeof value;
}

describe("localization", () => {
  it("keeps identical typed dictionary shapes", () => expect(shape(ja)).toEqual(shape(en)));
  it("contains no empty visible strings", () => {
    for (const dictionary of [en, ja]) expect(JSON.stringify(dictionary)).not.toMatch(/:\s*""/);
  });
});
