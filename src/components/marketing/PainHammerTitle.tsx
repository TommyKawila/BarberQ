"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n/locale-provider";

/**
 * Pain section H2 — once-per-view line-by-line "hammer" punch-in.
 * Progressive: fully visible without JS / with reduced-motion.
 */
export function PainHammerTitle() {
  const { t } = useI18n();
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const line1Ref = useRef<HTMLSpanElement | null>(null);
  const line2Ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const heading = headingRef.current;
    const line1 = line1Ref.current;
    const line2 = line2Ref.current;
    if (!heading || !line1 || !line2) return;
    if (typeof IntersectionObserver === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    let played = false;
    let t1 = 0;
    let t2 = 0;

    const play = () => {
      if (played) return;
      played = true;
      // Arm hide styles, then punch lines on consecutive frames.
      heading.dataset.painHammer = "on";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          line1.classList.add("pain-hammer-hit");
          t1 = window.setTimeout(() => {
            line2.classList.add("pain-hammer-hit");
          }, 400);
          t2 = window.setTimeout(() => {
            heading.dataset.painHammer = "done";
          }, 400 + 360);
        });
      });
    };

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        obs.disconnect();
        play();
      },
      { threshold: 0.4, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(heading);

    return () => {
      obs.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return (
    <h2
      ref={headingRef}
      data-pain-hammer-title
      className="text-[2rem] font-extrabold leading-[1.28] tracking-tight sm:text-[2.5rem] lg:text-[58px] xl:text-[64px]"
    >
      <span
        ref={line1Ref}
        className="pain-hammer-line inline-block text-amber-300"
      >
        <span className="text-zinc-50">“</span>
        {t("marketing.pain.titleLead")}
        <span className="text-zinc-50">”</span>
      </span>
      <br />
      <span
        ref={line2Ref}
        className="pain-hammer-line inline-block text-zinc-50"
      >
        {t("marketing.pain.titleRest")}
      </span>
    </h2>
  );
}
