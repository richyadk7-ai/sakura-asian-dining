import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import manifest from "../data/photo-manifest.json";

const tileWidth = 240;
const tileHeight = 200;
const columns = 4;
const categories = ["food", "drinks", "interior", "exterior", "course"];

async function main() {
  mkdirSync(path.join(process.cwd(), "work"), { recursive: true });

  for (const category of categories) {
    const photos = manifest.filter((photo) => photo.category === category);
    if (!photos.length) continue;
    const rows = Math.ceil(photos.length / columns);
    const tiles = await Promise.all(photos.map(async (photo) => {
      const source = path.join(process.cwd(), "public", photo.src.replace(/^\//, ""));
      const image = await sharp(source).resize({ width: tileWidth, height: 170, fit: "contain", background: "#171111" }).jpeg({ quality: 82 }).toBuffer();
      const label = Buffer.from(`<svg width="${tileWidth}" height="30"><rect width="100%" height="100%" fill="#f4eadc"/><text x="10" y="20" font-family="Arial" font-size="14" fill="#3c0b15">${photo.id}</text></svg>`);
      return sharp({ create: { width: tileWidth, height: tileHeight, channels: 3, background: "#171111" } }).composite([{ input: image, top: 0, left: 0 }, { input: label, top: 170, left: 0 }]).jpeg({ quality: 86 }).toBuffer();
    }));
    const sheet = await sharp({ create: { width: columns * tileWidth, height: rows * tileHeight, channels: 3, background: "#090707" } }).composite(tiles.map((input, index) => ({ input, left: (index % columns) * tileWidth, top: Math.floor(index / columns) * tileHeight }))).jpeg({ quality: 88 }).toBuffer();
    writeFileSync(path.join(process.cwd(), `work/contact-${category}.jpg`), sheet);
  }

  console.log("Contact sheets written to work/.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
