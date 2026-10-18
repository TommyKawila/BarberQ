/**
 * Capture evidence screenshots for ClipperQ small-mark favicon + admin toggle.
 * Run: node scripts/capture-small-mark-evidence.mjs
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.env.ARTIFACT_DIR || "/opt/cursor/artifacts";
mkdirSync(OUT, { recursive: true });

function dataUrlPng(rel) {
  const buf = readFileSync(join(ROOT, rel));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

const fav16 = dataUrlPng("public/brand/clipperq/favicon-16.png");
const fav32 = dataUrlPng("public/brand/clipperq/favicon-32.png");
const fav48 = dataUrlPng("public/brand/clipperq/favicon-48.png");

const faviconHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<link rel="icon" href="${fav16}" sizes="16x16"/>
<style>
  body{margin:0;background:#F3EEE3;font-family:system-ui,sans-serif;color:#111;}
  .wrap{padding:32px;}
  .tabs{display:flex;gap:8px;background:#dee1e6;padding:10px 10px 0;border-radius:12px 12px 0 0;}
  .tab{display:flex;align-items:center;gap:8px;background:#fff;border-radius:10px 10px 0 0;padding:8px 14px;font-size:13px;box-shadow:0 -1px 0 #ccc;}
  .tab img{width:16px;height:16px;image-rendering:pixelated;}
  .zoom{display:flex;gap:28px;margin-top:28px;align-items:flex-end;}
  .cell{text-align:center;}
  .cell img{image-rendering:pixelated;border:1px solid #ddd;background:#fff;}
  .label{margin-top:8px;font-size:12px;color:#555;}
  h1{font-size:18px;margin:0 0 16px;}
</style></head><body>
<div class="wrap">
  <h1>ClipperQ small-mark favicon (16–48px)</h1>
  <div class="tabs">
    <div class="tab"><img src="${fav16}" alt=""/><span>ClipperQ</span></div>
    <div class="tab" style="opacity:.55"><img src="${fav16}" alt=""/><span>Other tab</span></div>
  </div>
  <div class="zoom">
    <div class="cell"><img src="${fav16}" width="96" height="96"/><div class="label">16px ×6</div></div>
    <div class="cell"><img src="${fav32}" width="96" height="96"/><div class="label">32px ×3</div></div>
    <div class="cell"><img src="${fav48}" width="96" height="96"/><div class="label">48px ×2</div></div>
  </div>
</div>
</body></html>`;

const adminHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body{margin:0;background:#09090b;color:#fafafa;font-family:system-ui,sans-serif;}
  .page{max-width:420px;margin:0 auto;padding:20px 16px;}
  .back{color:#a1a1aa;font-size:14px;margin-bottom:12px;}
  h1{font-size:20px;font-weight:600;margin:0 0 16px;}
  .card{background:#18181b;border-radius:16px;padding:16px;margin-bottom:12px;}
  .row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
  h2{font-size:14px;font-weight:600;margin:0;}
  p{font-size:14px;color:#a1a1aa;margin:6px 0 0;line-height:1.4;}
  .sw{position:relative;width:48px;height:28px;border-radius:999px;background:#fbbf24;flex-shrink:0;}
  .sw::after{content:"";position:absolute;left:2px;top:2px;width:24px;height:24px;border-radius:999px;background:#fff;transform:translateX(20px);}
</style></head><body>
<div class="page">
  <div class="back">← Settings</div>
  <h1>แจ้งเตือนก่อนถึงคิว</h1>
  <section class="card">
    <div class="row">
      <div>
        <h2>แสดง by ClipperQ บนการ์ด LINE</h2>
        <p>ลายน้ำเล็กที่ท้ายข้อความ Flex ถึงลูกค้า (ยืนยัน / เตือน / เลื่อน / ยกเลิก / บัตรคิว) · เปิดเป็นค่าเริ่มต้น · ปิดได้หากร้านไม่ต้องการแสดงแบรนด์แพลตฟอร์ม</p>
      </div>
      <div class="sw" aria-checked="true"></div>
    </div>
  </section>
</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });

await page.setContent(faviconHtml, { waitUntil: "networkidle" });
await page.setViewportSize({ width: 720, height: 420 });
await page.waitForTimeout(200);
const favPath = join(OUT, "favicon-small-mark-closeup.png");
await page.screenshot({ path: favPath, fullPage: true });
console.log("wrote", favPath);

await page.setContent(adminHtml, { waitUntil: "networkidle" });
await page.setViewportSize({ width: 420, height: 520 });
await page.waitForTimeout(200);
const adminPath = join(OUT, "admin-flex-brand-footer-toggle.png");
await page.screenshot({ path: adminPath, fullPage: true });
console.log("wrote", adminPath);

writeFileSync(join(OUT, "capture-small-mark-evidence.json"), JSON.stringify({ favPath, adminPath }, null, 2));
await browser.close();
console.log("done");
