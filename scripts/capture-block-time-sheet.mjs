/**
 * Capture block-time range sheet at 390 + 1024 (confirm CTA visible).
 * Memory-mode. Usage: node scripts/capture-block-time-sheet.mjs [baseUrl]
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, devices } from "playwright";
import sharp from "sharp";

const OUT = "/opt/cursor/artifacts/block-time-sheet";
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

async function openBlockSheet(page) {
  await page.goto(`${BASE}/${SHOP}/admin`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(500);
  // Bottom bar บล็อกเวลา
  const blockBtn = page.getByRole("button", { name: /บล็อกเวลา/ }).first();
  await blockBtn.click({ force: true });
  await page.waitForTimeout(400);
  // Pick first barber in WhoIsFree (บล็อก CTA)
  const pick = page.getByRole("button", { name: /^บล็อก$/ }).first();
  if ((await pick.count()) === 0) {
    // Fallback: any free barber row button
    await page.locator("li button").first().click({ force: true });
  } else {
    await pick.click({ force: true });
  }
  await page.waitForSelector('[data-testid="block-time-sheet"]', { timeout: 15000 });
  // Select 1h quick + reason พัก for a clear summary
  await page.getByTestId("block-quick-1h").click({ force: true });
  await page.getByTestId("block-reason-rest").click({ force: true });
  await page.waitForTimeout(200);
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
    await openBlockSheet(page);
    const confirm = await page.getByTestId("block-confirm").innerText();
    console.log(vp.name, "confirm:", confirm.replace(/\s+/g, " "));
    const buf = await page.screenshot({ type: "png" });
    const outPath = join(OUT, `block-time-sheet-${vp.name}.png`);
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
