/**
 * Mobile (390px) screenshots of /c/{token} CancelClient visual states.
 * Uses the same dark card layout + Thai copy as CancelClient.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const OUT = process.env.ARTIFACT_DIR || "/opt/cursor/artifacts";

function cardHtml({ title, time, note, primary, secondary, blocked }) {
  const actions = [];
  if (primary) {
    actions.push(
      `<button style="min-height:48px;width:100%;border-radius:12px;background:#fbbf24;color:#09090b;font-weight:600;border:0;font-size:16px;font-family:inherit;">${primary}</button>`,
    );
  }
  if (blocked) {
    actions.push(
      `<p data-testid="blocked" style="margin:0;font-size:14px;color:#a1a1aa;word-break:keep-all;">${blocked}</p>`,
    );
  }
  if (secondary) {
    const secondaryStyle = primary
      ? "background:transparent;color:#e4e4e7;border:1px solid #52525b;"
      : "background:#ef4444;color:#fff;border:0;";
    actions.push(
      `<button style="min-height:48px;width:100%;border-radius:12px;font-weight:600;font-size:16px;font-family:inherit;${secondaryStyle}">${secondary}</button>`,
    );
  }
  return `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700&display=swap');
  *{box-sizing:border-box;}
  body{margin:0;background:#09090b;color:#fafafa;font-family:'Noto Sans Thai',system-ui,sans-serif;}
  .wrap{width:390px;padding:32px 16px;word-break:keep-all;}
  .card{background:#18181b;border-radius:16px;padding:20px;}
  h1{margin:0;font-size:20px;font-weight:600;}
  dl{margin:16px 0 0;display:grid;gap:12px;font-size:14px;}
  dt{color:#71717a;margin:0 0 2px;}
  dd{margin:0;font-weight:500;}
  .time{font-size:18px;font-weight:600;}
  .actions{margin-top:20px;display:flex;flex-direction:column;gap:12px;}
  .note{margin:12px 0 0;font-size:13px;color:#a1a1aa;}
</style></head><body>
<div class="wrap">
  <div class="card">
    <h1>${title}</h1>
    <dl>
      <div><dt>ช่าง</dt><dd>นัท · Nat</dd></div>
      <div><dt>วันที่</dt><dd>อาทิตย์ 18 ต.ค. 2026</dd></div>
      <div><dt>เวลา</dt><dd class="time">${time}</dd></div>
      <div><dt>ชื่อ</dt><dd>ลูกค้าทดสอบ</dd></div>
    </dl>
    ${note ? `<p class="note">${note}</p>` : ""}
    <div class="actions">${actions.join("")}</div>
  </div>
</div>
</body></html>`;
}

const cases = [
  {
    id: "cancel-page-reschedule-allowed",
    html: cardHtml({
      title: "เลื่อนหรือยกเลิกคิว",
      time: "10:00 – 10:30",
      primary: "เลื่อนคิว",
      secondary: "ยกเลิกการจอง",
    }),
  },
  {
    id: "cancel-page-already-rescheduled",
    html: cardHtml({
      title: "เลื่อนหรือยกเลิกคิว",
      time: "11:00 – 11:30",
      blocked: "เลื่อนคิวแล้ว (ครบ 1 ครั้ง)",
      secondary: "ยกเลิกการจอง",
    }),
  },
  {
    id: "cancel-page-after-reschedule-success",
    html: cardHtml({
      title: "เลื่อนหรือยกเลิกคิว",
      time: "14:00 – 14:30",
      note: "ย้ายคิวสำเร็จแล้ว · เวลานัดอัปเดตด้านบน",
      blocked: "เลื่อนคิวแล้ว (ครบ 1 ครั้ง)",
      secondary: "ยกเลิกการจอง",
    }),
  },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});

for (const { id, html } of cases) {
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.waitForTimeout(350);
  const path = join(OUT, `${id}.png`);
  await page.screenshot({ path, fullPage: true });
  console.log("wrote", path);
}

await browser.close();
console.log("done");
