"use client";

import { type RefObject, useEffect } from "react";

/**
 * Once-only scroll reveals for the sales page.
 * Progressive: content stays visible; JS adds `html.js` + `data-cq-reveal="on"`
 * so CSS can animate transform only (never opacity:0 hide).
 * prefers-reduced-motion: mark all in immediately (no animation).
 */
export function useSalesPageReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;

    const html = document.documentElement;
    html.classList.add("js");

    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    if (nodes.length === 0) return;

    const markIn = (el: HTMLElement) => {
      el.dataset.revealIn = "";
    };

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      for (const el of nodes) markIn(el);
      return () => {
        html.classList.remove("js");
      };
    }

    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    for (const el of nodes) {
      const r = el.getBoundingClientRect();
      if (r.top < viewportH * 0.92 && r.bottom > 40) {
        markIn(el);
      }
    }

    html.dataset.cqReveal = "on";

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
      delete html.dataset.cqReveal;
      html.classList.remove("js");
    };
  }, [rootRef]);
}
