"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/locale-provider";

/** Scene dwell times (ms). Loop ≈ 9.3s + transitions. */
const SCENE_MS = [2500, 800, 3000, 3000] as const;
const TRANSITION_MS = 350;

/** Keyed phone mockup (864×1152). Screen measured from chroma plate. */
const PHOTO = {
  src: "/sale/hero-phone-mockup.webp",
  width: 864,
  height: 1152,
} as const;

/**
 * Screen overlay as % of photo — 2px larger than measured screen
 * (x 32.986%, y 21.615%, w 33.796%, h 55.903%; radius ≈ 29px).
 */
const SCREEN_OVERLAY = {
  left: "32.755%",
  top: "21.441%",
  width: "34.259%",
  height: "56.25%",
  borderRadius: "9.8% / 4.48%",
} as const;

/** Real screen images (WebP; AVIF via <picture>). Intrinsic ~780×1688. */
const SCREENS = {
  line: {
    webp: "/sale/hero-screens/line-rich-menu.webp",
    avif: "/sale/hero-screens/line-rich-menu.avif",
    width: 780,
    height: 1688,
  },
  booking: {
    webp: "/sale/hero-screens/booking.webp",
    avif: "/sale/hero-screens/booking.avif",
    width: 780,
    height: 1688,
  },
  success: {
    webp: "/sale/hero-screens/success.webp",
    avif: "/sale/hero-screens/success.avif",
    width: 780,
    height: 1688,
  },
} as const;

/**
 * Tap target on จองคิว (gold cell) as % of the LINE screen image.
 * Measured from Tommy’s rich-menu PNG.
 */
const TAP_PCT = { left: "16.54%", top: "75.32%" } as const;

/** Dot index 0→menu(+tap), 1→booking, 2→success */
function sceneToDot(scene: number): 0 | 1 | 2 {
  if (scene <= 1) return 0;
  if (scene === 2) return 1;
  return 2;
}

function dotToScene(dot: 0 | 1 | 2): number {
  return ([0, 2, 3] as const)[dot];
}

function DemoShopTag() {
  return (
    <span className="pointer-events-none absolute left-1/2 top-[3.5%] z-30 -translate-x-1/2 rounded-md border border-amber-400/50 bg-zinc-950/90 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-amber-200 shadow-sm">
      ตัวอย่างร้านสาธิต
    </span>
  );
}

function ScreenImage({
  screen,
  priority,
}: {
  screen: (typeof SCREENS)[keyof typeof SCREENS];
  priority?: boolean;
}) {
  return (
    <picture>
      <source srcSet={screen.avif} type="image/avif" />
      <Image
        src={screen.webp}
        alt=""
        width={screen.width}
        height={screen.height}
        priority={priority}
        sizes="(max-width: 1023px) 40vw, 160px"
        className="absolute inset-0 h-full w-full object-cover object-top"
      />
    </picture>
  );
}

/**
 * Auto-playing phone — real LINE / booking / success screens inside photo mockup.
 * Pause off-screen / while pressed; reduced-motion = scene 1 + dots only.
 */
export function HeroLineBookingAnim({
  className,
  initialScene,
}: {
  className?: string;
  /** When set (e.g. ?heroScene=), start on that scene and stay paused (SSR screenshots). */
  initialScene?: number;
}) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const startScene =
    typeof initialScene === "number" && initialScene >= 0 && initialScene <= 3
      ? initialScene
      : 0;
  const [scene, setScene] = useState(startScene);
  const [inView, setInView] = useState(false);
  const [pressed, setPressed] = useState(typeof initialScene === "number");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const w = window as Window & {
      __setHeroScenes?: Set<(n: number) => void>;
    };
    if (!w.__setHeroScenes) w.__setHeroScenes = new Set();
    const setter = (n: number) => {
      setFade(false);
      setPressed(true);
      setScene(((n % SCENE_MS.length) + SCENE_MS.length) % SCENE_MS.length);
    };
    w.__setHeroScenes.add(setter);
    return () => {
      w.__setHeroScenes?.delete(setter);
    };
  }, []);

  useEffect(() => {
    if (typeof initialScene === "number") return;
    if (reducedMotion || !inView || pressed) return;
    const dwell = SCENE_MS[scene] ?? 2500;
    const t = window.setTimeout(() => {
      setFade(true);
      window.setTimeout(() => {
        setScene((s) => (s + 1) % SCENE_MS.length);
        setFade(false);
      }, TRANSITION_MS);
    }, dwell);
    return () => window.clearTimeout(t);
  }, [scene, inView, pressed, reducedMotion, initialScene]);

  const goDot = (dot: 0 | 1 | 2) => {
    const next = dotToScene(dot);
    if (reducedMotion) {
      setScene(next);
      setFade(false);
      return;
    }
    setFade(true);
    window.setTimeout(() => {
      setScene(next);
      setFade(false);
    }, TRANSITION_MS);
  };

  const activeDot = sceneToDot(scene);
  const showLine = scene === 0 || scene === 1;
  const showTap = scene === 1;

  return (
    <div
      ref={rootRef}
      data-hero-scene={scene}
      className={`flex w-full flex-col items-center ${className ?? ""}`}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
    >
      <p className="sr-only">{t("marketing.hero.animSr")}</p>
      <div
        aria-hidden
        className="relative mx-auto w-full max-h-[55vh] max-w-[min(100%,calc(55vh*864/1152))] lg:max-h-none lg:max-w-none"
      >
        <div className="relative mx-auto w-full" style={{ aspectRatio: "864 / 1152" }}>
          <picture>
            <source srcSet="/sale/hero-phone-mockup.avif" type="image/avif" />
            <Image
              src={PHOTO.src}
              alt=""
              width={PHOTO.width}
              height={PHOTO.height}
              priority
              sizes="(max-width: 1023px) min(92vw, 55vh), 420px"
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
            />
          </picture>

          <div
            className="absolute overflow-hidden bg-black"
            style={{
              left: SCREEN_OVERLAY.left,
              top: SCREEN_OVERLAY.top,
              width: SCREEN_OVERLAY.width,
              height: SCREEN_OVERLAY.height,
              borderRadius: SCREEN_OVERLAY.borderRadius,
            }}
          >
            <div
              className="absolute inset-0 ease-out"
              style={
                reducedMotion
                  ? undefined
                  : {
                      transitionProperty: "opacity",
                      transitionDuration: `${TRANSITION_MS}ms`,
                      opacity: fade ? 0 : 1,
                    }
              }
            >
              {showLine ? (
                <>
                  <ScreenImage screen={SCREENS.line} priority />
                  {showTap ? (
                    <span
                      className="hero-tap-pulse pointer-events-none absolute z-10 h-[7%] w-[12%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200 ring-2 ring-amber-50/90"
                      style={{ left: TAP_PCT.left, top: TAP_PCT.top }}
                    />
                  ) : null}
                </>
              ) : null}
              {scene === 2 ? <ScreenImage screen={SCREENS.booking} /> : null}
              {scene === 3 ? <ScreenImage screen={SCREENS.success} /> : null}
            </div>
          </div>
          <DemoShopTag />
        </div>
      </div>

      <div
        role="tablist"
        aria-label={t("marketing.hero.animDotsLabel")}
        className="mt-3 flex items-center justify-center gap-1"
      >
        {([0, 1, 2] as const).map((dot) => {
          const labelKey = (
            [
              "marketing.hero.animDot1",
              "marketing.hero.animDot2",
              "marketing.hero.animDot3",
            ] as const
          )[dot];
          return (
            <button
              key={dot}
              type="button"
              role="tab"
              aria-selected={activeDot === dot}
              aria-label={t(labelKey)}
              onClick={() => goDot(dot)}
              className="inline-flex h-11 w-11 items-center justify-center"
            >
              <span
                className={`block h-2.5 w-2.5 rounded-full transition-colors ${
                  activeDot === dot ? "bg-amber-400" : "bg-zinc-600"
                }`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
