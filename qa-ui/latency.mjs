import { LATENCY_FAIL_MS, LATENCY_WARN_MS } from "./config.mjs";

/**
 * Measure tap → visible navigation / sheet / menu change.
 * Safe: only clicks primary nav / More menu items, not destructive actions.
 * @param {import('playwright').Page} page
 * @param {string} shopSlug
 */
export async function measureNavLatency(page, shopSlug) {
  const results = [];

  const navCandidates = [
    { name: "Today", sel: `a[href$="/${shopSlug}/admin"], a[href="/${shopSlug}/admin"]` },
    { name: "Team", sel: `a[href*="/${shopSlug}/admin/staff"]` },
    { name: "Summary", sel: `a[href*="/${shopSlug}/admin/stats"]` },
  ];

  // Visible More only — hidden lg:flex side button would burn ~30s actionability wait.
  const moreBtn = page.locator('[data-testid="admin-nav-more"]').filter({ visible: true });
  if ((await moreBtn.count()) > 0) {
    const t0 = Date.now();
    await moreBtn.first().click({ timeout: 2000 }).catch(() => {});
    await page
      .waitForSelector(
        '[role="dialog"][aria-modal="true"], #admin-more-rail, [data-testid="admin-nav-more"][aria-expanded="true"][data-state="open"]',
        { timeout: 2000 },
      )
      .catch(() => {});
    const ms = Date.now() - t0;
    results.push(latencyIssue("More menu", ms));
  }

  for (const item of navCandidates) {
    const loc = page.locator(item.sel).first();
    if ((await loc.count()) === 0) continue;
    const visible = await loc.isVisible().catch(() => false);
    if (!visible) continue;

    const before = page.url();
    const t0 = Date.now();
    await loc.click().catch(() => {});
    await Promise.race([
      page.waitForURL((u) => u.toString() !== before, { timeout: 5000 }).catch(() => {}),
      page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => {}),
    ]);
    // Wait for some content paint
    await page.waitForTimeout(50);
    const ms = Date.now() - t0;
    results.push(latencyIssue(item.name, ms));
  }

  return results;
}

function latencyIssue(name, ms) {
  let severity = "info";
  if (ms > LATENCY_FAIL_MS) severity = "fail";
  else if (ms > LATENCY_WARN_MS) severity = "warn";
  return {
    severity,
    code: "nav_latency",
    message: `นำทาง “${name}” ใช้เวลา ${ms}ms`,
    detail: { name, ms, warnAt: LATENCY_WARN_MS, failAt: LATENCY_FAIL_MS },
  };
}
