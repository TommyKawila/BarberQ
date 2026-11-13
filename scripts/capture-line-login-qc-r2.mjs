/**
 * 390px before/after screenshots for PR #66 QC round 2 (bugs k/l/m follow-ups).
 * Renders mock UI matching OwnerEntry / QrQueueJoin / AdminLogin — no secrets.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const OUT = process.env.ARTIFACT_DIR || "/opt/cursor/artifacts";

const OWNER_BEFORE_MSG =
  "บนแอปหน้าจอโฮม iPhone ระบบล็อกอิน LINE ต้องเปิดใน Safari (ข้อจำกัดของ iOS) — กด「เปิดใน Safari」แล้วล็อกอินครั้งเดียว เซสชันจะอยู่ที่ Safari ไม่กลับมาในไอคอนโฮม";
const OWNER_AFTER_MSG =
  "บนแอปหน้าจอโฮม iPhone ระบบล็อกอิน LINE ต้องเปิดใน Safari (ข้อจำกัดของ iOS) — กด “เปิดใน Safari เพื่อล็อกอิน” แล้วล็อกอินครั้งเดียว ล็อกอินจะอยู่ที่ Safari ไม่กลับมาในไอคอนโฮม";

const QR_BEFORE_ERR = "The access token expired";
const QR_AFTER_ERR = "เซสชัน LINE หมดอายุแล้ว กรุณาล็อกอินอีกครั้ง";

const ADMIN_BEFORE_ERR = "เข้าสู่ระบบ LINE ไม่สำเร็จ กรุณาลองใหม่";
const ADMIN_AFTER_ERR = "บัญชี LINE นี้ไม่มีสิทธิ์เข้าหลังบ้านร้านนี้";

function shell(body, { title }) {
  return `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=390"/>
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700&display=swap');
  *{box-sizing:border-box;}
  body{margin:0;background:#09090b;color:#fafafa;font-family:'Noto Sans Thai',system-ui,sans-serif;}
  .phone{width:390px;min-height:844px;margin:0 auto;padding:0 0 24px;}
  .nav{height:48px;border-bottom:1px solid #27272a;display:flex;align-items:center;padding:0 16px;font-size:13px;color:#a1a1aa;}
  .main{padding:40px 16px 24px;max-width:512px;margin:0 auto;}
  h1{margin:0;font-size:24px;font-weight:700;color:#fafafa;}
  .sub{margin:8px 0 0;font-size:15px;line-height:1.5;color:#a1a1aa;}
  .alert{margin-top:32px;border-radius:12px;border:1px solid rgba(251,191,36,.4);background:rgba(251,191,36,.1);padding:16px;font-size:15px;color:#fef3c7;word-break:keep-all;}
  .stack{margin-top:16px;display:flex;flex-direction:column;gap:12px;}
  .btn-primary{display:flex;min-height:48px;align-items:center;justify-content:center;border-radius:12px;background:#F6AD34;color:#111;font-weight:600;font-size:16px;text-decoration:none;border:0;}
  .btn-secondary{display:flex;min-height:48px;align-items:center;justify-content:center;border-radius:12px;background:transparent;color:#f4f4f5;font-weight:600;font-size:16px;border:1px solid #3f3f46;}
  .err{margin:0;font-size:14px;color:#f87171;word-break:keep-all;}
  .line-btn{display:flex;min-height:48px;align-items:center;justify-content:center;border-radius:12px;background:#06C755;color:#fff;font-weight:600;font-size:16px;border:0;width:100%;max-width:24rem;}
  .amber-btn{display:flex;min-height:48px;align-items:center;justify-content:center;border-radius:12px;background:#fbbf24;color:#09090b;font-weight:600;font-size:16px;border:0;width:100%;}
  .center{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;min-height:70vh;text-align:center;padding:64px 16px;}
  .badge{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:rgba(251,191,36,.9);margin:0 0 4px;}
</style></head><body><div class="phone">${body}</div></body></html>`;
}

function ownerHtml(msg, { after }) {
  const primaryLabel = after ? "เปิดใน Safari เพื่อล็อกอิน" : "เปิดใน Safari";
  return shell(
    `<div class="nav">standalone · /owner</div>
    <main class="main">
      <h1>เข้าหน้าร้านของฉัน</h1>
      <p class="sub">เข้าสู่ระบบด้วย LINE ของเจ้าของร้านหรือช่างที่ผูกไว้แล้ว ระบบจะพาไปบอร์ดคิวของร้านคุณ</p>
      <div data-testid="owner-entry-standalone-hint">
        <p class="alert" role="alert">${msg}</p>
        <div class="stack">
          <a class="btn-primary" href="#">${primaryLabel}</a>
          <button class="btn-secondary" type="button">ลองล็อกอินในแอปนี้</button>
        </div>
      </div>
    </main>`,
    { title: after ? "owner-after" : "owner-before" },
  );
}

function qrHtml(err) {
  return shell(
    `<div class="nav">/barberqpilottest/q</div>
    <main class="main" style="padding-top:32px">
      <p class="badge">คิว walk-in</p>
      <div data-testid="qr-queue-auth-error" style="display:flex;flex-direction:column;gap:12px;padding:16px 0;">
        <p class="err" role="alert">${err}</p>
        <button class="amber-btn" type="button" data-testid="qr-queue-line-login-retry">ล็อกอิน LINE อีกครั้ง</button>
      </div>
    </main>`,
    { title: "qr-queue-error" },
  );
}

function adminHtml(err) {
  return shell(
    `<div class="nav">/admin/login</div>
    <section class="center">
      <h1 style="font-size:24px">หลังบ้าน</h1>
      <p class="err">${err}</p>
      <button class="line-btn" type="button">เข้าสู่ระบบด้วย LINE</button>
    </section>`,
    { title: "admin-login-error" },
  );
}

const shots = [
  { name: "owner-before.png", html: ownerHtml(OWNER_BEFORE_MSG, { after: false }) },
  { name: "owner-after.png", html: ownerHtml(OWNER_AFTER_MSG, { after: true }) },
  { name: "qr-queue-error-before.png", html: qrHtml(QR_BEFORE_ERR) },
  { name: "qr-queue-error-after.png", html: qrHtml(QR_AFTER_ERR) },
  { name: "admin-login-error-before.png", html: adminHtml(ADMIN_BEFORE_ERR) },
  { name: "admin-login-error-after.png", html: adminHtml(ADMIN_AFTER_ERR) },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});

for (const { name, html } of shots) {
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const path = join(OUT, name);
  await page.screenshot({ path, type: "png", fullPage: false });
  console.log("wrote", path);
}

await browser.close();
console.log("done", OUT);
