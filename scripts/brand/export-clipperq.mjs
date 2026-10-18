/**
 * Export ClipperQ PNG/ICO assets from public/brand/clipperq/*.svg
 * Run: node scripts/brand/export-clipperq.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import toIco from "to-ico";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const BRAND = join(ROOT, "public/brand/clipperq");
const APP = join(ROOT, "src/app");

function renderSvgFile(name, width) {
  const svg = readFileSync(join(BRAND, name));
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    background: "transparent",
  });
  return Buffer.from(resvg.render().asPng());
}

async function writePng(path, buffer) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, buffer);
  console.log("wrote", path.replace(ROOT + "/", ""));
}

async function main() {
  mkdirSync(BRAND, { recursive: true });

  // Favicon sizes from dark transparent icon
  const fav16 = await sharp(renderSvgFile("icon-dark-transparent.svg", 16)).png().toBuffer();
  const fav32 = await sharp(renderSvgFile("icon-dark-transparent.svg", 32)).png().toBuffer();
  const fav48 = await sharp(renderSvgFile("icon-dark-transparent.svg", 48)).png().toBuffer();
  await writePng(join(BRAND, "favicon-16.png"), fav16);
  await writePng(join(BRAND, "favicon-32.png"), fav32);
  await writePng(join(BRAND, "favicon-48.png"), fav48);

  const ico = await toIco([fav16, fav32, fav48]);
  await writePng(join(BRAND, "favicon.ico"), ico);
  await writePng(join(APP, "favicon.ico"), ico);
  await writePng(join(ROOT, "public/favicon.ico"), ico);

  // App icons from white-bg square
  const apple = await sharp(renderSvgFile("icon-white-bg.svg", 180)).png().toBuffer();
  await writePng(join(BRAND, "apple-touch-icon.png"), apple);
  await writePng(join(APP, "apple-icon.png"), apple);

  const icon192 = await sharp(renderSvgFile("icon-white-bg.svg", 192)).png().toBuffer();
  const icon512 = await sharp(renderSvgFile("icon-white-bg.svg", 512)).png().toBuffer();
  await writePng(join(BRAND, "icon-192.png"), icon192);
  await writePng(join(BRAND, "icon-512.png"), icon512);

  // Maskable: white 512 canvas, artwork max side ~56% (~287px), centred
  const maskArt = await sharp(renderSvgFile("icon-dark-transparent.svg", 287))
    .ensureAlpha()
    .png()
    .toBuffer();
  const maskable = await sharp({
    create: { width: 512, height: 512, channels: 3, background: "#FFFFFF" },
  })
    .composite([{ input: maskArt, gravity: "centre" }])
    .png()
    .toBuffer();
  await writePng(join(BRAND, "maskable-512.png"), maskable);

  // OG 1200x630: lockup-dark ~960 wide, centred on white
  const lockup = await sharp(renderSvgFile("lockup-dark.svg", 960)).png().toBuffer();
  const og = await sharp({
    create: { width: 1200, height: 630, channels: 3, background: "#FFFFFF" },
  })
    .composite([{ input: lockup, gravity: "centre" }])
    .png()
    .toBuffer();
  await writePng(join(BRAND, "og.png"), og);

  // Push / PWA helpers (cream icon for dark UI chrome)
  const mark64 = await sharp(renderSvgFile("icon-cream-transparent.svg", 64)).png().toBuffer();
  const appIconDark = await sharp(renderSvgFile("icon-black-bg.svg", 192)).png().toBuffer();
  await writePng(join(BRAND, "mark-cream-64.png"), mark64);
  await writePng(join(BRAND, "app-icon-dark.png"), appIconDark);

  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
