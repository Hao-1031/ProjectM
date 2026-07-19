import sharp from "sharp";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, "..");
const svgPath = join(root, "public", "icon.svg");

async function main() {
  const svg = readFileSync(svgPath);

  await sharp(svg, { density: 192 })
    .resize(192, 192)
    .png()
    .toFile(join(root, "public", "icon-192.png"));
  console.log("Generated public/icon-192.png");

  await sharp(svg, { density: 512 })
    .resize(512, 512)
    .png()
    .toFile(join(root, "public", "icon-512.png"));
  console.log("Generated public/icon-512.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
