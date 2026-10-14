/**
 * Playwright: mobile LIFF viewport — reminder chips above confirm.
 * Usage: node scripts/capture-reminder-chips.mjs [baseUrl]
 * Expects memory-mode Next.js (no LIFF / no Supabase).
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const ARTIFACTS = "/opt/cursor/artifacts/screenshots";
const SHOP = "phinxstudio";
const OWNER = "mock-owner-line-id";
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

async function enableReminders(base) {
  const res = await fetch(`${base}/api/${SHOP}/settings`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${OWNER}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ remindersEnabled: true, reminderLeadMinutes: 30 }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Enable reminders failed: ${res.status} ${text}`);
  }
}

async function main() {
  await mkdir(ARTIFACTS, { recursive: true });
  await waitForServer(BASE);
  await enableReminders(BASE);

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
  await page.goto(`${BASE}/${SHOP}`, { waitUntil: "networkidle" });
  await page.waitForSelector("h1", { timeout: 45000 });

  // Pick a date ≥2 days out so 1 วัน / 3 ชม. / 1 ชม. / 30 นาที are all still future.
  const dateSection = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /วัน|Date/i }) })
    .first();
  const dateBtns = dateSection.locator("button:not([disabled])");
  await dateBtns.first().waitFor({ timeout: 15000 });
  const dateCount = await dateBtns.count();
  await dateBtns.nth(Math.min(dateCount - 1, 3)).click();
  await page.waitForTimeout(800);

  const available = page.locator("button:not([disabled])").filter({
    hasText: /^\d{1,2}:\d{2}$/,
  });
  await available.first().waitFor({ timeout: 20000 });
  const slotCount = await available.count();
  await available.nth(Math.min(Math.floor(slotCount / 2), slotCount - 1)).click();

  await page.waitForSelector('[data-testid="reminder-lead-chips"]', { timeout: 20000 });
  await page.waitForTimeout(400);

  const nameInput = page.locator("input[placeholder]").first();
  if (await nameInput.count()) await nameInput.fill("QA Guest");
  const phoneInput = page.locator('input[inputmode="tel"]');
  if (await phoneInput.count()) await phoneInput.fill("0812345678");

  await page.locator('[data-testid="reminder-lead-chips"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);

  const outPath = join(ARTIFACTS, "liff-reminder-chips-mobile.png");
  await page.screenshot({ path: outPath, type: "png", fullPage: false });
  console.log("wrote", outPath);

  // Assert chip labels present
  const chips = page.locator('[data-testid="reminder-lead-chips"]');
  const text = await chips.innerText();
  for (const label of ["1 วัน", "3 ชม.", "1 ชม.", "30 นาที", "ไม่ต้องเตือน"]) {
    if (!text.includes(label)) {
      throw new Error(`Missing chip label: ${label}\nGot:\n${text}`);
    }
  }
  const confirm = page.getByRole("button", { name: /ยืนยัน|Confirm|จอง/i }).last();
  if (!(await confirm.isVisible())) {
    throw new Error("Confirm button not visible with chips");
  }

  console.log("OK: chips visible above confirm");
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
