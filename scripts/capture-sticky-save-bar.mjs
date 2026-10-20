/**
 * Capture barber-edit sticky save bar at 1024 (lg sidebar) and 390.
 * Memory-mode only. Usage: node scripts/capture-sticky-save-bar.mjs [baseUrl]
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const OUT = "/opt/cursor/artifacts/sticky-save-bar";
const SHOP = "phinxstudio";
const BARBER_ID = "22222222-2222-4222-8222-222222222222"; // Tide — shows remove + checkbox
const BASE = process.argv[2] || process.env.CAPTURE_BASE_URL || "http://localhost:3010";
const PATH = `/${SHOP}/admin/staff/${BARBER_ID}`;

const VIEWPORTS = [
  { name: "ipad-1024", width: 1024, height: 768 },
  { name: "mobile-390", width: 390, height: 844 },
];

async function waitForServer(url, tries = 60) {
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

async function hideChrome(page) {
  await page.addStyleTag({
    content: `
      vercel-live-feedback, #vercel-live-feedback,
      nextjs-portal, [data-nextjs-toast], [data-nextjs-dev-overlay] {
        display: none !important;
      }
    `,
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await waitForServer(BASE);

  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await page.goto(`${BASE}${PATH}`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForSelector('[data-testid="admin-sticky-save-bar"]', { timeout: 20000 });
    // Scroll so the photo checkbox sits behind / above the sticky bar region
    await page.evaluate(() => {
      const checkbox = Array.from(document.querySelectorAll("label, p, span")).find((el) =>
        /แสดงรูป|Show photo|booking/i.test(el.textContent || ""),
      );
      checkbox?.scrollIntoView({ block: "end" });
    });
    await page.waitForTimeout(500);
    await hideChrome(page);

    const bar = page.locator('[data-testid="admin-sticky-save-bar"]');
    const box = await bar.boundingBox();
    if (!box) throw new Error(`No save bar box at ${vp.name}`);
    console.log(
      `${vp.name}: save-bar x=${Math.round(box.x)} y=${Math.round(box.y)} w=${Math.round(box.width)} h=${Math.round(box.height)}`,
    );
    if (vp.width >= 1024 && box.x < 200) {
      throw new Error(`${vp.name}: expected lg:left-56 (~224px), got x=${box.x}`);
    }
    if (vp.width < 1024 && box.x > 8) {
      console.warn(`${vp.name}: mobile bar x=${box.x} (expected ~0)`);
    }

    const buf = await page.screenshot({ type: "png", fullPage: false });
    const outPath = join(OUT, `barber-edit-save-bar-${vp.name}.png`);
    await sharp(buf).png().toFile(outPath);
    console.log("wrote", outPath);
    await context.close();
  }

  await browser.close();
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
