/**
 * Capture multi-service complete picker at 390 + 1024 with ฿250 selected.
 * Memory-mode. Usage: node scripts/capture-complete-service-picker.mjs [baseUrl]
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, devices } from "playwright";
import sharp from "sharp";

const OUT = "/opt/cursor/artifacts/complete-service-picker";
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

async function seed(base) {
  const headers = {
    Authorization: `Bearer ${OWNER}`,
    "Content-Type": "application/json",
  };
  const barbersRes = await fetch(`${base}/api/${SHOP}/barbers`, { headers });
  const barbersJson = await barbersRes.json();
  const barber =
    (barbersJson.barbers ?? []).find((b) => b.is_bookable !== false && b.is_active !== false) ??
    null;
  if (!barber) throw new Error("No barber");

  // Ensure two active services
  const svcRes = await fetch(`${base}/api/${SHOP}/services?includeInactive=1`, { headers });
  const svcJson = await svcRes.json();
  let services = svcJson.services ?? [];
  if (services.filter((s) => s.is_active).length < 2) {
    for (const spec of [
      { name: "ตัดผม + เฟด", priceBaht: 200, isDefault: true },
      { name: "ตัด + เฟด + โกนหนวด", priceBaht: 250, isDefault: false },
    ]) {
      const exists = services.some((s) => s.name === spec.name && s.is_active);
      if (!exists) {
        await fetch(`${base}/api/${SHOP}/services`, {
          method: "POST",
          headers,
          body: JSON.stringify(spec),
        });
      }
    }
    const again = await fetch(`${base}/api/${SHOP}/services`, { headers });
    services = (await again.json()).services ?? [];
  }

  // In-progress walk-in (start ~5m ago)
  const start = new Date(Date.now() - 5 * 60_000);
  const end = new Date(start.getTime() + (barber.slot_duration_minutes || 30) * 60_000);
  const book = await fetch(`${base}/api/${SHOP}/staff-bookings`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      barberId: barber.id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      source: "walk_in",
      customerName: "Walk-in #4",
      customerPhone: "0897553004",
    }),
  });
  if (!book.ok) {
    console.warn("staff-bookings", book.status, await book.text());
  }
  return { barber, services };
}

async function openPickerAndSelect250(page) {
  await page.waitForTimeout(800);

  const doneBtn = page.getByRole("button", { name: /เสร็จ/ }).first();
  if (await doneBtn.count()) {
    await doneBtn.click({ force: true });
  } else {
    await page.getByRole("button", { name: /ตาราง|Schedule/i }).first().click().catch(() => {});
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: /ตัวเลือกคิว|แตะเพื่อจัดการ/ }).first().click();
    await page.getByRole("button", { name: /เสร็จ/ }).first().click();
  }

  await page.waitForSelector('[data-testid="complete-service-picker"]', { timeout: 15000 });
  await page.waitForTimeout(200);

  // Tap non-default ฿250 row (whole row is the hit target).
  const option250 = page.locator('[data-testid^="complete-service-option-"][data-price-baht="250"]').first();
  if ((await option250.count()) === 0) {
    // Fallback: second option or text match
    const byText = page.getByText(/฿250/).first();
    await byText.tap().catch(async () => {
      await byText.click({ force: true });
    });
  } else {
    await option250.tap().catch(async () => {
      await option250.click({ force: true });
    });
  }

  await page.waitForTimeout(300);

  // Assert selection stuck on ฿250 and CTA updated.
  const selected = page.locator('[data-testid^="complete-service-option-"][data-selected="true"]');
  const selectedPrice = await selected.getAttribute("data-price-baht");
  if (selectedPrice !== "250") {
    throw new Error(`Expected selected price 250, got ${selectedPrice}`);
  }
  const confirm = page.getByTestId("complete-service-confirm");
  const confirmText = await confirm.innerText();
  if (!/฿250/.test(confirmText)) {
    throw new Error(`Expected confirm CTA with ฿250, got: ${confirmText}`);
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await waitForServer(BASE);
  await seed(BASE);

  const browser = await chromium.launch({ headless: true });
  const viewports = [
    {
      name: "mobile-390",
      // Touch-emulated iPhone-ish viewport (LINE / Safari style)
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
    // Fresh seed per viewport so each has an in-progress walk-in to complete.
    await seed(BASE);
    const context = await browser.newContext(vp.context);
    const page = await context.newPage();
    await page.goto(`${BASE}/${SHOP}/admin`, { waitUntil: "networkidle", timeout: 60000 });
    await openPickerAndSelect250(page);

    const buf = await page.screenshot({ type: "png" });
    const outPath = join(OUT, `complete-service-picker-${vp.name}.png`);
    await sharp(buf).png().toFile(outPath);
    console.log("wrote", outPath, "(฿250 selected)");
    await context.close();
  }
  await browser.close();
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
