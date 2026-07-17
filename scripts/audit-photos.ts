import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { ImageInventoryEntry, PhotoQualityResult, RestaurantPhoto } from "../types";

type Authorization = {
  referenceId: string;
  suppliedPath: string;
  authorizationConfirmed: boolean;
  altEn: string;
  altJa: string;
  featured?: boolean;
};
type AuditRecord = { entry: ImageInventoryEntry; authorization: Authorization; absolutePath: string; pixels: number; ratio: number; brightness: number; blur: number; };

const root = process.cwd();
const inventoryPath = path.join(root, "data/authorized-image-inventory.json");
if (!existsSync(inventoryPath)) throw new Error("Run npm run photos:inventory first.");
const inventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as ImageInventoryEntry[];
const config = JSON.parse(readFileSync(path.join(root, "data/image-authorization.json"), "utf8")) as { authorizedFiles: Authorization[]; confirmedNearDuplicateExclusions?: string[]; manualExclusions?: Array<{ referenceId: string; reason: string }> };
const confirmedNearDuplicateExclusions = new Set(config.confirmedNearDuplicateExclusions ?? []);
const manualExclusions = new Map((config.manualExclusions ?? []).map((item) => [item.referenceId, item.reason.trim()]));
const byId = new Map(inventory.map((entry) => [entry.referenceId, entry]));
const records: AuditRecord[] = [];
const quality: PhotoQualityResult[] = [];
const exactGroups: Array<{ retained: string; excluded: string[]; sha256: string }> = [];
const nearGroups: Array<{ retained: string; excluded: string[]; distance: number; reason: string }> = [];

function bitDistance(a: string, b: string) {
  let value = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let count = 0;
  while (value) { count += Number(value & 1n); value >>= 1n; }
  return count;
}

async function main() {
for (const authorization of config.authorizedFiles) {
  const entry = byId.get(authorization.referenceId);
  if (!entry) throw new Error(`Unknown inventory reference: ${authorization.referenceId}`);
  if (!authorization.authorizationConfirmed) {
    entry.reviewReason = "Authorization not confirmed";
    continue;
  }
  const supplied = path.resolve(root, authorization.suppliedPath);
  entry.suppliedFilename = path.basename(supplied);
  entry.authorizationConfirmed = true;
  if (!existsSync(supplied)) {
    entry.reviewReason = `Supplied file not found: ${authorization.suppliedPath}`;
    continue;
  }
  try {
    const input = readFileSync(supplied);
    const image = sharp(input, { failOn: "error" });
    const meta = await image.metadata();
    if (!meta.width || !meta.height || !meta.format) throw new Error("Image dimensions or format are missing");
    const extension = meta.format === "jpeg" ? "jpg" : meta.format;
    const destinationDirectory = path.join(root, "public/images/originals", entry.category);
    mkdirSync(destinationDirectory, { recursive: true });
    const destination = path.join(destinationDirectory, `${entry.referenceId}.${extension}`);
    if (supplied !== destination) copyFileSync(supplied, destination);
    const sha256 = createHash("sha256").update(input).digest("hex");
    const { data: hashPixels } = await sharp(input).resize(9, 8, { fit: "fill" }).greyscale().raw().toBuffer({ resolveWithObject: true });
    let bits = 0n;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits = (bits << 1n) | BigInt(hashPixels[y * 9 + x] > hashPixels[y * 9 + x + 1] ? 1 : 0);
    const perceptualHash = bits.toString(16).padStart(16, "0");
    const stats = await sharp(input).greyscale().stats();
    const brightness = stats.channels[0].mean;
    const blurSample = await sharp(input).resize({ width: Math.min(meta.width, 700), withoutEnlargement: true }).greyscale().raw().toBuffer({ resolveWithObject: true });
    let edges = 0; let comparisons = 0;
    for (let y = 1; y < blurSample.info.height; y++) for (let x = 1; x < blurSample.info.width; x++) { edges += Math.abs(blurSample.data[y * blurSample.info.width + x] - blurSample.data[y * blurSample.info.width + x - 1]); comparisons++; }
    const blur = comparisons ? edges / comparisons : 0;
    Object.assign(entry, { status: "imported", width: meta.width, height: meta.height, sha256, perceptualHash, reviewReason: null });
    records.push({ entry, authorization, absolutePath: destination, pixels: meta.width * meta.height, ratio: meta.width / meta.height, brightness, blur });
  } catch (error) {
    entry.status = "excluded";
    entry.reviewReason = `Corrupted or undecodable: ${error instanceof Error ? error.message : String(error)}`;
    quality.push({ file: authorization.suppliedPath, flags: ["corrupted"], included: false, reason: entry.reviewReason });
  }
}

const excluded = new Set<string>();
for (const record of records) {
  const reason = manualExclusions.get(record.entry.referenceId);
  if (!reason) continue;
  excluded.add(record.entry.referenceId);
  record.entry.status = "excluded";
  record.entry.reviewReason = `Human-reviewed exclusion: ${reason}`;
}
for (const [sha256, group] of Map.groupBy(records.filter((record) => !excluded.has(record.entry.referenceId)), (record) => record.entry.sha256!)) {
  if (group.length < 2) continue;
  const ranked = group.toSorted((a, b) => b.pixels - a.pixels || Number(a.entry.category === "course") - Number(b.entry.category === "course") || a.entry.sourceOrder - b.entry.sourceOrder);
  const duplicates = ranked.slice(1);
  exactGroups.push({ sha256, retained: ranked[0].entry.referenceId, excluded: duplicates.map((item) => item.entry.referenceId) });
  duplicates.forEach((item) => { excluded.add(item.entry.referenceId); item.entry.status = "excluded"; item.entry.reviewReason = `Exact duplicate of ${ranked[0].entry.referenceId}`; });
}

const candidates = records.filter((record) => !excluded.has(record.entry.referenceId));
for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) {
  const a = candidates[i], b = candidates[j];
  if (excluded.has(a.entry.referenceId) || excluded.has(b.entry.referenceId) || Math.abs(a.ratio - b.ratio) > .02) continue;
  const distance = bitDistance(a.entry.perceptualHash!, b.entry.perceptualHash!);
  if (distance > 5) continue;
  const [retained, rejected] = a.pixels >= b.pixels ? [a, b] : [b, a];
  if (confirmedNearDuplicateExclusions.has(rejected.entry.referenceId)) {
    excluded.add(rejected.entry.referenceId);
    rejected.entry.status = "excluded";
    rejected.entry.reviewReason = `Visually confirmed near-identical to ${retained.entry.referenceId}; lower-resolution copy`;
    nearGroups.push({ retained: retained.entry.referenceId, excluded: [rejected.entry.referenceId], distance, reason: rejected.entry.reviewReason });
  } else {
    rejected.entry.reviewReason = `Possible near-identical match to ${retained.entry.referenceId}; included until visual confirmation`;
    nearGroups.push({ retained: retained.entry.referenceId, excluded: [], distance, reason: `${rejected.entry.referenceId} requires visual confirmation before exclusion` });
  }
}

const manifest: RestaurantPhoto[] = [];
for (const record of records) {
  if (excluded.has(record.entry.referenceId)) continue;
  const flags: PhotoQualityResult["flags"] = [];
  if (Math.min(record.entry.width!, record.entry.height!) < 480) flags.push("tiny");
  if (record.blur < 3.2) flags.push("blurry");
  if (record.brightness < 24) flags.push("underexposed");
  if (flags.length) {
    record.entry.reviewReason = `Included but flagged for review: ${flags.join(", ")}`;
    quality.push({ file: record.authorization.suppliedPath, flags, included: true, reason: "Unique image remains included pending documented review." });
  }
  const source = `/${path.relative(path.join(root, "public"), record.absolutePath).split(path.sep).join("/")}`;
  const blur = await sharp(record.absolutePath).resize({ width: 24, withoutEnlargement: true }).toFormat("webp", { quality: 35 }).toBuffer();
  manifest.push({ id: record.entry.referenceId, src: source, category: record.entry.category, altEn: record.authorization.altEn, altJa: record.authorization.altJa, width: record.entry.width!, height: record.entry.height!, authorized: true, featured: record.authorization.featured, blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}` });
}

for (const entry of inventory) if (entry.status === "missing") entry.reviewReason = "Authorized original not supplied";
writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);
const csvHeaders = ["referenceId", "category", "sourceOrder", "expectedFilename", "localPath", "suppliedFilename", "authorizationConfirmed", "status", "width", "height", "sha256", "perceptualHash", "reviewReason"] as const;
const csv = [csvHeaders.join(","), ...inventory.map((entry) => csvHeaders.map((header) => `"${String(entry[header] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
writeFileSync(path.join(root, "data/authorized-image-inventory.csv"), `${csv}\n`);
writeFileSync(path.join(root, "data/photo-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(path.join(root, "data/duplicate-report.json"), `${JSON.stringify({ exact: exactGroups, nearIdentical: nearGroups }, null, 2)}\n`);
writeFileSync(path.join(root, "data/quality-review.json"), `${JSON.stringify(quality, null, 2)}\n`);
console.log(`Audited ${records.length} authorized files; ${manifest.length} included, ${excluded.size} duplicate exclusions, ${quality.length} quality reviews.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
