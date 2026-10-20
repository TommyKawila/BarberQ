#!/usr/bin/env node
/**
 * ClipperQ UI QA crawl — Chromium × 3 viewports.
 * Usage:
 *   QA_BASE_URL=https://barberq-qa.vercel.app npm run qa:crawl
 *   QA_E2E_SECRET=…  (optional; enables admin routes when deployed)
 */
import { mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  DEFAULT_BASE_URL,
  SHOP_SLUG,
  VIEWPORTS,
  discoverRoutes,
} from "./config.mjs";
import { assertSafeBaseUrl } from "./guards.mjs";
import { collectAnomalies } from "./anomalies.mjs";
import { auditTapFeedback } from "./tap-feedback.mjs";
import { measureNavLatency } from "./latency.mjs";
import { writeReports } from "./report.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REPORT_DIR = join(ROOT, "report");
const SHOT_DIR = join(REPORT_DIR, "screenshots");

const baseUrl = (process.env.QA_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
const shopSlug = process.env.QA_SHOP_SLUG || SHOP_SLUG;
const e2eSecret = process.env.QA_E2E_SECRET?.trim() || "";
const locale = process.env.QA_LOCALE || "th";
/** Max wait after /qa/e2e for redirect + authenticated admin UI / session. */
const QA_AUTH_TIMEOUT_MS = 45_000;

/**
 * Establish QA E2E session in this browser context.
 * Waits for admin board (or session cookie + sessionStorage) — not a fixed sleep.
 * @param {import('playwright').BrowserContext} context
 * @param {string} viewportId
 * @returns {Promise<{ ok: boolean; detail: string }>}
 */
async function establishQaE2eAuth(context, viewportId) {
  const page = await context.newPage();
  const loginUrl = `${baseUrl}/qa/e2e?secret=${encodeURIComponent(e2eSecret)}&redirect=${encodeURIComponent(`/${shopSlug}/admin`)}`;
  try {
    await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });

    await page.waitForURL(
      (url) => {
        const p = url.pathname;
        return p.includes("/admin") && !p.includes("/login") && !p.includes("/qa/e2e");
      },
      { timeout: QA_AUTH_TIMEOUT_MS },
    );

    // Prefer admin chrome; fall back to session signals if chrome is slow.
    const deadline = Date.now() + QA_AUTH_TIMEOUT_MS;
    let hasChrome = false;
    let hasStorage = false;
    let hasCookie = false;
    while (Date.now() < deadline) {
      hasChrome =
        (await page
          .locator('[data-testid="admin-chrome"], [data-testid="admin-nav-board"]')
          .count()) > 0;
      hasStorage = await page.evaluate(() => {
        try {
          const raw = sessionStorage.getItem("barberq_qa_e2e_token");
          if (!raw) return false;
          const parsed = JSON.parse(raw);
          return Boolean(parsed?.token);
        } catch {
          return false;
        }
      });
      const cookies = await context.cookies();
      hasCookie = cookies.some((c) => c.name === "barberq_qa_e2e" && Boolean(c.value));
      if (hasChrome || (hasStorage && hasCookie)) break;
      await page.waitForTimeout(250);
    }

    const onAdmin =
      page.url().includes("/admin") &&
      !page.url().includes("/login") &&
      !page.url().includes("/qa/e2e");
    const ok = onAdmin && (hasChrome || (hasStorage && hasCookie));
    const detail = ok
      ? `chrome=${hasChrome} cookie=${hasCookie} storage=${hasStorage}`
      : `timeout path=${new URL(page.url()).pathname} chrome=${hasChrome} cookie=${hasCookie} storage=${hasStorage}`;
    if (!ok) {
      console.error(`QA E2E auth failed (${viewportId}): ${detail}`);
    } else {
      console.log(`QA E2E auth ok (${viewportId}): ${detail}`);
    }
    return { ok, detail };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`QA E2E auth error (${viewportId}): ${msg}`);
    return { ok: false, detail: msg };
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  assertSafeBaseUrl(baseUrl);
  await rm(REPORT_DIR, { recursive: true, force: true });
  await mkdir(SHOT_DIR, { recursive: true });

  const routes = discoverRoutes(shopSlug);
  const startedAt = new Date().toISOString();
  /** @type {any[]} */
  const issues = [];
  /** @type {any[]} */
  const pages = [];
  /** @type {{ viewportId: string; routeId: string }[]} */
  const skippedAuth = [];
  let authMode = "public-only";
  /** @type {Record<string, string>} */
  const authByViewport = {};

  const browser = await chromium.launch({ headless: true });

  // Probe QA E2E once
  let e2eReady = false;
  if (e2eSecret) {
    try {
      const probe = await fetch(`${baseUrl}/api/qa/e2e-session`, {
        method: "GET",
      });
      if (probe.status === 200) {
        const body = await probe.json();
        e2eReady = Boolean(body?.enabled);
      }
    } catch {
      e2eReady = false;
    }
  }

  for (const [viewportId, vp] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
      userAgent: vp.userAgent,
      locale: locale === "th" ? "th-TH" : "en-US",
    });

    // Thai locale before any app script
    await context.addInitScript((loc) => {
      try {
        localStorage.setItem("barberq_locale", loc);
      } catch {
        /* ignore */
      }
    }, locale);

    /** @type {boolean} */
    let viewportAuthed = false;
    if (e2eReady && e2eSecret) {
      const result = await establishQaE2eAuth(context, viewportId);
      viewportAuthed = result.ok;
      authByViewport[viewportId] = result.detail;
      if (viewportAuthed) {
        authMode = "qa-e2e";
      } else {
        issues.push({
          severity: "fail",
          code: "qa_e2e_auth_failed",
          pageId: "admin-today",
          viewport: viewportId,
          message: `QA E2E login ไม่สำเร็จ: ${result.detail}`,
        });
      }
    }

    for (const route of routes) {
      if (route.auth && !viewportAuthed) {
        skippedAuth.push({ viewportId, routeId: route.id });
        continue;
      }

      const page = await context.newPage();
      /** @type {string[]} */
      const consoleErrors = [];
      /** @type {{ url: string; status?: number; error?: string }[]} */
      const failedRequests = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => consoleErrors.push(String(err)));
      page.on("requestfailed", (req) => {
        const err = req.failure()?.errorText || "";
        // Next.js RSC navigations / prefetch aborts are noise
        if (/ERR_ABORTED|NS_BINDING_ABORTED/i.test(err)) return;
        failedRequests.push({
          url: req.url(),
          error: err,
        });
      });
      page.on("response", (res) => {
        const status = res.status();
        if (status >= 400) {
          const url = res.url();
          // Ignore next static 404 favicons etc.
          if (/\/favicon\.ico(?:\?|$)/.test(url)) return;
          failedRequests.push({ url, status });
        }
      });

      const url = `${baseUrl}${route.path}`;
      let navStatus = 0;
      try {
        const res = await page.goto(url, {
          waitUntil: "networkidle",
          timeout: 60000,
        });
        navStatus = res?.status() ?? 0;
        await page.waitForTimeout(800);
      } catch (err) {
        issues.push({
          severity: "fail",
          code: "navigation_error",
          pageId: route.id,
          viewport: viewportId,
          message: `เปิดหน้าไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`,
        });
      }

      if (navStatus >= 400) {
        issues.push({
          severity: navStatus >= 500 ? "fail" : "warn",
          code: `http_${navStatus}`,
          pageId: route.id,
          viewport: viewportId,
          message: `HTTP ${navStatus} สำหรับ ${route.path}`,
        });
      }

      // Redirected to login while expecting auth
      if (route.auth && page.url().includes("/admin/login")) {
        issues.push({
          severity: "warn",
          code: "auth_redirect",
          pageId: route.id,
          viewport: viewportId,
          message: "ถูกพาไปหน้า login — QA E2E session ยังไม่พร้อมบนเป้าหมายนี้",
        });
      }

      const shotName = `${route.id}__${viewportId}.png`;
      const shotPath = join(SHOT_DIR, shotName);
      try {
        await page.screenshot({ path: shotPath, fullPage: true });
      } catch {
        /* ignore */
      }

      const pageIssues = await collectAnomalies(page, {
        touch: vp.hasTouch,
        consoleErrors,
        failedRequests,
      });
      for (const iss of pageIssues) {
        issues.push({
          ...iss,
          pageId: route.id,
          viewport: viewportId,
          screenshot: shotPath,
        });
      }

      // Tap feedback on every visited page
      try {
        const missing = await auditTapFeedback(page);
        for (const m of missing) {
          if (m.hasPressedFeedback && (!m.asyncLikely || m.hasPendingHint)) continue;
          issues.push({
            severity: "warn",
            code: "no_tap_feedback",
            pageId: route.id,
            viewport: viewportId,
            screenshot: shotPath,
            message: `ไม่มี pressed/pending feedback: “${m.label}”`,
            detail: m,
          });
        }
      } catch {
        /* ignore */
      }

      // Latency only on admin board when authenticated
      if (route.id === "admin-today" && authMode === "qa-e2e") {
        try {
          const lat = await measureNavLatency(page, shopSlug);
          for (const iss of lat) {
            issues.push({
              ...iss,
              pageId: route.id,
              viewport: viewportId,
              screenshot: shotPath,
            });
          }
        } catch {
          /* ignore */
        }
      }

      let pageEntry = pages.find((p) => p.id === route.id);
      if (!pageEntry) {
        pageEntry = { id: route.id, path: route.path, screenshots: [] };
        pages.push(pageEntry);
      }
      pageEntry.screenshots.push({ viewport: viewportId, path: shotPath });

      await page.close();
    }

    await context.close();
  }

  await browser.close();

  const counts = { fail: 0, warn: 0, info: 0 };
  for (const iss of issues) {
    counts[iss.severity] = (counts[iss.severity] || 0) + 1;
  }
  const verdict = counts.fail > 0 ? "FAIL" : counts.warn > 0 ? "WARN" : "PASS";

  const summary = {
    baseUrl,
    shopSlug,
    startedAt,
    finishedAt: new Date().toISOString(),
    authMode,
    authByViewport,
    locale,
    viewportCount: Object.keys(VIEWPORTS).length,
    counts,
    verdict,
    issues,
    pages: pages.filter((p) => p.screenshots?.length),
    skippedAuth,
    skippedAuthRoutes: [...new Set(skippedAuth.map((s) => s.routeId))],
    envVarsForTommy: [
      "QA_E2E_SECRET",
      "BARBERQ_ENV",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_APP_URL",
    ],
  };

  const { htmlPath, jsonPath } = await writeReports(summary, REPORT_DIR);
  console.log(`QA crawl ${verdict}`);
  console.log(`authMode=${authMode}`);
  console.log(`fail=${counts.fail} warn=${counts.warn} info=${counts.info}`);
  console.log(`report: ${htmlPath}`);
  console.log(`json: ${jsonPath}`);

  // Non-zero only on hard fails (keeps optional workflow useful; not a required check)
  if (counts.fail > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
