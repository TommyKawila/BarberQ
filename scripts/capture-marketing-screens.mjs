/**
 * Capture real ClipperQ booking/admin screens at 390×844 @2x → WebP.
 * Usage: node scripts/capture-marketing-screens.mjs [baseUrl]
 * Expects local memory-mode Next.js (no LIFF / no Supabase).
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "public/marketing/screens");
const RAW_OUT = join(OUT, "raw");
const DEMO_SHOP = "ClipperQ Demo";
const SHOP = "phinxstudio";
const OWNER = "mock-owner-line-id";
const VIEW = { width: 390, height: 844 };
const SCALE = 2;

// Use localhost (not 127.0.0.1) so Next.js turbopack HMR allows the origin.
const BASE = process.argv[2] || process.env.CAPTURE_BASE_URL || "http://localhost:3010";

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
    const text = await res.text();
    throw new Error(`Rename shop failed: ${res.status} ${text}`);
  }
}

async function saveWebp(buffer, name) {
  await mkdir(RAW_OUT, { recursive: true });
  const sized = await sharp(buffer)
    .resize(VIEW.width * SCALE, VIEW.height * SCALE, { fit: "cover", position: "top" })
    .webp({ quality: 84, effort: 4 })
    .toBuffer();
  // Raw (no status bar) — pad step bakes safe area into public screens/
  const rawPath = join(RAW_OUT, `${name}.webp`);
  await sharp(sized).toFile(rawPath);
  await sharp(sized).toFile(join(OUT, `${name}.webp`));
  console.log("wrote", rawPath);
}

async function shot(page, name, { scrollY = 0 } = {}) {
  if (scrollY) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(200);
  } else {
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  const buf = await page.screenshot({ type: "png", fullPage: false });
  await saveWebp(buf, name);
}

async function hideChrome(page) {
  await page.addStyleTag({
    content: `
      /* Prototype badge in BookingHero */
      header span.uppercase, header span.tracking-wide.text-amber-400 {
        display: none !important;
      }
      /* Next.js / Vercel floating widgets */
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
      if (/^PROTOTYPE MODE$/i.test(t) || /^N$/i.test(t) && el.getBoundingClientRect().width < 48) {
        el.style.display = "none";
      }
    }
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });
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

  // 1) Shop landing
  await page.goto(`${BASE}/${SHOP}`, { waitUntil: "networkidle" });
  await page.waitForFunction(
    (name) => document.body?.innerText?.includes(name),
    DEMO_SHOP,
    { timeout: 45000 },
  );
  await page.waitForSelector("h1", { timeout: 15000 });
  await hideChrome(page);
  await shot(page, "shop-landing");

  // 2) Choose barber / date / time — BrandMark header fully visible (sticky),
  // booking steps in frame below; do not scroll h2 flush to top.
  // Unlock truncate+leading so shop-name glyph tops aren't clipped in the shot.
  await page.addStyleTag({
    content: `
      header.sticky p.truncate {
        overflow: visible !important;
        text-overflow: clip !important;
        line-height: 1.4 !important;
        padding-top: 2px !important;
      }
    `,
  });
  const barberHeading = page.getByRole("heading", { level: 2 }).first();
  await barberHeading.waitFor({ timeout: 15000 });
  await page.evaluate(() => {
    const header = document.querySelector("header.sticky") || document.querySelector("header");
    const headerH = header ? header.getBoundingClientRect().height : 72;
    const headings = [...document.querySelectorAll("h2")];
    const target = headings.find((h) => /ช่าง|Barber|เลือก/i.test(h.textContent || ""));
    if (!target) return;
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, Math.max(0, targetTop - headerH - 16));
  });
  await page.waitForTimeout(800);
  await shot(page, "choose-slot");

  // 3) Summary — pick first available slot
  const available = page.locator("button:not([disabled])").filter({
    hasText: /^\d{1,2}:\d{2}$/,
  });
  const count = await available.count();
  if (count === 0) {
    throw new Error("No available time slots for summary screenshot");
  }
  await available.first().click();
  await page.waitForTimeout(400);
  // Fill demo customer (no real PII)
  const nameInput = page.locator('input[placeholder]').first();
  if (await nameInput.count()) {
    await nameInput.fill("Demo Guest");
  }
  const phoneInput = page.locator('input[inputmode="tel"]');
  if (await phoneInput.count()) {
    await phoneInput.fill("0812345678");
  }
  await page.evaluate(() => {
    const h = [...document.querySelectorAll("h2")].find((el) =>
      /สรุป|Summary|Confirm|ยืนยัน/i.test(el.textContent || ""),
    );
    h?.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(300);
  await shot(page, "booking-summary");

  // 4) Confirm → queue ticket (success)
  const confirm = page.getByRole("button", { name: /ยืนยัน|Confirm|จอง/i }).last();
  await confirm.click();
  await page.waitForSelector("text=/สำเร็จ|Success|นัดหมาย|see you|เจอกัน/i", {
    timeout: 20000,
  });
  await page.waitForTimeout(400);
  await shot(page, "queue-ticket");

  // Seed a second demo booking via UI for a fuller admin board (optional best-effort)
  await page.goto(`${BASE}/${SHOP}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const avail2 = page.locator("button:not([disabled])").filter({
    hasText: /^\d{1,2}:\d{2}$/,
  });
  if ((await avail2.count()) > 1) {
    await avail2.nth(1).click();
    await page.waitForTimeout(300);
    const n = page.locator("input").first();
    if (await n.count()) await n.fill("Walk-in Demo");
    const p = page.locator('input[inputmode="tel"]');
    if (await p.count()) await p.fill("0899999999");
    const c = page.getByRole("button", { name: /ยืนยัน|Confirm|จอง/i }).last();
    await c.click().catch(() => {});
    await page.waitForTimeout(800);
  }

  // 5) Admin queue board
  await page.goto(`${BASE}/${SHOP}/admin`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await hideChrome(page);
  await shot(page, "admin-queue");

  // 6) Admin team
  await page.goto(`${BASE}/${SHOP}/admin/staff`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await hideChrome(page);
  await shot(page, "admin-team");

  // 7) Admin summary / revenue (D5)
  await page.goto(`${BASE}/${SHOP}/admin/stats`, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => /สรุป|Summary|ลูกค้า/i.test(document.body?.innerText || ""),
    { timeout: 20000 },
  );
  await page.waitForTimeout(800);
  await hideChrome(page);
  await shot(page, "admin-stats");

  await browser.close();
  console.log("Done. Screens in", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
