import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ImageInventoryEntry, RestaurantPhotoCategory } from "../types";

const root = process.cwd();
const jsonPath = path.join(root, "data/authorized-image-inventory.json");
const counts: Array<[RestaurantPhotoCategory, number]> = [
  ["food", 113], ["drinks", 10], ["interior", 16], ["exterior", 8], ["menu", 17], ["course", 5],
];
const existing = existsSync(jsonPath)
  ? new Map((JSON.parse(readFileSync(jsonPath, "utf8")) as ImageInventoryEntry[]).map((entry) => [entry.referenceId, entry]))
  : new Map<string, ImageInventoryEntry>();

const inventory = counts.flatMap(([category, count]) => Array.from({ length: count }, (_, index) => {
  const order = index + 1;
  const referenceId = `${category}-${String(order).padStart(3, "0")}`;
  const current = existing.get(referenceId);
  return {
    referenceId,
    category,
    sourceOrder: order,
    expectedFilename: `${referenceId}.[original-extension]`,
    localPath: `public/images/originals/${category}/`,
    suppliedFilename: current?.suppliedFilename ?? null,
    authorizationConfirmed: current?.authorizationConfirmed ?? false,
    status: current?.status ?? "missing",
    width: current?.width ?? null,
    height: current?.height ?? null,
    sha256: current?.sha256 ?? null,
    perceptualHash: current?.perceptualHash ?? null,
    reviewReason: current?.reviewReason ?? "Authorized original not supplied",
  } satisfies ImageInventoryEntry;
}));

writeFileSync(jsonPath, `${JSON.stringify(inventory, null, 2)}\n`);
const headers = ["referenceId", "category", "sourceOrder", "expectedFilename", "localPath", "suppliedFilename", "authorizationConfirmed", "status", "width", "height", "sha256", "perceptualHash", "reviewReason"] as const;
const csv = [headers.join(","), ...inventory.map((entry) => headers.map((header) => `"${String(entry[header] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
writeFileSync(path.join(root, "data/authorized-image-inventory.csv"), `${csv}\n`);
console.log(`Wrote ${inventory.length} inventory records: food 113, drinks 10, interior 16, exterior 8, menu 17, course 5.`);
