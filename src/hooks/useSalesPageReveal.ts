"use client";

import { type RefObject, useEffect } from "react";

/**
 * Once-only scroll reveals for the sales page.
 * Progressive: content stays visible until JS opts in (`data-cq-reveal="on"`).
 * In-view nodes are marked before opt-in so hydration does not flash-hide them.
 */
export function useSalesPageReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    if (nodes.length === 0) return;

    const markIn = (el: HTMLElement) => {
      el.dataset.revealIn = "";
    };

    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    for (const el of nodes) {
      const r = el.getBoundingClientRect();
      if (r.top < viewportH * 0.92 && r.bottom > 40) {
        markIn(el);
      }
    }

    document.documentElement.dataset.cqReveal = "on";

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          markIn(el);
          obs.unobserve(el);
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
    );

    for (const el of nodes) {
      if ("revealIn" in el.dataset) continue;
      obs.observe(el);
    }

    return () => {
      obs.disconnect();
      delete document.documentElement.dataset.cqReveal;
    };
  }, [rootRef]);
}
