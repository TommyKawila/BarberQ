import { RAW_ENUM_STRINGS, TAP_MIN_PX } from "./config.mjs";

/**
 * Collect visual / a11y / network anomalies for the current page.
 * @param {import('playwright').Page} page
 * @param {{ touch: boolean; consoleErrors: string[]; failedRequests: { url: string; status?: number; error?: string }[] }} ctx
 */
export async function collectAnomalies(page, ctx) {
  const issues = [];

  const dom = await page.evaluate(
    ({ tapMin, enums }) => {
      const out = {
        blank: false,
        overflowX: false,
        outsideViewport: [],
        overlaps: [],
        smallTargets: [],
        rawEnums: [],
        missingImages: [],
      };

      const body = document.body;
      if (!body || body.innerText.trim().length < 8) out.blank = true;

      const docW = document.documentElement.clientWidth;
      if (document.documentElement.scrollWidth > docW + 2) out.overflowX = true;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      /** @type {Element[]} */
      const interactives = Array.from(
        document.querySelectorAll(
          'a[href], button, [role="button"], [role="menuitem"], input[type="submit"], input[type="button"]',
        ),
      ).filter((el) => {
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });

      for (const el of interactives) {
        const r = el.getBoundingClientRect();
        if (r.right < -2 || r.bottom < -2 || r.left > vw + 2 || r.top > vh + 2000) {
          // far off-page (not just below fold) — skip below-fold
          if (r.left > vw + 2 || r.right < -2) {
            out.outsideViewport.push({
              tag: el.tagName.toLowerCase(),
              text: (el.textContent || "").trim().slice(0, 40),
              left: Math.round(r.left),
              top: Math.round(r.top),
            });
          }
        }
        if (r.width > 0 && r.height > 0 && (r.width < tapMin || r.height < tapMin)) {
          out.smallTargets.push({
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || el.getAttribute("aria-label") || "")
              .trim()
              .slice(0, 40),
            w: Math.round(r.width),
            h: Math.round(r.height),
          });
        }
      }

      // Pairwise overlap of interactives in viewport (cap)
      const inView = interactives
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw)
        .slice(0, 40);

      function overlapArea(a, b) {
        const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        return x * y;
      }

      function stickyChrome(el) {
        return Boolean(
          el.closest('[data-testid="admin-thumb-bar"]') ||
            el.closest("nav.fixed") ||
            el.closest('[data-testid="admin-nav-more"]')?.closest("nav"),
        );
      }

      for (let i = 0; i < inView.length; i++) {
        for (let j = i + 1; j < inView.length; j++) {
          const a = inView[i];
          const b = inView[j];
          if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
          // Sticky thumb bar / bottom nav intentionally overlays scrollable content.
          if (stickyChrome(a.el) !== stickyChrome(b.el)) continue;
          const area = overlapArea(a.r, b.r);
          if (area > 80) {
            out.overlaps.push({
              a: (a.el.textContent || "").trim().slice(0, 30),
              b: (b.el.textContent || "").trim().slice(0, 30),
              area: Math.round(area),
            });
          }
        }
      }

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const enumSet = new Set(enums.map((e) => e.toLowerCase()));
      let node;
      while ((node = walker.nextNode())) {
        const t = (node.textContent || "").trim();
        if (!t || t.length > 40) continue;
        if (enumSet.has(t.toLowerCase())) {
          out.rawEnums.push(t);
        }
      }

      for (const img of Array.from(document.images)) {
        // Only flag finished loads that failed (avoid lazy/in-flight next/image)
        if (img.complete && img.naturalWidth === 0) {
          out.missingImages.push(img.currentSrc || img.src || "(img)");
        }
      }

      return out;
    },
    { tapMin: TAP_MIN_PX, enums: RAW_ENUM_STRINGS },
  );

  if (dom.blank) {
    issues.push({
      severity: "fail",
      code: "blank_page",
      message: "หน้าว่างหรือมีข้อความน้อยมาก",
    });
  }
  if (dom.overflowX) {
    issues.push({
      severity: "fail",
      code: "horizontal_overflow",
      message: "มี horizontal overflow (เลื่อนซ้าย-ขวาได้)",
    });
  }
  for (const item of dom.outsideViewport.slice(0, 5)) {
    issues.push({
      severity: "warn",
      code: "outside_viewport",
      message: `องค์ประกอบอยู่นอก viewport: ${item.tag} “${item.text}”`,
      detail: item,
    });
  }
  for (const item of dom.overlaps.slice(0, 5)) {
    issues.push({
      severity: "fail",
      code: "overlapping_interactive",
      message: `ปุ่ม/ลิงก์ทับกัน: “${item.a}” ∩ “${item.b}”`,
      detail: item,
    });
  }
  if (ctx.touch) {
    for (const item of dom.smallTargets.slice(0, 8)) {
      issues.push({
        severity: "warn",
        code: "small_tap_target",
        message: `เป้าแตะเล็กกว่า ${TAP_MIN_PX}px: “${item.text || item.tag}” (${item.w}×${item.h})`,
        detail: item,
      });
    }
  }
  for (const raw of [...new Set(dom.rawEnums)].slice(0, 8)) {
    issues.push({
      severity: "warn",
      code: "untranslated_enum",
      message: `พบสตริงอังกฤษดิบในโหมดไทย: “${raw}”`,
      detail: { raw },
    });
  }
  for (const src of dom.missingImages.slice(0, 5)) {
    issues.push({
      severity: "fail",
      code: "missing_image",
      message: `รูปไม่โหลด: ${src.slice(0, 120)}`,
    });
  }
  for (const err of ctx.consoleErrors.slice(0, 8)) {
    issues.push({
      severity: "fail",
      code: "console_error",
      message: `Console error: ${err.slice(0, 200)}`,
    });
  }
  for (const fail of ctx.failedRequests.slice(0, 10)) {
    const status = fail.status ?? 0;
    const sev = status >= 500 || status === 0 ? "fail" : "warn";
    issues.push({
      severity: sev,
      code: status >= 400 ? `http_${status}` : "network_failed",
      message: `คำขอผิดพลาด ${status || "ERR"}: ${fail.url.slice(0, 160)}`,
      detail: fail,
    });
  }

  return issues;
}
