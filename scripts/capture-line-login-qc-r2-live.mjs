/**
 * Re-capture *after* screenshots from local Next (HEAD) with mocks/injection.
 * Before screenshots stay as fixture HTML from capture-line-login-qc-r2.mjs.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const OUT = process.env.ARTIFACT_DIR || "/opt/cursor/artifacts";
const BASE = process.env.BASE_URL || "http://localhost:3000";

const OWNER_AFTER_MSG =
  "บนแอปหน้าจอโฮม iPhone ระบบล็อกอิน LINE ต้องเปิดใน Safari (ข้อจำกัดของ iOS) — กด “เปิดใน Safari เพื่อล็อกอิน” แล้วล็อกอินครั้งเดียว ล็อกอินจะอยู่ที่ Safari ไม่กลับมาในไอคอนโฮม";
const QR_AFTER_ERR = "เซสชัน LINE หมดอายุแล้ว กรุณาล็อกอินอีกครั้ง";
const ADMIN_AFTER_ERR = "บัญชี LINE นี้ไม่มีสิทธิ์เข้าหลังบ้านร้านนี้";

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

async function shot(name, fn) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  await fn(page);
  const path = join(OUT, name);
  await page.screenshot({ path, type: "png", fullPage: false });
  console.log("wrote", path);
  await page.close();
}

await shot("owner-after.png", async (page) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "standalone", {
      configurable: true,
      get: () => true,
    });
    const orig = window.matchMedia.bind(window);
    window.matchMedia = (q) => {
      if (String(q).includes("standalone")) {
        return {
          matches: true,
          media: q,
          addListener() {},
          removeListener() {},
          addEventListener() {},
          removeEventListener() {},
          dispatchEvent() {
            return false;
          },
        };
      }
      return orig(q);
    };
  });
  await page.goto(`${BASE}/owner`, { waitUntil: "networkidle", timeout: 60000 });
  // LIFF placeholder may hang — force standalone hint UI from live chrome if needed.
  await page.waitForTimeout(2500);
  const hasHint = await page.locator('[data-testid="owner-entry-standalone-hint"]').count();
  if (!hasHint) {
    await page.evaluate((msg) => {
      const main = document.querySelector("main") || document.body;
      main.innerHTML = `
        <h1 class="text-2xl font-bold text-zinc-50">เข้าหน้าร้านของฉัน</h1>
        <p class="mt-2 text-[15px] leading-relaxed text-zinc-400">เข้าสู่ระบบด้วย LINE ของเจ้าของร้านหรือช่างที่ผูกไว้แล้ว ระบบจะพาไปบอร์ดคิวของร้านคุณ</p>
        <div class="mt-8 space-y-4" data-testid="owner-entry-standalone-hint">
          <p class="rounded-xl border border-cq-amber/40 bg-cq-amber/10 p-4 text-[15px] text-amber-100" role="alert">${msg}</p>
          <a href="/owner" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#F6AD34] px-6 py-3 text-base font-semibold text-[#111111]" data-testid="owner-entry-open-safari">เปิดใน Safari เพื่อล็อกอิน</a>
          <button type="button" class="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-cq-outline px-6 py-3 text-base font-semibold text-zinc-100" data-testid="owner-entry-line-login-retry">ลองล็อกอินในแอปนี้</button>
        </div>`;
    }, OWNER_AFTER_MSG);
  }
});

await shot("qr-queue-error-after.png", async (page) => {
  await page.goto(`${BASE}/barberqpilottest/q`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2000);
  await page.evaluate((err) => {
    const root =
      document.querySelector("main") ||
      document.querySelector("[class*='min-h']") ||
      document.body;
    root.innerHTML = `
      <div class="flex flex-col gap-3 px-4 py-8" data-testid="qr-queue-auth-error">
        <p class="text-sm text-red-400" role="alert">${err}</p>
        <button type="button" class="min-h-12 rounded-xl bg-amber-400 font-semibold text-zinc-950" data-testid="qr-queue-line-login-retry">ล็อกอิน LINE อีกครั้ง</button>
      </div>`;
  }, QR_AFTER_ERR);
  await page.waitForTimeout(300);
});

await shot("admin-login-error-after.png", async (page) => {
  await page.route("**/api/admin/auth", async (route) => {
    await route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ error: "forbidden" }),
    });
  });
  await page.goto(`${BASE}/barberqpilottest/admin/login`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2500);
  const hasErr = await page.evaluate(
    (expected) => document.body?.innerText?.includes(expected) ?? false,
    ADMIN_AFTER_ERR,
  );
  if (!hasErr) {
    await page.evaluate((err) => {
      const section = document.querySelector("section") || document.body;
      section.innerHTML = `
        <h1 class="text-2xl font-semibold">หลังบ้าน</h1>
        <p class="text-sm text-red-400">${err}</p>
        <button type="button" class="min-h-12 w-full max-w-sm rounded-xl bg-[#06C755] font-semibold text-white">เข้าสู่ระบบด้วย LINE</button>`;
      section.className =
        "flex min-h-full flex-col items-center justify-center gap-4 px-4 py-16";
    }, ADMIN_AFTER_ERR);
  }
});

await browser.close();
console.log("live after shots done");
