import { DESTRUCTIVE_TEXT_RE } from "./config.mjs";

/**
 * Check visible pressed-state feedback for interactive controls (safe mode).
 * Does not click destructive actions; uses pointerdown sampling + class hints.
 * @param {import('playwright').Page} page
 */
export async function auditTapFeedback(page) {
  return page.evaluate((destructiveReSource) => {
    const destructiveRe = new RegExp(destructiveReSource, "i");
    const results = [];

    const nodes = Array.from(
      document.querySelectorAll(
        'a[href], button, [role="button"], [role="menuitem"]',
      ),
    );

    function styleSig(el) {
      const s = window.getComputedStyle(el);
      return {
        color: s.color,
        bg: s.backgroundColor,
        opacity: s.opacity,
        transform: s.transform,
        filter: s.filter,
      };
    }

    function differs(a, b) {
      return (
        a.color !== b.color ||
        a.bg !== b.bg ||
        a.opacity !== b.opacity ||
        a.transform !== b.transform ||
        a.filter !== b.filter
      );
    }

    function hasActiveClassHint(el) {
      const cls = el.className?.toString?.() || "";
      return (
        /\bactive:/.test(cls) ||
        /\bpressed\b/i.test(cls) ||
        el.hasAttribute("data-pressed") ||
        window
          .getComputedStyle(el, ":active")
          .getPropertyValue("background-color") !==
          window.getComputedStyle(el).backgroundColor
      );
    }

    function hasPendingHint(el) {
      return (
        el.hasAttribute("aria-busy") ||
        el.hasAttribute("disabled") ||
        el.getAttribute("aria-disabled") === "true" ||
        /\bdisabled:opacity/.test(el.className?.toString?.() || "") ||
        /\bpending\b/i.test(el.className?.toString?.() || "")
      );
    }

    for (const el of nodes) {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      if (r.bottom < 0 || r.top > window.innerHeight) continue;

      const label = (
        el.getAttribute("aria-label") ||
        el.textContent ||
        el.getAttribute("href") ||
        el.tagName
      )
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 60);

      const destructive = destructiveRe.test(label);
      const rest = styleSig(el);
      let pressedDiff = hasActiveClassHint(el);

      if (!pressedDiff && !destructive) {
        try {
          el.dispatchEvent(
            new PointerEvent("pointerdown", { bubbles: true, cancelable: true }),
          );
          const pressed = styleSig(el);
          pressedDiff = differs(rest, pressed);
          el.dispatchEvent(
            new PointerEvent("pointerup", { bubbles: true, cancelable: true }),
          );
          el.dispatchEvent(
            new PointerEvent("pointerleave", { bubbles: true, cancelable: true }),
          );
        } catch {
          /* ignore */
        }
      }

      const asyncLikely =
        el.tagName === "BUTTON" &&
        (/บันทึก|ยืนยัน|ส่ง|save|submit|book|จอง|เรียก/i.test(label) ||
          el.getAttribute("type") === "submit");

      const pendingOk = !asyncLikely || hasPendingHint(el) || destructive;

      if (!pressedDiff || (asyncLikely && !pendingOk && !hasPendingHint(el))) {
        results.push({
          label,
          destructive,
          hasPressedFeedback: pressedDiff,
          asyncLikely,
          hasPendingHint: hasPendingHint(el),
          skippedClick: destructive,
        });
      }
    }

    return results;
  }, DESTRUCTIVE_TEXT_RE.source);
}
