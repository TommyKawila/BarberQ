/**
 * Capture ClipperQ Admin v3 screens at 390 / 820 / 1180.
 * Usage: node scripts/capture-admin-v3-screens.mjs [baseUrl]
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "/opt/cursor/artifacts/admin-v3");
const SHOP = "phinxstudio";
const OWNER = "mock-owner-line-id";
const DEMO_SHOP = "ClipperQ Demo";
const BASE = process.argv[2] || process.env.CAPTURE_BASE_URL || "http://localhost:3010";

const VIEWPORTS = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "ipad-820", width: 820, height: 1180 },
  { name: "desktop-1180", width: 1180, height: 820 },
];

const PAGES = [
  { id: "today", path: `/${SHOP}/admin` },
  { id: "team", path: `/${SHOP}/admin/staff` },
  { id: "summary", path: `/${SHOP}/admin/stats` },
  { id: "settings", path: `/${SHOP}/admin/settings` },
  { id: "schedule", path: `/${SHOP}/admin/my-schedule` },
];

async function waitForServer(url, tries = 90) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server not ready: ${url}`);
}

async function renameShop(base) {
  const res = await fetch(`${base}/api/${SHOP}/settings`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${OWNER}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ shopName: DEMO_SHOP }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn("Rename shop:", res.status, text);
  }
}

async function hideChrome(page) {
  await page.addStyleTag({
    content: `
      header span.uppercase, header span.tracking-wide.text-amber-400 {
        display: none !important;
      }
      vercel-live-feedback, #vercel-live-feedback,
      nextjs-portal, [data-nextjs-toast], [data-next-mark-loading],
      #__next-build-watcher, .nextjs-toast-errors-parent {
        display: none !important;
      }
    `,
  });
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("span, div, button")) {
      const t = (el.textContent || "").trim();
      if (/^PROTOTYPE MODE$/i.test(t)) el.style.display = "none";
    }
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await waitForServer(BASE);
  await renameShop(BASE);

  const browser = await chromium.launch({ headless: true });
  const contactTiles = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    for (const route of PAGES) {
      await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(800);
      await hideChrome(page);
      await page.waitForTimeout(200);
      const buf = await page.screenshot({ type: "png", fullPage: false });
      const file = `${route.id}-${vp.name}.png`;
      const path = join(OUT, file);
      await sharp(buf).png().toFile(path);
      console.log("wrote", path);
      if (["today", "team", "summary", "settings"].includes(route.id)) {
        contactTiles.push({ file, label: `${route.id} @ ${vp.width}` });
      }
    }
    await context.close();
  }

  // Contact sheet: 3 cols × rows for key pages at each viewport
  const sheetFiles = VIEWPORTS.flatMap((vp) =>
    ["today", "team", "summary"].map((id) => join(OUT, `${id}-${vp.name}.png`)),
  );
  const tiles = await Promise.all(
    sheetFiles.map(async (f) => {
      const img = sharp(f);
      const meta = await img.metadata();
      const resized = await img.resize({ width: 360, height: 640, fit: "cover", position: "top" }).png().toBuffer();
      return { buf: resized, w: 360, h: 640, meta };
    }),
  );
  const cols = 3;
  const rows = Math.ceil(tiles.length / cols);
  const sheet = sharp({
    create: {
      width: cols * 360 + (cols + 1) * 16,
      height: rows * 640 + (rows + 1) * 16,
      channels: 3,
      background: "#111111",
    },
  });
  const composites = tiles.map((t, i) => ({
    input: t.buf,
    left: 16 + (i % cols) * (360 + 16),
    top: 16 + Math.floor(i / cols) * (640 + 16),
  }));
  const contactPath = join(OUT, "contact-sheet.png");
  await sheet.composite(composites).png().toFile(contactPath);
  console.log("wrote", contactPath);

  await writeFile(
    join(OUT, "manifest.json"),
    JSON.stringify({ base: BASE, viewports: VIEWPORTS, pages: PAGES, out: OUT }, null, 2),
  );

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
