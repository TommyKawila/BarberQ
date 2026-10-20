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
const OWNER = "mock-owner-line-id";
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

async function openStaffSheet(page) {
  await page.goto(`${BASE}/${SHOP}/admin`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(600);
  // Prefer schedule tab free cell
  await page.getByRole("button", { name: /ตาราง|Schedule/i }).first().click().catch(() => {});
  await page.waitForTimeout(400);
  const free = page.getByRole("button", { name: /ว่าง/ }).first();
  if (await free.count()) {
    await free.tap().catch(async () => free.click({ force: true }));
  } else {
    // Fallback: any free-looking cell
    await page.locator("button").filter({ hasText: /ว่าง|19:|18:|20:/ }).first().click({ force: true });
  }
  await page.waitForSelector("text=ลงคิว", { timeout: 15000 });
  await page.waitForSelector('[data-testid="staff-book-walk-in"]', { timeout: 10000 });
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

    // Delay staff-bookings so we can capture pending spinner.
    await page.route("**/staff-bookings", async (route) => {
      if (route.request().method() === "POST") {
        await new Promise((r) => setTimeout(r, 2500));
      }
      await route.continue();
    });

    await openStaffSheet(page);
    const walkIn = page.getByTestId("staff-book-walk-in");

    // 1) Pressed visual (data-pressed mirrors :active for capture)
    await walkIn.evaluate((el) => el.setAttribute("data-pressed", "true"));
    await page.waitForTimeout(120);
    let buf = await page.screenshot({ type: "png" });
    let outPath = join(OUT, `walkin-pressed-${vp.name}.png`);
    await sharp(buf).png().toFile(outPath);
    console.log("wrote", outPath);
    await walkIn.evaluate((el) => el.removeAttribute("data-pressed"));

    // 2) Pending spinner (tap Walk-in while route is delayed)
    await walkIn.tap().catch(async () => walkIn.click({ force: true }));
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('[data-testid="staff-book-walk-in"]');
        return btn && (btn.getAttribute("aria-busy") === "true" || /กำลังลงคิว/.test(btn.textContent || ""));
      },
      { timeout: 5000 },
    ).catch(() => {});
    await page.waitForTimeout(200);
    buf = await page.screenshot({ type: "png" });
    outPath = join(OUT, `walkin-pending-${vp.name}.png`);
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
