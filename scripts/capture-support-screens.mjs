/**
 * Capture 390px screenshots for ClipperQ Support System screens 1–7.
 * Run with: node scripts/capture-support-screens.mjs
 * Expects next start/dev on localhost:3000 (prototype / memory store OK).
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT = "/opt/cursor/artifacts/screenshots";
mkdirSync(OUT, { recursive: true });
const base = process.env.SUPPORT_CAPTURE_BASE ?? "http://127.0.0.1:3000";
const shop = process.env.SUPPORT_CAPTURE_SHOP ?? "phinxstudio";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

async function shot(name, path, ready) {
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  if (ready) {
    await page.waitForSelector(ready, { timeout: 30000 }).catch(() => {});
  }
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${name}`, fullPage: false });
  console.log("wrote", name);
}

// 1 — Help FAB + menu on shop admin Today
await shot(
  "support-01-help-fab-390.png",
  `/${shop}/admin`,
  '[data-testid="support-help-fab"]',
);
await page.click('[data-testid="support-help-fab"]').catch(() => {});
await page.waitForSelector('[data-testid="support-help-menu"]', { timeout: 5000 }).catch(() => {});
await page.waitForTimeout(400);
await page.screenshot({
  path: `${OUT}/support-01-help-menu-390.png`,
  fullPage: false,
});
console.log("wrote support-01-help-menu-390.png");

// 2 — Onboarding checklist (setup page always shows it)
await shot(
  "support-02-onboarding-checklist-390.png",
  `/${shop}/admin/support/setup`,
  '[data-testid="support-onboarding-checklist"], [data-testid="support-help-fab"]',
);

// 3 — Report form
await shot(
  "support-03-report-form-390.png",
  `/${shop}/admin/support/report`,
  '[data-testid="support-form-problem"]',
);

// Sent confirmation (static route)
await shot(
  "support-03-report-sent-390.png",
  `/${shop}/admin/support/sent?id=demo`,
  '[data-testid="support-sent"]',
);

// 4 — Friendly error boundary UI
await shot(
  "support-04-error-390.png",
  `/${shop}/admin/support/error-preview`,
  '[data-testid="support-friendly-error"]',
);

// 5 — Feature request
await shot(
  "support-05-feature-form-390.png",
  `/${shop}/admin/support/feature`,
  '[data-testid="support-form-feature"]',
);

// 6 — My reports
await shot(
  "support-06-my-reports-390.png",
  `/${shop}/admin/support/reports`,
  '[data-testid="support-my-reports"]',
);

// 7 — Superadmin support inbox
await page.addInitScript(() => {
  sessionStorage.setItem("barberq_operator_token", "ci-placeholder-superadmin-token");
});
await shot(
  "support-07-superadmin-inbox-390.png",
  `/superadmin/support`,
  '[data-testid="superadmin-support-inbox"]',
);

await browser.close();
console.log("Done →", OUT);
