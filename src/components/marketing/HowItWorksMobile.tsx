"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { CircleCheck, MessageCircle, Smartphone } from "lucide-react";
import { CustomerStepPhone } from "@/components/marketing/mockups/CustomerJourneyMockups";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";

const STEPS = [1, 2, 3] as const;
const ICONS = [MessageCircle, CircleCheck, Smartphone] as const;
const AUTO_MS = 4000;

/**
 * Mobile (<768) how-it-works: tight step list + one phone, auto-advance with
 * progress, pause offscreen / reduced-motion, tap locks selection.
 */
export function HowItWorksMobile() {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const onTick = useEffectEvent((nextProgress: number, advance: boolean) => {
    setProgress(nextProgress);
    if (advance) {
      setStep((s) => (s === 3 ? 1 : ((s + 1) as 1 | 2 | 3)));
      setProgress(0);
    }
  });

  useEffect(() => {
    if (!autoAdvance || !inView || reducedMotion) {
      setProgress(0);
      return;
    }
    const started = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const elapsed = now - started;
      const p = Math.min(1, elapsed / AUTO_MS);
      if (p >= 1) {
        onTick(0, true);
        return;
      }
      onTick(p * 100, false);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [autoAdvance, inView, reducedMotion, step]);

  const selectStep = (n: 1 | 2 | 3) => {
    setStep(n);
    setAutoAdvance(false);
    setProgress(0);
  };

  return (
    <div ref={rootRef} className="md:hidden">
      <p className="text-sm font-medium tracking-wide text-amber-300/80">
        {t("marketing.how.eyebrow")}
      </p>
      <h2 className="mt-2 text-2xl font-bold leading-[1.3] text-zinc-50">
        {t("marketing.how.title")}
      </h2>

      <div
        role="tablist"
        aria-label={t("marketing.how.title")}
        className="mt-4 flex flex-col gap-1"
      >
        {STEPS.map((n) => {
          const Icon = ICONS[n - 1];
          const selected = step === n;
          return (
            <button
              key={n}
              type="button"
              role="tab"
              id={`how-tab-${n}`}
              aria-selected={selected}
              aria-controls={`how-panel-${n}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectStep(n)}
              className={`relative overflow-hidden rounded-xl px-3 py-2 text-left transition-colors ${
                selected
                  ? "bg-zinc-900/80 ring-1 ring-amber-400/40"
                  : "bg-transparent hover:bg-zinc-900/50"
              }`}
            >
              <span className="flex items-start gap-2.5">
                <span className="mt-0.5 flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums text-amber-400">
                  <Icon size={16} className="shrink-0" strokeWidth={2} aria-hidden />
                  {String(n).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold leading-snug text-zinc-50">
                    {t(`marketing.how.${n}.title` as MessageKey)}
                  </span>
                  {selected ? (
                    <span className="mt-0.5 block text-[13px] leading-snug text-zinc-400">
                      {t(`marketing.how.${n}.desc` as MessageKey)}
                    </span>
                  ) : null}
                </span>
              </span>
              {selected && autoAdvance && !reducedMotion ? (
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-amber-400/90"
                  style={{ transform: `scaleX(${progress / 100})` }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ~26% smaller than prior 270px so step + phone fit a 390×844 viewport */}
      <div className="relative mx-auto mt-3 w-full max-w-[200px]">
        {STEPS.map((n) => (
          <div
            key={n}
            role="tabpanel"
            id={`how-panel-${n}`}
            aria-labelledby={`how-tab-${n}`}
            aria-hidden={step !== n}
            className={`transition-opacity duration-500 ease-out ${
              step === n
                ? "relative opacity-100"
                : "pointer-events-none absolute inset-0 opacity-0"
            }`}
          >
            <CustomerStepPhone step={n} compact />
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-[15px] leading-relaxed text-zinc-300">
        {t("marketing.how.micro")}
      </p>
    </div>
  );
}
