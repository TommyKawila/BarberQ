/**
 * Capture ลงคิว sheet: pressed Walk-in + pending spinner at 390 + 1024.
 * Memory-mode. Usage: node scripts/capture-walkin-tap-feedback.mjs [baseUrl]
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, devices } from "playwright";
import sharp from "sharp";

const OUT = "/opt/cursor/artifacts/walkin-tap-feedback";
const SHOP = "phinxstudio";
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

async function openFutureFreeSheet(page) {
  await page.goto(`${BASE}/${SHOP}/admin`, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByRole("tab", { name: "ตาราง" }).click();
  await page.waitForTimeout(400);
  const frees = page.locator("button").filter({ hasText: /\d{2}:\d{2}\s*ว่าง/ });
  const n = await frees.count();
  for (let i = Math.max(0, n - 20); i < n; i++) {
    const cell = frees.nth(i);
    const label = await cell.innerText();
    if (!/2[0-2]:/.test(label)) continue;
    await cell.scrollIntoViewIfNeeded();
    await cell.click({ force: true });
    await page.waitForTimeout(250);
    if (await page.locator('[data-testid="staff-book-walk-in"]').count()) return;
  }
  throw new Error("Could not open StaffBookingSheet on a future free slot");
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await waitForServer(BASE);

  const browser = await chromium.launch({ headless: true });
  const viewports = [
    {
      name: "mobile-390",
      context: {
        ...devices["iPhone 12"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "ipad-1024",
      context: {
        ...devices["iPad Pro 11"],
        viewport: { width: 1024, height: 768 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      },
    },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext(vp.context);
    const page = await context.newPage();
    await page.route("**/staff-bookings", async (route) => {
      if (route.request().method() === "POST") {
        await new Promise((r) => setTimeout(r, 3500));
      }
      await route.continue();
    });

    await openFutureFreeSheet(page);
    const walkIn = page.getByTestId("staff-book-walk-in");

    await walkIn.evaluate((el) => el.setAttribute("data-pressed", "true"));
    await page.waitForTimeout(100);
    let buf = await page.screenshot({ type: "png" });
    await sharp(buf).png().toFile(join(OUT, `walkin-pressed-${vp.name}.png`));
    console.log("wrote pressed", vp.name);
    await walkIn.evaluate((el) => el.removeAttribute("data-pressed"));

    await walkIn.click({ force: true });
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('[data-testid="staff-book-walk-in"]');
        return btn && /กำลังลงคิว/.test(btn.textContent || "");
      },
      { timeout: 5000 },
    );
    buf = await page.screenshot({ type: "png" });
    await sharp(buf).png().toFile(join(OUT, `walkin-pending-${vp.name}.png`));
    console.log("wrote pending", vp.name);
    await context.close();
  }
  await browser.close();
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
