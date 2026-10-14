/**
 * Playwright: mobile LIFF viewport — My Queue เลื่อนคิว flow.
 * Usage: node scripts/capture-reschedule-ui.mjs [baseUrl]
 * Expects memory-mode Next.js (no LIFF / no Supabase).
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const ARTIFACTS = "/opt/cursor/artifacts/screenshots";
const SHOP = "phinxstudio";
const VIEW = { width: 390, height: 844 };
const SCALE = 2;
const BASE = process.argv[2] || process.env.CAPTURE_BASE_URL || "http://localhost:3010";

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

async function seedFutureBooking(base) {
  // Book via public API using mock customer headers after opening LIFF mock page.
  // Fallback: create through memory store is not available from script —
  // drive UI booking then open My Queue.
  return base;
}

async function main() {
  await mkdir(ARTIFACTS, { recursive: true });
  await waitForServer(BASE);
  await seedFutureBooking(BASE);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEW,
    deviceScaleFactor: SCALE,
    locale: "th-TH",
    colorScheme: "dark",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Line/14.0.0 LIFF",
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

  // 1) Book a slot far enough out for เลื่อนคิว (60m+ lead).
  await page.goto(`${BASE}/${SHOP}`, { waitUntil: "networkidle" });
  await page.waitForSelector("h1", { timeout: 45000 });

  const bookDateSection = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /วัน|Date|2\./i }) })
    .first();
  const dateBtns = bookDateSection.locator("button:not([disabled])");
  await dateBtns.first().waitFor({ timeout: 15000 });
  const bookDateCount = await dateBtns.count();
  await dateBtns.nth(Math.min(bookDateCount - 1, 3)).click();
  await page.waitForTimeout(800);

  const available = page.locator("button:not([disabled])").filter({
    hasText: /^\d{1,2}:\d{2}$/,
  });
  await available.first().waitFor({ timeout: 20000 });
  await available.first().click();

  const nameInput = page.locator("input[placeholder]").first();
  if (await nameInput.count()) await nameInput.fill("QA Reschedule");
  const phoneInput = page.locator('input[inputmode="tel"]');
  if (await phoneInput.count()) await phoneInput.fill("0812345678");

  const confirm = page.getByRole("button", { name: /ยืนยัน|Confirm/i }).last();
  await confirm.click();
  await page.waitForTimeout(1500);

  // 2) My Queue — เลื่อนคิว button
  await page.goto(`${BASE}/${SHOP}/bookings`, { waitUntil: "networkidle" });
  await page.waitForSelector("h1", { timeout: 30000 });
  await page.waitForTimeout(800);

  const rescheduleBtn = page.getByTestId("reschedule-btn").first();
  await rescheduleBtn.waitFor({ timeout: 20000 });
  await page.screenshot({
    path: join(ARTIFACTS, "liff-my-queue-reschedule-btn.png"),
    fullPage: false,
  });

  await rescheduleBtn.click();
  await page.waitForSelector('[data-testid="reschedule-flow"]', { timeout: 15000 });
  await page.waitForTimeout(400);
  await page.screenshot({
    path: join(ARTIFACTS, "liff-reschedule-flow-barber.png"),
    fullPage: false,
  });

  // Pick a future date chip then a time chip — no <select>
  const flow = page.getByTestId("reschedule-flow");
  const dateSection = flow.getByTestId("reschedule-date-section");
  await dateSection.scrollIntoViewIfNeeded();
  const dateRow = dateSection.locator("button:not([disabled])");
  await dateRow.first().waitFor({ timeout: 10000 });
  const flowDateCount = await dateRow.count();
  // Prefer a day 2–4 ahead so morning slots are still available
  await dateRow.nth(Math.min(Math.max(flowDateCount - 2, 1), flowDateCount - 1)).click();
  await page.waitForTimeout(1200);

  const timeSection = flow.getByTestId("reschedule-time-section");
  await timeSection.waitFor({ timeout: 15000 });
  await timeSection.scrollIntoViewIfNeeded();

  const timeChips = timeSection.locator("button:not([disabled])").filter({
    hasText: /^\d{1,2}:\d{2}$/,
  });
  await timeChips.first().waitFor({ timeout: 20000 });
  await timeChips.nth(Math.min(1, (await timeChips.count()) - 1)).click();
  await page.waitForTimeout(300);

  await page.screenshot({
    path: join(ARTIFACTS, "liff-reschedule-slot-chips.png"),
    fullPage: false,
  });

  await flow.getByTestId("reschedule-continue").click();
  await page.waitForSelector('[data-testid="reschedule-confirm"]', { timeout: 10000 });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: join(ARTIFACTS, "liff-reschedule-confirm.png"),
    fullPage: false,
  });

  await browser.close();
  console.log(
    JSON.stringify({
      ok: true,
      artifacts: [
        "liff-my-queue-reschedule-btn.png",
        "liff-reschedule-flow-barber.png",
        "liff-reschedule-confirm.png",
      ],
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
