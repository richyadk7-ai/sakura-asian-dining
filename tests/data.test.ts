import { describe, expect, it } from "vitest";
import inventory from "@/data/authorized-image-inventory.json";
import manifest from "@/data/photo-manifest.json";
import sourceReport from "@/data/source-audit.json";
import { courses } from "@/data/courses";
import { drinkItems, foodItems, lunchItems, menuPhotoEntries } from "@/data/menu";

const photoManifest = manifest as Array<{ id: string; src: string; category: string; authorized: boolean; excluded?: boolean }>;

describe("audited reference datasets", () => {
  it("contains every audited menu entry", () => {
    expect(foodItems).toHaveLength(100);
    expect(courses).toHaveLength(5);
    expect(drinkItems).toHaveLength(74);
    expect(lunchItems).toHaveLength(27);
    expect(menuPhotoEntries).toHaveLength(17);
    expect(sourceReport.records).toHaveLength(223);
  });

  it("preserves unique local ids and source order", () => {
    for (const list of [foodItems, drinkItems, lunchItems, courses]) {
      expect(new Set(list.map((item) => item.id)).size).toBe(list.length);
      expect(list.map((item) => item.sourceOrder)).toEqual(Array.from({ length: list.length }, (_, index) => index + 1));
    }
  });

  it("tracks all 169 authorized-image slots and publishes no unauthorized image", () => {
    const count = (category: string) => inventory.filter((entry) => entry.category === category).length;
    expect({ food: count("food"), drinks: count("drinks"), interior: count("interior"), exterior: count("exterior"), menu: count("menu"), course: count("course") }).toEqual({ food: 113, drinks: 10, interior: 16, exterior: 8, menu: 17, course: 5 });
    expect(photoManifest.every((photo) => photo.authorized && !photo.excluded)).toBe(true);
  });

  it("publishes every authorized restaurant photograph from local assets", () => {
    expect(photoManifest).toHaveLength(55);
    expect(photoManifest.every((photo) => photo.src.startsWith("/images/originals/"))).toBe(true);
    expect(Object.fromEntries([...Map.groupBy(photoManifest, (photo) => photo.category)].map(([category, photos]) => [category, photos.length]))).toEqual({ food: 37, drinks: 3, interior: 14, exterior: 1 });
  });

  it("resolves an included official photograph for every course", () => {
    const photoIds = new Set(photoManifest.map((photo) => photo.id));
    expect(courses.every((course) => course.imageId && photoIds.has(course.imageId))).toBe(true);
  });
});
