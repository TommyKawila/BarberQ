/**
 * Capture multi-service complete picker at 390 + 1024.
 * Memory-mode. Usage: node scripts/capture-complete-service-picker.mjs [baseUrl]
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
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
      customerName: "ทดสอบปิดคิว",
      customerPhone: "0890000001",
    }),
  });
  if (!book.ok) {
    console.warn("staff-bookings", book.status, await book.text());
  }
  return { barber, services };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await waitForServer(BASE);
  await seed(BASE);

  const browser = await chromium.launch({ headless: true });
  for (const vp of [
    { name: "mobile-390", width: 390, height: 844 },
    { name: "ipad-1024", width: 1024, height: 768 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/${SHOP}/admin`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(800);

    // Prefer Today queue "เสร็จแล้ว" / "เสร็จ"
    const doneBtn = page.getByRole("button", { name: /เสร็จ/ }).first();
    if (await doneBtn.count()) {
      await doneBtn.click();
    } else {
      // Schedule tab fallback: open a booked cell
      await page.getByRole("button", { name: /ตาราง|Schedule/i }).first().click().catch(() => {});
      await page.waitForTimeout(400);
      await page.getByRole("button", { name: /ตัวเลือกคิว|แตะเพื่อจัดการ/ }).first().click();
      await page.getByRole("button", { name: /เสร็จ/ }).first().click();
    }

    await page.waitForSelector('[data-testid="complete-service-picker"]', { timeout: 15000 });
    await page.waitForTimeout(300);
    const buf = await page.screenshot({ type: "png" });
    const outPath = join(OUT, `complete-service-picker-${vp.name}.png`);
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
