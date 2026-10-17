/**
 * Render Option A Flex cards to PNG + simulator JSON (contents only, one line).
 * Run: npx tsx scripts/render-option-a-flex.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { fromZonedTime } from "date-fns-tz";
import {
  buildAppointmentReminderFlex,
  buildBookingConfirmFlex,
  buildCustomerRescheduleTicketFlex,
  buildQueueTicketFlex,
  buildShopCancelFlex,
  buildShopRescheduleFlex,
} from "../src/lib/line/flex-messages.ts";

const OUT = process.env.ARTIFACT_DIR || "/opt/cursor/artifacts";
const TZ = "Asia/Bangkok";
const START = fromZonedTime("2026-10-18T18:30:00", TZ).toISOString();
const END = fromZonedTime("2026-10-18T19:30:00", TZ).toISOString();
const OLD_START = fromZonedTime("2026-10-18T17:00:00", TZ).toISOString();
const OLD_END = fromZonedTime("2026-10-18T18:00:00", TZ).toISOString();
const NOW_OK = fromZonedTime("2026-10-17T18:30:00", TZ);
const NOW_LATE = fromZonedTime("2026-10-18T17:45:00", TZ);

const common = {
  shopName: "BarberQx Demo",
  startTime: START,
  endTime: END,
  barberName: "นัท · Nat",
  myBookingsUrl: "https://example.com/demo/bookings",
};

const cases = [
  {
    id: "option-a-confirm",
    msg: buildBookingConfirmFlex({
      ...common,
      appointmentId: "a12f3b00-0000-4000-8000-000000000001",
      cancelUrl: "https://example.com/c/tok",
    }),
  },
  {
    id: "option-a-reminder-with-link",
    msg: buildAppointmentReminderFlex({
      ...common,
      cancelUrl: "https://example.com/c/tok",
      now: NOW_OK,
    }),
  },
  {
    id: "option-a-reminder-no-link",
    msg: buildAppointmentReminderFlex({
      ...common,
      cancelUrl: "https://example.com/c/tok",
      now: NOW_LATE,
    }),
  },
  {
    id: "option-a-reschedule-success",
    msg: buildCustomerRescheduleTicketFlex({
      shopName: common.shopName,
      oldStartTime: OLD_START,
      oldEndTime: OLD_END,
      newStartTime: START,
      newEndTime: END,
      barberName: common.barberName,
      myBookingsUrl: common.myBookingsUrl,
      cancelUrl: "https://example.com/c/tok",
      now: NOW_OK,
    }),
  },
  {
    id: "option-a-queue-ticket",
    msg: buildQueueTicketFlex({
      shopName: common.shopName,
      queueLabel: "Q-01",
      aheadCount: 2,
      waitMinutes: 60,
      liveUrl: common.myBookingsUrl,
    }),
  },
  {
    id: "option-a-shop-cancel",
    msg: buildShopCancelFlex({
      shopName: common.shopName,
      startTime: START,
      barberName: common.barberName,
      reason: "ช่างไม่สะดวก",
      bookUrl: "https://example.com/demo",
      callUrl: "tel:0812345678",
    }),
  },
  {
    id: "option-a-shop-reschedule",
    msg: buildShopRescheduleFlex({
      shopName: common.shopName,
      oldStartTime: OLD_START,
      newStartTime: START,
      barberName: common.barberName,
      acceptUrl: common.myBookingsUrl,
      pickUrl: common.myBookingsUrl,
      cancelUrl: "https://example.com/c/tok",
    }),
  },
];

function textStyle(n) {
  const sizeMap = { xs: 13, sm: 14, md: 16, lg: 19, xl: 22, xxl: 29, "3xl": 36 };
  const size = sizeMap[n.size] ?? 14;
  const weight = n.weight === "bold" ? 700 : 400;
  const color = n.color ?? "#1C1917";
  const margin = { none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 }[
    n.margin ?? "none"
  ];
  const deco = n.decoration === "line-through" ? "text-decoration:line-through;" : "";
  return `font-size:${size}px;font-weight:${weight};color:${color};margin-top:${margin}px;line-height:1.35;word-break:break-word;${deco}`;
}

function renderNode(n) {
  if (!n) return "";
  if (n.type === "text") {
    return `<div style="${textStyle(n)}">${escapeHtml(n.text)}</div>`;
  }
  if (n.type === "separator") {
    const m = { lg: 16, md: 12, sm: 8 }[n.margin] ?? 12;
    return `<hr style="border:none;border-top:1px solid ${n.color ?? "#E7E5E4"};margin:${m}px 0 0;"/>`;
  }
  if (n.type === "button") {
    const label = n.action?.label ?? "";
    if (n.style === "primary") {
      return `<a style="display:block;text-align:center;background:${n.color};color:#fff;text-decoration:none;border-radius:8px;padding:14px 12px;font-size:16px;font-weight:700;margin-top:4px;">${escapeHtml(label)}</a>`;
    }
    return `<a style="display:block;text-align:center;color:${n.color ?? "#57534E"};text-decoration:none;padding:8px 4px;font-size:14px;font-weight:400;">${escapeHtml(label)}</a>`;
  }
  if (n.type === "box") {
    const padAll = n.paddingAll ?? "0";
    const padT = n.paddingTop ?? padAll;
    const padB = n.paddingBottom ?? padAll;
    const padS = n.paddingStart ?? padAll;
    const padE = n.paddingEnd ?? padAll;
    const bg = n.backgroundColor ? `background:${n.backgroundColor};` : "";
    if (n.layout === "baseline") {
      const m = { lg: 16, md: 12, sm: 8 }[n.margin] ?? 0;
      const kids = (n.contents ?? [])
        .map((c) => {
          const flex = c.flex ?? 1;
          return `<div style="flex:${flex};${textStyle(c)}">${escapeHtml(c.text ?? "")}</div>`;
        })
        .join("");
      return `<div style="display:flex;align-items:baseline;gap:8px;margin-top:${m}px;">${kids}</div>`;
    }
    const kids = (n.contents ?? []).map(renderNode).join("");
    return `<div style="${bg}padding:${padT} ${padE} ${padB} ${padS};">${kids}</div>`;
  }
  return "";
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bubbleHtml(msg) {
  const b = msg.contents;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;700&display=swap');
  body{margin:0;background:#7B8A9A;font-family:'Noto Sans Thai',system-ui,sans-serif;}
  .phone{width:360px;padding:24px 30px;box-sizing:border-box;}
  .bubble{width:300px;background:#fff;border-radius:17px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.18);}
  .alt{font-size:12px;color:#fff;margin-bottom:10px;opacity:.9;}
</style></head><body>
<div class="phone">
  <div class="alt">${escapeHtml(msg.altText)}</div>
  <div class="bubble">
    ${renderNode(b.header)}
    ${renderNode(b.body)}
    ${renderNode(b.footer)}
  </div>
</div>
</body></html>`;
}

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 360, height: 780 },
  deviceScaleFactor: 2,
});

for (const { id, msg } of cases) {
  // Simulator paste: bubble contents only, minified one line
  const contentsPath = join(OUT, `${id}.contents.json`);
  writeFileSync(contentsPath, JSON.stringify(msg.contents));
  console.log("wrote", contentsPath);

  await page.setContent(bubbleHtml(msg), { waitUntil: "networkidle" });
  await page.waitForTimeout(350);
  const pngPath = join(OUT, `${id}.png`);
  await page.locator(".phone").screenshot({ path: pngPath });
  console.log("wrote", pngPath);
}

await browser.close();
console.log("done", cases.length, "cases");
