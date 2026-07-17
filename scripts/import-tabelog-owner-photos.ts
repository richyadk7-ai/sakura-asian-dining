import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { RestaurantPhotoCategory } from "../types";

type SourcePhoto = {
  referenceId: string;
  category: RestaurantPhotoCategory;
  sourceOrder: number;
  tabelogPhotoId: string;
  sourcePage: string;
  sourceUrl: string;
  downloadedUrl: string;
  originalCaptionJa: string | null;
  suppliedPath: string;
  altEn: string;
  altJa: string;
  posterType: "owner";
};

const root = process.cwd();
const base = "https://tabelog.com/tokyo/A1305/A130503/13218334/dtlphotolst";
const categories: Array<{ category: RestaurantPhotoCategory; code: number; expected: number }> = [
  { category: "food", code: 1, expected: 37 },
  { category: "drinks", code: 7, expected: 3 },
  { category: "interior", code: 3, expected: 14 },
  { category: "exterior", code: 4, expected: 1 },
];
const translations: Record<string, string> = {
  "グリーンサラダ": "Green salad",
  "コース": "Course meal",
  "シークカバブ": "Seekh kebab",
  "シーザーサラダ": "Caesar salad",
  "タンドリーチキン1羽": "Whole tandoori chicken",
  "タンドリーチキンハーフ": "Half tandoori chicken",
  "チーズチキン": "Cheese chicken",
  "ディナーレディースセット": "Dinner ladies’ set",
  "ランチセット": "Lunch set",
  "焼きラム": "Grilled lamb",
  "ドリンク": "Drinks",
  "ドリンク写真": "Drink selection",
  "テーブル席_4名": "Four-seat table",
  "ボックス席_4名": "Four-seat booth",
  "全景": "Dining room overview",
  "内観写真": "Restaurant interior",
  "外観": "Restaurant exterior",
};
const visualDescriptions: Record<string, { en: string; ja: string }> = {
  "food-001": { en: "Seasoned edamame with sliced garlic", ja: "スライスしたニンニクを添えた味付き枝豆" },
  "food-002": { en: "Stir-fried sliced meat with onions and green chives", ja: "玉ねぎとニラを添えた薄切り肉の炒め物" },
  "food-003": { en: "Yogurt raita with diced vegetables and herbs", ja: "刻み野菜とハーブ入りのライタ" },
  "food-004": { en: "French fries with tomato ketchup", ja: "ケチャップを添えたフライドポテト" },
  "food-005": { en: "Basket of crisp papad", ja: "かごに盛り付けたパパド" },
  "food-006": { en: "Grilled chicken salad with boiled eggs and mixed greens", ja: "ゆで卵と葉野菜を添えたグリルチキンサラダ" },
  "food-007": { en: "Mixed bean salad with diced vegetables", ja: "刻み野菜入りのミックスビーンズサラダ" },
  "food-008": { en: "Plate of sliced fresh tomatoes", ja: "スライスしたトマトの盛り合わせ" },
  "food-009": { en: "Fresh shrimp rolls with lettuce and dipping sauce", ja: "レタスとつけだれを添えた海老の生春巻き" },
  "food-010": { en: "Melted cheese stretching from freshly baked cheese naan", ja: "焼きたてのチーズナンから伸びる溶けたチーズ" },
  "food-022": { en: "Orange curry garnished with cream", ja: "クリームを添えたオレンジ色のカレー" },
  "food-023": { en: "Spinach curry with paneer cubes and cream", ja: "パニールとクリームを添えたほうれん草カレー" },
  "food-024": { en: "Round naan topped with golden melted cheese", ja: "こんがり溶けたチーズをのせた丸いナン" },
  "food-025": { en: "Orange curry garnished with cream and cashews", ja: "クリームとカシューナッツを添えたオレンジ色のカレー" },
  "food-026": { en: "Spinach curry finished with a cream swirl", ja: "クリームを渦巻き状に添えたほうれん草カレー" },
  "food-027": { en: "Spinach curry topped with shredded ginger and cream", ja: "細切り生姜とクリームを添えたほうれん草カレー" },
  "food-028": { en: "Set meal with naan, curries, grilled dishes, rice, salad and drinks", ja: "ナン、カレー、グリル料理、ライス、サラダ、ドリンクのセット" },
  "food-029": { en: "Cheese-filled naan with melted cheese being lifted", ja: "溶けたチーズを持ち上げたチーズ入りナン" },
  "food-030": { en: "Tandoori chicken on a sizzling vegetable platter", ja: "野菜と一緒に鉄板で提供するタンドリーチキン" },
  "food-031": { en: "Vegetable curry with cauliflower, peppers and green beans", ja: "カリフラワー、パプリカ、いんげん入りの野菜カレー" },
  "food-032": { en: "Spinach curry served in a copper bowl", ja: "銅製の器で提供するほうれん草カレー" },
  "food-033": { en: "Naan served with spinach curry and salad", ja: "ほうれん草カレーとサラダを添えたナン" },
  "food-034": { en: "Steamed momo dumplings with dipping sauce", ja: "つけだれを添えた蒸しモモ" },
  "food-035": { en: "Stir-fried flat noodles with chicken and vegetables", ja: "鶏肉と野菜入りの平麺炒め" },
  "food-036": { en: "Stir-fried noodles with meat and vegetables", ja: "肉と野菜入りの炒め麺" },
  "food-037": { en: "Cheese-topped grilled chicken and vegetables lifted with chopsticks", ja: "箸で持ち上げたチーズのせグリルチキンと野菜" },
  "drinks-001": { en: "Selection of spirits, Asian beer, lassi and wine", ja: "スピリッツ、アジアビール、ラッシー、ワインの品揃え" },
  "drinks-002": { en: "Selection of cocktails, wine, spirits and soft drinks", ja: "カクテル、ワイン、スピリッツ、ソフトドリンクの品揃え" },
  "drinks-003": { en: "Three glasses of draft beer raised in a toast", ja: "乾杯する3杯の生ビール" },
  "exterior-001": { en: "Sakura Asian Dining & Bar storefront and entrance", ja: "さくらアジアンダイニング&バーの店頭と入口" },
};

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)));
}

function originalUrl(url: string) {
  const parsed = new URL(url);
  const parts = parsed.pathname.split("/");
  parts[parts.length - 1] = parts.at(-1)!.replace(/^\d+x\d+_(?:rect|square)_/, "");
  parsed.pathname = parts.join("/");
  parsed.search = "";
  return parsed.toString();
}

async function fetchText(url: string) {
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0", "accept-language": "ja,en;q=0.8" } });
  if (!response.ok) throw new Error(`Could not read ${url}: ${response.status}`);
  return response.text();
}

async function downloadImage(primary: string, fallback: string) {
  for (const url of [primary, fallback]) {
    const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0", referer: "https://tabelog.com/" } });
    if (response.ok && response.headers.get("content-type")?.startsWith("image/")) return { bytes: Buffer.from(await response.arrayBuffer()), url, contentType: response.headers.get("content-type")! };
  }
  throw new Error(`Could not download original or fallback: ${primary}`);
}

async function main() {
  const sources: SourcePhoto[] = [];
  for (const group of categories) {
    const sourcePage = `${base}/${group.code}/smp2/?mode=owner`;
    const html = await fetchText(sourcePage);
    const cards = [...html.matchAll(/<li class="rstdtl-thumb-list__item">([\s\S]*?)<\/li>/g)]
      .map((match) => match[1])
      .filter((card) => card.includes("data-analytics-post-type='owner'"));
    if (cards.length !== group.expected) throw new Error(`${group.category}: expected ${group.expected} owner photos, found ${cards.length}`);
    for (const [index, card] of cards.entries()) {
      const href = decodeHtml(card.match(/<a href="([^"]+)"[^>]*data-id=/)?.[1] ?? "");
      const tabelogPhotoId = card.match(/data-id="([^"]+)"/)?.[1];
      const rawAlt = decodeHtml(card.match(/<img[^>]+alt="([^"]*)"/)?.[1] ?? "").replace(/^さくらアジアンダイニング&バー -\s*/, "").trim();
      if (!href || !tabelogPhotoId) throw new Error(`Could not parse ${group.category} card ${index + 1}`);
      const referenceId = `${group.category}-${String(index + 1).padStart(3, "0")}`;
      const preferredUrl = originalUrl(href);
      const downloaded = await downloadImage(preferredUrl, href);
      const extension = downloaded.contentType.includes("png") ? "png" : downloaded.contentType.includes("webp") ? "webp" : downloaded.contentType.includes("avif") ? "avif" : "jpg";
      const suppliedPath = `photo-imports/tabelog-owner/${group.category}/${tabelogPhotoId}.${extension}`;
      const destination = path.join(root, suppliedPath);
      mkdirSync(path.dirname(destination), { recursive: true });
      writeFileSync(destination, downloaded.bytes);
      const categoryEn = group.category === "drinks" ? "drink" : group.category;
      const categoryJa = group.category === "food" ? "料理" : group.category === "drinks" ? "ドリンク" : group.category === "interior" ? "店内" : "外観";
      const visualDescription = visualDescriptions[referenceId];
      sources.push({
        referenceId,
        category: group.category,
        sourceOrder: index + 1,
        tabelogPhotoId,
        sourcePage,
        sourceUrl: href,
        downloadedUrl: downloaded.url,
        originalCaptionJa: rawAlt || null,
        suppliedPath,
        altEn: visualDescription ? `${visualDescription.en} at Sakura Asian Dining & Bar` : rawAlt ? `${translations[rawAlt] ?? categoryEn} at Sakura Asian Dining & Bar` : `Restaurant-provided ${categoryEn} photograph ${index + 1} at Sakura Asian Dining & Bar`,
        altJa: visualDescription ? `さくらアジアンダイニング&バーの${visualDescription.ja}` : rawAlt ? `さくらアジアンダイニング&バーの${rawAlt}` : `さくらアジアンダイニング&バーの店舗提供${categoryJa}写真 ${index + 1}`,
        posterType: "owner",
      });
    }
  }

  const courseReuse = [
    { referenceId: "course-001", sourcePhotoId: "99733839", altEn: "Sakura group course meal", altJa: "さくらの宴会コース料理" },
    { referenceId: "course-002", sourcePhotoId: "99733839", altEn: "Sakura all-you-can-eat and drink course meal", altJa: "さくら食べ飲み放題コース料理" },
    { referenceId: "course-003", sourcePhotoId: "121383743", altEn: "Tandoori barbecue course platter", altJa: "串焼きタンドリーBBQコース料理" },
    { referenceId: "course-004", sourcePhotoId: "99733839", altEn: "Sakura special drink course meal", altJa: "さくらスペシャル飲み放題コース料理" },
    { referenceId: "course-005", sourcePhotoId: "99733839", altEn: "Grilled chicken drink course meal", altJa: "グリルチキン付き飲み放題コース料理" },
  ];
  const courseAuthorizations = courseReuse.map((course, index) => {
    const source = sources.find((photo) => photo.tabelogPhotoId === course.sourcePhotoId);
    if (!source) throw new Error(`Course source photo ${course.sourcePhotoId} was not found`);
    return { referenceId: course.referenceId, suppliedPath: source.suppliedPath, authorizationConfirmed: true, altEn: course.altEn, altJa: course.altJa, featured: false, sourceUrl: source.sourceUrl, posterType: "owner", reusedFrom: source.referenceId, sourceOrder: index + 1 };
  });
  const current = JSON.parse(readFileSync(path.join(root, "data/image-authorization.json"), "utf8")) as { confirmedNearDuplicateExclusions?: string[]; manualExclusions?: Array<{ referenceId: string; reason: string }> };
  const authorizations = sources.map((photo) => ({ referenceId: photo.referenceId, suppliedPath: photo.suppliedPath, authorizationConfirmed: true, altEn: photo.altEn, altJa: photo.altJa, featured: photo.referenceId === "interior-003", sourceUrl: photo.sourceUrl, posterType: photo.posterType, tabelogPhotoId: photo.tabelogPhotoId }));
  writeFileSync(path.join(root, "data/image-authorization.json"), `${JSON.stringify({ authorizedFiles: [...authorizations, ...courseAuthorizations], confirmedNearDuplicateExclusions: current.confirmedNearDuplicateExclusions ?? [], manualExclusions: current.manualExclusions ?? [] }, null, 2)}\n`);
  writeFileSync(path.join(root, "data/tabelog-owner-photo-sources.json"), `${JSON.stringify({ verifiedAt: new Date().toISOString(), ownerPhotoCount: sources.length, excludedCustomerPhotoCount: 92, sources }, null, 2)}\n`);
  console.log(`Downloaded ${sources.length} restaurant-provided originals and mapped ${courseAuthorizations.length} course slots.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
