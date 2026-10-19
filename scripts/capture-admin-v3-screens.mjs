/**
 * Capture ClipperQ Admin v3 screens at 390 / 820 / 1180.
 * Seeds sample bookings for the demo shop in memory-mode only (not production).
 * Usage: node scripts/capture-admin-v3-screens.mjs [baseUrl]
 */
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = "/opt/cursor/artifacts/admin-v3";
const SHOP = "phinxstudio";
const OWNER = "mock-owner-line-id";
const DEMO_SHOP = "ClipperQ Demo";
const BASE = process.argv[2] || process.env.CAPTURE_BASE_URL || "http://localhost:3010";

const VIEWPORTS = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "ipad-820", width: 820, height: 1180 },
  { name: "desktop-1180", width: 1180, height: 820 },
];

const PAGES = [
  { id: "today", path: `/${SHOP}/admin` },
  { id: "team", path: `/${SHOP}/admin/staff` },
  { id: "summary", path: `/${SHOP}/admin/stats` },
  { id: "settings", path: `/${SHOP}/admin/settings` },
  { id: "schedule", path: `/${SHOP}/admin/my-schedule` },
];

const FIGMA_AFTER = {
  today: join(
    ROOT,
    "../home/ubuntu/.cursor/projects/workspace/uploads/today-after_776d.png",
  ),
  team: join(
    ROOT,
    "../home/ubuntu/.cursor/projects/workspace/uploads/team-after_998c.png",
  ),
  summary: join(
    ROOT,
    "../home/ubuntu/.cursor/projects/workspace/uploads/summary-after_7e25.png",
  ),
};

async function waitForServer(url, tries = 90) {
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

async function renameShop(base) {
  const res = await fetch(`${base}/api/${SHOP}/settings`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${OWNER}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ shopName: DEMO_SHOP }),
  });
  if (!res.ok) console.warn("Rename shop:", res.status, await res.text());
}

/** Sample bookings for screenshot cards only (memory store / local). */
async function seedSampleBookings(base) {
  const headers = {
    Authorization: `Bearer ${OWNER}`,
    "Content-Type": "application/json",
  };
  const barbersRes = await fetch(`${base}/api/${SHOP}/barbers`, { headers });
  const barbersJson = await barbersRes.json();
  const barbers = (barbersJson.barbers ?? []).filter(
    (b) => b.is_active !== false && b.is_bookable !== false,
  );
  if (barbers.length < 2) {
    console.warn("Need ≥2 bookable barbers to seed sample board");
    return;
  }
  const cutting = barbers[0];
  const free = barbers[1];
  const now = Date.now();
  // Within staff-booking past window (≤30m) so "กำลังตัด" is visible
  const cutDur = (cutting.slot_duration_minutes || 30) * 60_000;
  const cuttingStart = new Date(now - Math.min(12 * 60_000, cutDur / 2)).toISOString();
  const cuttingEnd = new Date(new Date(cuttingStart).getTime() + cutDur).toISOString();
  const nextDur = cutDur;
  const nextStart = cuttingEnd;
  const nextEnd = new Date(new Date(nextStart).getTime() + nextDur).toISOString();
  const freeDur = (free.slot_duration_minutes || 45) * 60_000;
  const freeNextStart = new Date(now + 30 * 60_000).toISOString();
  const freeNextEnd = new Date(new Date(freeNextStart).getTime() + freeDur).toISOString();

  const posts = [
    {
      barberId: cutting.id,
      startTime: cuttingStart,
      endTime: cuttingEnd,
      source: "walk_in",
      customerName: "คุณต้น",
      customerPhone: "0810000001",
      allowShorten: true,
    },
    {
      barberId: cutting.id,
      startTime: nextStart,
      endTime: nextEnd,
      source: "walk_in",
      customerName: "คุณบอส",
      customerPhone: "0810000002",
      allowShorten: true,
    },
    {
      barberId: free.id,
      startTime: freeNextStart,
      endTime: freeNextEnd,
      source: "phone",
      customerName: "Peter K.",
      customerPhone: "0810000003",
      allowShorten: true,
    },
  ];

  for (const body of posts) {
    const res = await fetch(`${base}/api/${SHOP}/staff-bookings`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn("Seed booking failed", res.status, await res.text());
    } else {
      console.log("Seeded", body.customerName, "→", body.barberId.slice(0, 8));
    }
  }

  // Soft-remove one extra barber so Team shows "ช่างที่เอาออกแล้ว" (local/mock only)
  const inactive = (barbersJson.barbers ?? []).find(
    (b) => b.is_active === false || b.is_active === 0,
  );
  if (!inactive) {
    const create = await fetch(`${base}/api/${SHOP}/barbers`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "ช่างเก่า (ตัวอย่าง)", slotDuration: 30 }),
    });
    if (create.ok) {
      const created = await create.json();
      const id = created.barber?.id ?? created.id;
      if (id) {
        const del = await fetch(`${base}/api/barbers/${id}/deactivate`, {
          method: "POST",
          headers,
        });
        if (!del.ok) console.warn("Soft-remove sample barber:", del.status, await del.text());
        else console.log("Seeded removed barber for Team row");
      }
    } else {
      console.warn("Create sample barber:", create.status, await create.text());
    }
  }
}

/** Figma-like Summary sample (screenshot run only — does not affect empty-state logic). */
function sampleStatsReport() {
  return {
    range: {
      from: "2026-10-12",
      to: "2026-10-18",
      label: "week",
      kind: "week",
      displayLabel: "สัปดาห์นี้ 12–18 ต.ค. 2026",
    },
    totals: {
      uniqueCustomers: 38,
      booked: 48,
      cancelled: 2,
      completed: 42,
      noShow: 0,
      left: 0,
      walkIns: 12,
      qrWalkIns: 4,
      newCustomers: 17,
      returningCustomers: 21,
      returningRatePct: 55,
      cancelNoShowRatePct: 4,
      noShowRatePct: 0,
      utilizationPct: 68,
      revenueBaht: 8400,
      waitMinutesAvg: 8,
      bySource: { line: 26, walk_in: 12, phone: 3, chat: 1 },
    },
    comparison: {
      completedDelta: 6,
      completedDeltaPct: 17,
      revenueDelta: 900,
      returningRateDeltaPct: 3,
      waitMinutesDelta: -1,
      cutoffApplied: false,
      previous: {
        from: "2026-10-05",
        to: "2026-10-11",
        completed: 36,
        revenueBaht: 7500,
        returningRatePct: 52,
        waitMinutesAvg: 9,
      },
    },
    byHour: [],
    byBarber: [],
    trend: [
      { dateISO: "2026-10-12", booked: 6, completed: 5, cancelled: 0 },
      { dateISO: "2026-10-13", booked: 8, completed: 7, cancelled: 1 },
      { dateISO: "2026-10-14", booked: 5, completed: 5, cancelled: 0 },
      { dateISO: "2026-10-15", booked: 7, completed: 6, cancelled: 0 },
      { dateISO: "2026-10-16", booked: 9, completed: 8, cancelled: 1 },
      { dateISO: "2026-10-17", booked: 8, completed: 7, cancelled: 0 },
      { dateISO: "2026-10-18", booked: 5, completed: 4, cancelled: 0 },
    ],
    blocks: [],
    insight: { kind: "peak_hour", hour: 13, label: "เสาร์ 13:00–16:00" },
  };
}

async function hideChrome(page) {
  await page.addStyleTag({
    content: `
      /* Prototype badge */
      header span.uppercase, header span.tracking-wide.text-amber-400 {
        display: none !important;
      }
      /* Next.js / Vercel floating widgets + round "N" indicator */
      vercel-live-feedback, #vercel-live-feedback,
      nextjs-portal, [data-nextjs-toast], [data-next-mark-loading],
      [data-nextjs-dev-overlay], [data-nextjs-dialog-overlay],
      #__next-build-watcher, .nextjs-toast-errors-parent,
      body > nextjs-portal,
      /* Round Next.js "N" floating indicator */
      a[href*="nextjs.org"],
      [aria-label*="Next.js"],
      [aria-label*="next.js"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
      }
    `,
  });
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("span, div, button, a")) {
      const t = (el.textContent || "").trim();
      if (/^PROTOTYPE MODE$/i.test(t)) el.style.display = "none";
      // Circular Next.js badge often has single letter N
      if (
        t === "N" &&
        el instanceof HTMLElement &&
        el.getBoundingClientRect().width < 56 &&
        el.getBoundingClientRect().height < 56
      ) {
        el.style.display = "none";
      }
    }
    for (const el of document.querySelectorAll(
      "nextjs-portal, [data-nextjs-dev-overlay], [data-nextjs-toast]",
    )) {
      el.remove();
    }
  });
}

async function sideBySide(leftPath, rightPath, outPath, labelLeft, labelRight) {
  const left = sharp(leftPath).resize({ width: 390, height: 844, fit: "cover", position: "top" });
  const right = sharp(rightPath).resize({
    width: 390,
    height: 844,
    fit: "cover",
    position: "top",
  });
  const [lb, rb] = await Promise.all([left.png().toBuffer(), right.png().toBuffer()]);
  const gap = 16;
  const labelH = 36;
  const w = 390 * 2 + gap * 3;
  const h = 844 + gap * 2 + labelH;
  const svg = Buffer.from(
    `<svg width="${w}" height="${labelH}" xmlns="http://www.w3.org/2000/svg">
      <text x="${gap}" y="24" fill="#F3EEE3" font-size="14" font-family="sans-serif">${labelLeft}</text>
      <text x="${gap * 2 + 390}" y="24" fill="#F3EEE3" font-size="14" font-family="sans-serif">${labelRight}</text>
    </svg>`,
  );
  await sharp({
    create: { width: w, height: h, channels: 3, background: "#111111" },
  })
    .composite([
      { input: svg, left: 0, top: 0 },
      { input: lb, left: gap, top: labelH + gap },
      { input: rb, left: gap * 2 + 390, top: labelH + gap },
    ])
    .png()
    .toFile(outPath);
  console.log("wrote", outPath);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await waitForServer(BASE);
  await renameShop(BASE);
  await seedSampleBookings(BASE);

  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // Screenshot-only mock so Summary matches Figma sample numbers (empty states still real in app)
    await page.route(`**/api/${SHOP}/stats**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(sampleStatsReport()),
      });
    });

    for (const route of PAGES) {
      await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(900);
      await hideChrome(page);
      await page.waitForTimeout(200);
      const buf = await page.screenshot({ type: "png", fullPage: false });
      const file = `${route.id}-${vp.name}.png`;
      const path = join(OUT, file);
      await sharp(buf).png().toFile(path);
      console.log("wrote", path);
    }
    await context.close();
  }

  // Contact sheet
  const sheetFiles = VIEWPORTS.flatMap((vp) =>
    ["today", "team", "summary"].map((id) => join(OUT, `${id}-${vp.name}.png`)),
  );
  const tiles = await Promise.all(
    sheetFiles.map(async (f) => {
      const resized = await sharp(f)
        .resize({ width: 360, height: 640, fit: "cover", position: "top" })
        .png()
        .toBuffer();
      return resized;
    }),
  );
  const cols = 3;
  const rows = Math.ceil(tiles.length / cols);
  const composites = tiles.map((buf, i) => ({
    input: buf,
    left: 16 + (i % cols) * (360 + 16),
    top: 16 + Math.floor(i / cols) * (640 + 16),
  }));
  await sharp({
    create: {
      width: cols * 360 + (cols + 1) * 16,
      height: rows * 640 + (rows + 1) * 16,
      channels: 3,
      background: "#111111",
    },
  })
    .composite(composites)
    .png()
    .toFile(join(OUT, "contact-sheet.png"));
  console.log("wrote contact-sheet.png");

  // Side-by-side vs Figma after (mobile)
  const uploads = "/home/ubuntu/.cursor/projects/workspace/uploads";
  const pairs = [
    ["today", "today-after_776d.png"],
    ["team", "team-after_998c.png"],
    ["summary", "summary-after_7e25.png"],
  ];
  for (const [id, afterName] of pairs) {
    const impl = join(OUT, `${id}-mobile-390.png`);
    const figma = join(uploads, afterName);
    try {
      await sideBySide(
        figma,
        impl,
        join(OUT, `${id}-vs-figma.png`),
        `Figma after · ${id}`,
        `Impl mobile · ${id}`,
      );
    } catch (err) {
      console.warn("Compare skip", id, err.message);
    }
  }

  await writeFile(
    join(OUT, "manifest.json"),
    JSON.stringify({ base: BASE, viewports: VIEWPORTS, pages: PAGES, out: OUT }, null, 2),
  );

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
