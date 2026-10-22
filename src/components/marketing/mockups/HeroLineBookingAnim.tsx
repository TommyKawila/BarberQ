"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { PhoneFrame } from "./PhoneFrame";
import {
  HOW_DEMO_BOOKING,
  WarmNoteFlexCard,
} from "./WarmNoteFlexCard";
import { useI18n } from "@/lib/i18n/locale-provider";

/** Scene dwell times (ms). Loop ≈ 9.3s + transitions. */
const SCENE_MS = [2500, 800, 3000, 3000] as const;
const TRANSITION_MS = 350;

const MENU_CELLS = [
  { id: "book", label: "จองคิว", prominent: true },
  { id: "mine", label: "คิวของฉัน", prominent: false },
  { id: "services", label: "บริการ & ราคา", prominent: false },
  { id: "barbers", label: "ช่างของเรา", prominent: false },
  { id: "hours", label: "ที่ตั้ง & เวลาเปิด", prominent: false },
  { id: "contact", label: "ติดต่อร้าน", prominent: false },
] as const;

const BARBERS = [
  { name: "มิกซ์", en: "Mix" },
  { name: "โอ๊ต", en: "Oat" },
  { name: "เจ", en: "Jay" },
  { name: "นนท์", en: "Non" },
] as const;

const SLOTS = ["20:00", "20:30", "21:00", "21:30", "22:00"] as const;
const REMINDERS = ["1 วัน", "30 นาที", "ไม่เตือน"] as const;

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
    <span className="pointer-events-none absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded-md border border-amber-400/50 bg-zinc-950/90 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-amber-200 shadow-sm">
      ตัวอย่างร้านสาธิต
    </span>
  );
}

function LineChatChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col bg-[#747474] text-zinc-900">
      <div className="flex h-[8%] shrink-0 items-end justify-between px-[5%] pb-[1%] text-[10px] font-semibold text-white">
        <span>9:41</span>
        <span className="inline-block h-[7px] w-[14px] rounded-[2px] border border-white/80" />
      </div>
      <div className="flex items-center gap-2 bg-[#42607A] px-2.5 py-1.5 text-white">
        <span className="text-sm leading-none">‹</span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[12px] font-semibold">
            {HOW_DEMO_BOOKING.shopName}
          </span>
          <span className="text-[9px] text-white/70">Official Account</span>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col bg-[#8CABD0]">
        {children}
      </div>
    </div>
  );
}

function RichMenuGrid({ showTap }: { showTap: boolean }) {
  return (
    <div className="mt-auto grid shrink-0 grid-cols-3 gap-px border-t border-zinc-800 bg-zinc-950">
      {MENU_CELLS.map((cell) => (
        <div
          key={cell.id}
          className={`relative flex min-h-[2.75rem] flex-col items-center justify-center px-1 py-1.5 text-center sm:min-h-[3.25rem] ${
            cell.prominent
              ? "bg-amber-400 text-zinc-950"
              : "bg-zinc-900 text-amber-100/90"
          }`}
        >
          <span
            className={`text-[12px] font-bold leading-tight ${
              cell.prominent ? "text-zinc-950" : "text-zinc-100"
            }`}
          >
            {cell.label}
          </span>
          {cell.prominent && showTap ? (
            <span
              className="hero-tap-pulse pointer-events-none absolute left-1/2 top-[62%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200 ring-2 ring-amber-50/90"
              aria-hidden
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SceneRichMenu({ showTap }: { showTap: boolean }) {
  return (
    <LineChatChrome>
      <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden px-2.5 pb-1 pt-2">
        <div className="mb-1.5 self-start rounded-2xl rounded-tl-sm bg-white px-2.5 py-1.5 text-[12px] leading-snug text-zinc-800 shadow-sm">
          สวัสดีครับ ยินดีต้อนรับสู่ {HOW_DEMO_BOOKING.shopName}
          <br />
          กดเมนูด้านล่างเพื่อจองคิวได้เลยครับ
        </div>
      </div>
      <RichMenuGrid showTap={showTap} />
    </LineChatChrome>
  );
}

function SceneBooking() {
  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-50">
      <div className="shrink-0 border-b border-zinc-800/80 px-2.5 pb-1.5 pt-8">
        <p className="truncate text-center text-[12px] font-semibold text-zinc-100">
          {HOW_DEMO_BOOKING.shopName}
        </p>
        <p className="truncate text-center text-[12px] text-zinc-500">
          เลือกช่าง · วัน · เวลา
        </p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden px-2 py-2">
        <p className="text-[12px] font-medium text-zinc-500">เลือกช่าง</p>
        <ul className="space-y-1">
          {BARBERS.map((b) => {
            const selected = b.name === "เจ";
            return (
              <li
                key={b.name}
                className={`flex items-center gap-2 rounded-lg px-2 py-1 text-[12px] ${
                  selected
                    ? "border border-amber-400/70 bg-amber-400/15 font-semibold text-amber-100"
                    : "border border-zinc-800 bg-zinc-900/70 text-zinc-300"
                }`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-amber-300">
                  {b.name.slice(0, 1)}
                </span>
                <span className="min-w-0 truncate">
                  {b.name} · {b.en}
                </span>
                {selected ? (
                  <span className="ml-auto text-[12px] text-amber-300" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
        <p className="mt-0.5 text-[12px] font-medium text-zinc-500">วัน · เวลา</p>
        <p className="text-[12px] font-semibold text-amber-200">{HOW_DEMO_BOOKING.date}</p>
        <div className="grid grid-cols-3 gap-1">
          {SLOTS.map((slot) => {
            const selected = slot === HOW_DEMO_BOOKING.timeShort;
            return (
              <span
                key={slot}
                className={`inline-flex min-h-8 items-center justify-center rounded-lg text-[12px] font-semibold tabular-nums ${
                  selected
                    ? "bg-amber-400 text-zinc-950"
                    : "border border-zinc-700 text-zinc-300"
                }`}
              >
                {slot}
              </span>
            );
          })}
        </div>
        <p className="mt-0.5 text-[12px] font-medium text-zinc-500">เตือนก่อนถึงคิว</p>
        <div className="flex flex-wrap gap-1">
          {REMINDERS.map((r) => (
            <span
              key={r}
              className={`rounded-md px-2 py-1 text-[12px] font-medium ${
                r === "30 นาที"
                  ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/50"
                  : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-700"
              }`}
            >
              {r}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SceneSuccess() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-zinc-950">
      <div className="relative flex h-[42%] shrink-0 items-end justify-center overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 70% at 50% 75%, rgba(251,191,36,0.18) 0%, transparent 70%)",
          }}
        />
        <Image
          src="/sale/booking-success-chair-capture.png"
          alt=""
          width={220}
          height={260}
          className="relative z-[1] h-full w-auto object-contain object-bottom"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, transparent 8%, black 28%, black 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, transparent 8%, black 28%, black 100%)",
          }}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden bg-[#8CABD0] px-2.5 py-2">
        <WarmNoteFlexCard
          variant="confirm"
          shopName={HOW_DEMO_BOOKING.shopName}
          barberName={HOW_DEMO_BOOKING.barberName}
          date={HOW_DEMO_BOOKING.date}
          time={HOW_DEMO_BOOKING.time}
          bookingCode={HOW_DEMO_BOOKING.bookingCode}
          className="shadow-sm"
        />
      </div>
    </div>
  );
}

/**
 * Auto-playing HTML/CSS phone — LINE OA rich menu → book → success.
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

  // Screenshot / QA helper — jump to a scene without waiting for the loop
  useEffect(() => {
    const w = window as Window & {
      __setHeroScenes?: Set<(n: number) => void>;
    };
    if (!w.__setHeroScenes) w.__setHeroScenes = new Set();
    const setter = (n: number) => {
      setFade(false);
      setPressed(true); // pause autoplay while inspecting
      setScene(((n % SCENE_MS.length) + SCENE_MS.length) % SCENE_MS.length);
    };
    w.__setHeroScenes.add(setter);
    return () => {
      w.__setHeroScenes?.delete(setter);
    };
  }, []);

  useEffect(() => {
    if (typeof initialScene === "number") return; // screenshot / pinned scene
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
        className="relative mx-auto"
        style={{
          width: "min(240px, calc(55vh * 390 / 844))",
          maxHeight: "55vh",
        }}
      >
        <PhoneFrame fluid className="mx-auto w-full">
          <div
            className="h-full w-full ease-out"
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
            {scene === 0 || scene === 1 ? (
              <SceneRichMenu showTap={scene === 1} />
            ) : null}
            {scene === 2 ? <SceneBooking /> : null}
            {scene === 3 ? <SceneSuccess /> : null}
          </div>
        </PhoneFrame>
        <DemoShopTag />
      </div>

      <div
        role="tablist"
        aria-label={t("marketing.hero.animDotsLabel")}
        className="mt-3 flex items-center justify-center gap-1"
      >
        {([0, 1, 2] as const).map((dot) => {
          const labelKey = (
            ["marketing.hero.animDot1", "marketing.hero.animDot2", "marketing.hero.animDot3"] as const
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
