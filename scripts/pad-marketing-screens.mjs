/**
 * Bake an iOS status-bar safe area into every marketing screen WebP
 * so shop chrome sits below the Dynamic Island in PhoneFrame + hand composite.
 * Reads from screens/raw/ when present (avoids double-padding).
 */
import { access, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { withStatusBar } from "./lib/ios-statusbar.mjs";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, "../public/marketing/screens");
const RAW = join(DIR, "raw");

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const sourceDir = (await exists(RAW)) ? RAW : DIR;
  const files = (await readdir(sourceDir)).filter((f) => f.endsWith(".webp"));
  for (const file of files) {
    const src = join(sourceDir, file);
    const dest = join(DIR, file);
    const { data, info } = await withStatusBar(src);
    await sharp(data).webp({ quality: 82, effort: 4 }).toFile(dest);
    console.log("padded", file, `${info.width}x${info.height}`, `(from ${sourceDir === RAW ? "raw" : "screens"})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
