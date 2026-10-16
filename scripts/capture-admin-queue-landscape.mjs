/**
 * Capture the current admin queue board in landscape for the barber-iPad composite.
 *
 * Usage:
 *   node scripts/capture-admin-queue-landscape.mjs [baseUrl]
 *
 * Expects local memory-mode Next.js (default http://localhost:3010).
 * Writes:
 *   public/marketing/screens/admin-queue-landscape.{png,webp}
 *   public/marketing/screens/raw/admin-queue-landscape.{png,webp}
 *
 * After capture, re-composite:
 *   python3 scripts/composite-barber-ipad-queue.py
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "public/marketing/screens");
const RAW = join(OUT, "raw");
const DEMO_SHOP = "BarberQx Demo";
const SHOP = "phinxstudio";
const OWNER = "mock-owner-line-id";
const BASE = process.argv[2] || process.env.CAPTURE_BASE_URL || "http://localhost:3010";

const VIEW = { width: 1180, height: 820 };
const SCALE = 2;

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
    throw new Error(`Rename shop failed: ${res.status} ${await res.text()}`);
  }
}

async function seedBooking(page, label) {
  await page.goto(`${BASE}/${SHOP}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(700);
  const avail = page.locator("button:not([disabled])").filter({
    hasText: /^\d{1,2}:\d{2}$/,
  });
  if ((await avail.count()) === 0) return;
  await avail.first().click();
  await page.waitForTimeout(350);
  const nameInput = page.locator("input").first();
  if (await nameInput.count()) await nameInput.fill(label);
  const phone = page.locator('input[inputmode="tel"]');
  if (await phone.count()) await phone.fill("0812345678");
  const confirm = page.getByRole("button", { name: /ยืนยัน|Confirm|จอง/i }).last();
  await confirm.click().catch(() => {});
  await page.waitForTimeout(900);
}

async function hideChrome(page) {
  await page.addStyleTag({
    content: `
      vercel-live-feedback, #vercel-live-feedback,
      nextjs-portal, [data-nextjs-toast], #__next-build-watcher {
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
  await mkdir(RAW, { recursive: true });
  await waitForServer(BASE);
  await renameShop(BASE);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEW,
    deviceScaleFactor: SCALE,
    locale: "th-TH",
    colorScheme: "dark",
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("barberq_customer_ref", "mock-demo-customer");
      localStorage.setItem("barberq_phone", "0812345678");
    } catch {
      /* ignore */
    }
  });
  const page = await context.newPage();

  await seedBooking(page, "Demo Guest").catch(() => {});
  await seedBooking(page, "Walk-in Demo").catch(() => {});

  await page.goto(`${BASE}/${SHOP}/admin`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1400);
  await hideChrome(page);

  const buf = await page.screenshot({ type: "png", fullPage: false });
  const pngName = "admin-queue-landscape.png";
  const webpName = "admin-queue-landscape.webp";
  await sharp(buf).png().toFile(join(RAW, pngName));
  await sharp(buf).webp({ quality: 88, effort: 4 }).toFile(join(RAW, webpName));
  await sharp(buf).png().toFile(join(OUT, pngName));
  await sharp(buf).webp({ quality: 88, effort: 4 }).toFile(join(OUT, webpName));
  const meta = await sharp(buf).metadata();
  console.log(`wrote ${OUT}/${webpName} (${meta.width}×${meta.height})`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
