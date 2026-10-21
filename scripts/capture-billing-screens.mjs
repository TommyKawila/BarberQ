import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT = "/opt/cursor/artifacts/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

const base = "http://localhost:3000";

await page.goto(`${base}/start-trial`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-testid="start-trial-form"]', { timeout: 20000 });
await page.waitForTimeout(800);
await page.screenshot({
  path: `${OUT}/trial-start-390.png`,
  fullPage: false,
});

await page.goto(`${base}/phinxstudio/admin/billing`, {
  waitUntil: "domcontentloaded",
});
await page.waitForSelector('[data-testid="billing-page"]', { timeout: 20000 });
await page.waitForTimeout(1500);
await page.screenshot({
  path: `${OUT}/billing-page-390.png`,
  fullPage: false,
});

await page.goto(`${base}/phinxstudio`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-testid="shop-expired-booking"]', { timeout: 20000 });
await page.waitForTimeout(500);
await page.screenshot({
  path: `${OUT}/expired-screen-390.png`,
  fullPage: false,
});

await page.goto(`${base}/phinxstudio/admin`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.screenshot({
  path: `${OUT}/expired-admin-renew-390.png`,
  fullPage: false,
});

await browser.close();
console.log("Wrote screenshots to", OUT);
