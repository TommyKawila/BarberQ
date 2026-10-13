/**
 * Chroma-key the owner hand-phone green screen (#00FF00), composite a booking
 * screenshot UNDER the Dynamic Island, and write optimized WebP outputs.
 *
 * Usage:
 *   node scripts/composite-hand-phone.mjs [sourcePng]
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public/marketing");
const SCREENS = join(OUT_DIR, "screens");

const DEFAULT_SRC =
  process.argv[2] ||
  "/home/ubuntu/.cursor/projects/workspace/assets/3db5fd34b7a47ebb918a9b126b12856b8a88e564903a2956f82cfc902b7c03ab.png";

// Prefer raw capture so we can size the safe area to THIS photo's island
const SCREENSHOT_RAW = join(SCREENS, "raw/choose-slot.webp");
const SCREENSHOT_PADDED = join(SCREENS, "choose-slot.webp");

/** Soft green chroma: high G, low R/B */
function greenScore(r, g, b) {
  if (g < 80) return 0;
  const dominance = g - Math.max(r, b);
  if (dominance < 20) return 0;
  // 0..1 how "green screen" this pixel is
  const raw = Math.min(1, Math.max(0, (dominance - 20) / 100));
  const greenBoost = Math.min(1, Math.max(0, (g - 100) / 120));
  return raw * 0.65 + greenBoost * 0.35;
}

function isIslandDark(r, g, b) {
  return (r + g + b) / 3 < 48 && g < 60;
}

async function analyze(raw, width, height, channels) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let count = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const score = greenScore(raw[i], raw[i + 1], raw[i + 2]);
      if (score > 0.55) {
        count++;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!count) throw new Error("No green screen detected");

  const midX = (minX + maxX) / 2;
  let iMinX = width;
  let iMaxX = 0;
  let iMinY = height;
  let iMaxY = 0;
  let islandCount = 0;
  const topBand = minY + Math.floor((maxY - minY) * 0.14);

  for (let y = minY; y <= topBand; y++) {
    for (let x = minX; x <= maxX; x++) {
      const i = (y * width + x) * channels;
      const r = raw[i];
      const g = raw[i + 1];
      const b = raw[i + 2];
      if (isIslandDark(r, g, b) && Math.abs(x - midX) < (maxX - minX) * 0.32) {
        islandCount++;
        if (x < iMinX) iMinX = x;
        if (x > iMaxX) iMaxX = x;
        if (y < iMinY) iMinY = y;
        if (y > iMaxY) iMaxY = y;
      }
    }
  }

  // Pad island slightly so screenshot never peeks around it
  const padX = 2;
  const padY = 2;
  return {
    screen: { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 },
    island:
      islandCount > 100
        ? {
            minX: Math.max(minX, iMinX - padX),
            minY: Math.max(minY, iMinY - padY),
            maxX: Math.min(maxX, iMaxX + padX),
            maxY: Math.min(maxY, iMaxY + padY),
          }
        : null,
  };
}

function insideRoundedIsland(x, y, island) {
  if (!island) return false;
  const { minX, minY, maxX, maxY } = island;
  if (x < minX || x > maxX || y < minY || y > maxY) return false;
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const rx = w / 2;
  const ry = h / 2;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const nx = (x - cx) / rx;
  const ny = (y - cy) / ry;
  return nx * nx + ny * ny <= 1.05;
}

/** Build hand layer with green keyed out; island stays opaque black. */
function keyHand(raw, width, height, channels, island) {
  const out = Buffer.from(raw);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];

      if (insideRoundedIsland(x, y, island) || isIslandDark(r, g, b) && greenScore(r, g, b) < 0.2) {
        // Force solid black island on top
        if (insideRoundedIsland(x, y, island)) {
          out[i] = 0;
          out[i + 1] = 0;
          out[i + 2] = 0;
          out[i + 3] = 255;
        }
        continue;
      }

      const score = greenScore(r, g, b);
      if (score <= 0.08) continue;

      // Soft matte — higher score → more transparent
      const alpha = Math.round(255 * (1 - Math.min(1, score * 1.15)));
      out[i + 3] = Math.min(out[i + 3], alpha);

      // Despill: pull green toward neutral on semi-transparent fringe
      if (alpha > 0 && alpha < 250) {
        const maxRB = Math.max(r, b);
        out[i + 1] = Math.min(g, maxRB + 8);
      }
      // Fully transparent green core
      if (score > 0.7) {
        out[i] = 0;
        out[i + 1] = 0;
        out[i + 2] = 0;
        out[i + 3] = 0;
      }
    }
  }
  return out;
}

async function buildScreenshotPlate(screen, island) {
  const { access } = await import("node:fs/promises");
  const { statusBarPng, STATUS_BAR_PT } = await import("./lib/ios-statusbar.mjs");

  let src = SCREENSHOT_PADDED;
  try {
    await access(SCREENSHOT_RAW);
    src = SCREENSHOT_RAW;
  } catch {
    /* use padded */
  }

  // Safe area must clear the photo island + BrandMark (~36px) breathing room
  const islandBottom = island ? island.maxY - screen.minY : 0;
  const safeH = Math.max(
    Math.round((STATUS_BAR_PT * screen.w) / 390),
    islandBottom + 40,
  );
  const contentH = screen.h - safeH;
  const bar = await statusBarPng(screen.w, safeH);
  const content = await sharp(src)
    .resize(screen.w, contentH, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  const stacked = await sharp({
    create: {
      width: screen.w,
      height: screen.h,
      channels: 4,
      background: { r: 9, g: 9, b: 11, alpha: 1 },
    },
  })
    .composite([
      { input: bar, top: 0, left: 0 },
      { input: content, top: safeH, left: 0 },
    ])
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log("hand safe area", { safeH, islandBottom, contentH });
  return stacked;
}

async function compositeFull(handPath) {
  const { data: raw, info } = await sharp(handPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const { screen, island } = await analyze(raw, width, height, channels);
  console.log("screen", screen);
  console.log("island", island);

  const keyed = keyHand(raw, width, height, channels, island);
  const plate = await buildScreenshotPlate(screen, island);

  // Start from screenshot plate placed into full canvas, then overlay keyed hand
  const base = Buffer.alloc(width * height * 4, 0);
  // Fill non-screen with black (will be covered by hand photo)
  for (let i = 3; i < base.length; i += 4) base[i] = 255;

  const { data: shot, info: shotInfo } = plate;
  for (let y = 0; y < screen.h; y++) {
    for (let x = 0; x < screen.w; x++) {
      const si = (y * shotInfo.width + x) * shotInfo.channels;
      const di = ((screen.minY + y) * width + (screen.minX + x)) * 4;
      base[di] = shot[si];
      base[di + 1] = shot[si + 1];
      base[di + 2] = shot[si + 2];
      base[di + 3] = 255;
    }
  }

  // Alpha-composite keyed hand over base
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    const sr = base[o];
    const sg = base[o + 1];
    const sb = base[o + 2];
    const hr = keyed[o];
    const hg = keyed[o + 1];
    const hb = keyed[o + 2];
    const ha = keyed[o + 3] / 255;
    out[o] = Math.round(hr * ha + sr * (1 - ha));
    out[o + 1] = Math.round(hg * ha + sg * (1 - ha));
    out[o + 2] = Math.round(hb * ha + sb * (1 - ha));
    out[o + 3] = 255;
  }

  return {
    width,
    height,
    screen,
    island,
    buffer: out,
    keyedHand: keyed,
  };
}

async function writeWebp(raw, width, height, path, { width: tw, quality = 84 } = {}) {
  let pipeline = sharp(raw, { raw: { width, height, channels: 4 } });
  if (tw && tw < width) {
    pipeline = pipeline.resize(tw, Math.round((tw / width) * height), {
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  await pipeline.webp({ quality, effort: 5 }).toFile(path);
  console.log("wrote", path);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(join(OUT_DIR, "hero"), { recursive: true });

  // 1) Optimized green-screen source (for reference / future re-composite)
  await sharp(DEFAULT_SRC)
    .webp({ quality: 88, effort: 5 })
    .toFile(join(OUT_DIR, "hand-phone.webp"));
  console.log("wrote hand-phone.webp");

  const result = await compositeFull(DEFAULT_SRC);

  // 2) Full-res composited hero
  await writeWebp(result.buffer, result.width, result.height, join(OUT_DIR, "hero/hand-phone-composited.webp"), {
    quality: 85,
  });

  // 3) Desktop (~720w) pre-render
  await writeWebp(result.buffer, result.width, result.height, join(OUT_DIR, "hero/hand-phone-desktop.webp"), {
    width: 720,
    quality: 84,
  });

  // 4) Mobile: tight crop around phone (minimal hand margin), high-res for iPhone DPR3
  const { screen } = result;
  // Keep a sliver of hand/bezel so it still reads as "held phone", but maximize screen pixels
  const padX = Math.round(screen.w * 0.06);
  const padTop = Math.round(screen.h * 0.04);
  const padBottom = Math.round(screen.h * 0.06);
  const cropLeft = Math.max(0, screen.minX - padX);
  const cropTop = Math.max(0, screen.minY - padTop);
  const cropRight = Math.min(result.width, screen.maxX + padX);
  const cropBottom = Math.min(result.height, screen.maxY + padBottom);
  const crop = {
    left: cropLeft,
    top: cropTop,
    width: cropRight - cropLeft,
    height: cropBottom - cropTop,
  };
  const mobileTargetW = 1284; // 428 CSS px @3x
  const mobilePath = join(OUT_DIR, "hero/hand-phone-mobile.webp");
  await sharp(result.buffer, {
    raw: { width: result.width, height: result.height, channels: 4 },
  })
    .extract(crop)
    .resize(mobileTargetW, Math.round((mobileTargetW / crop.width) * crop.height), {
      fit: "fill",
      kernel: "lanczos3",
    })
    .webp({ quality: 88, effort: 5 })
    .toFile(mobilePath);
  const mobileMeta = await sharp(mobilePath).metadata();
  console.log("wrote", mobilePath, `${mobileMeta.width}x${mobileMeta.height}`, "crop", crop);

  // Persist detected coords for docs/tests
  const meta = {
    image: { width: result.width, height: result.height },
    screen: result.screen,
    island: result.island,
    mobileCrop: crop,
    mobileSize: { width: mobileMeta.width, height: mobileMeta.height },
    screenshot: "screens/choose-slot.webp",
  };
  await sharp(Buffer.from(JSON.stringify(meta, null, 2)))
    .toBuffer()
    .catch(() => null);
  const { writeFile } = await import("node:fs/promises");
  await writeFile(join(OUT_DIR, "hero/hand-phone-meta.json"), JSON.stringify(meta, null, 2));
  console.log("meta", meta);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
