"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/locale-provider";
import {
  firstAvailableStartTime,
  partitionPastFutureSlots,
  slotTimeRangeLabel,
  summarizeAvailableSlots,
} from "@/lib/booking/slot-picker-ui";
import { formatSlotTime } from "@/lib/services/slot-service";
import type { Slot } from "@/types/booking";

interface SlotPickerProps {
  slots: Slot[];
  value: string | null;
  loading?: boolean;
  shopClosed?: boolean;
  dateKey?: string | null;
  skipAutoScroll?: boolean;
  onChange: (startTime: string) => void;
  onViewNextDay?: () => void;
}

function slotButtonClass(opts: {
  selected: boolean;
  disabled: boolean;
  past: boolean;
}): string {
  const { selected, disabled, past } = opts;
  if (past || (disabled && !selected)) {
    return "cursor-not-allowed border border-zinc-700 bg-transparent text-zinc-500";
  }
  if (selected) {
    return "bg-amber-400 text-zinc-950";
  }
  return "bg-zinc-900 text-white hover:bg-zinc-800";
}

export function SlotPicker({
  slots,
  value,
  loading,
  shopClosed,
  dateKey,
  skipAutoScroll = false,
  onChange,
  onViewNextDay,
}: SlotPickerProps) {
  const { t } = useI18n();
  const [expandedPastKey, setExpandedPastKey] = useState<string | null>(null);
  const scrolledKeyRef = useRef<string | null>(null);
  const userScrolledRef = useRef(false);
  const firstAvailableRef = useRef<HTMLButtonElement | null>(null);

  const { past, future } = partitionPastFutureSlots(slots);
  const summary = summarizeAvailableSlots(future);
  const firstAvailable = firstAvailableStartTime(future);
  const pastRange = slotTimeRangeLabel(past, formatSlotTime);
  const slotsKey = `${dateKey ?? ""}|${slots.map((s) => `${s.startTime}:${s.available ? 1 : 0}`).join("|")}`;
  const showPast = expandedPastKey === slotsKey;

  useEffect(() => {
    userScrolledRef.current = false;
    const onScroll = () => {
      userScrolledRef.current = true;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dateKey]);

  useEffect(() => {
    if (!firstAvailable || loading || skipAutoScroll) return;
    if (value) return;
    if (userScrolledRef.current) return;
    if (scrolledKeyRef.current === slotsKey) return;
    scrolledKeyRef.current = slotsKey;
    const el = firstAvailableRef.current;
    if (!el) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
      inline: "nearest",
    });
    requestAnimationFrame(() => {
      el.focus({ preventScroll: true });
    });
  }, [firstAvailable, loading, skipAutoScroll, slotsKey, value]);

  if (loading) {
    return <p className="py-8 text-center text-sm text-zinc-400">{t("booking.slotsLoading")}</p>;
  }

  if (shopClosed) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400">{t("booking.shopClosedDay")}</p>
    );
  }

  function renderFutureSlot(slot: Slot) {
    const selected = slot.startTime === value;
    const disabled = !slot.available;
    const isFirstAvailable = slot.startTime === firstAvailable;
    return (
      <button
        key={slot.startTime}
        ref={isFirstAvailable ? firstAvailableRef : undefined}
        type="button"
        disabled={disabled}
        onClick={() => onChange(slot.startTime)}
        className={`h-12 rounded-lg px-2 text-sm font-semibold transition ${slotButtonClass({
          selected,
          disabled,
          past: false,
        })}`}
      >
        {formatSlotTime(slot.startTime)}
      </button>
    );
  }

  function renderPastSlot(slot: Slot) {
    return (
      <button
        key={slot.startTime}
        type="button"
        tabIndex={-1}
        aria-disabled
        className={`h-12 rounded-lg px-2 text-sm font-semibold transition ${slotButtonClass({
          selected: false,
          disabled: true,
          past: true,
        })}`}
      >
        {formatSlotTime(slot.startTime)}
      </button>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm text-zinc-400">{t("booking.noSlots")}</p>
        {onViewNextDay ? (
          <button
            type="button"
            onClick={onViewNextDay}
            className="min-h-11 rounded-xl border border-zinc-700 px-4 text-sm font-medium text-zinc-100"
          >
            {t("booking.viewNextDay")}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {summary ? (
        <p className="text-sm text-zinc-400" aria-live="polite">
          {t("booking.availableSummary")
            .replace("{n}", String(summary.availableCount))
            .replace("{time}", formatSlotTime(summary.earliestStartTime))}
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-sm text-zinc-400">{t("booking.noSlots")}</p>
          {onViewNextDay ? (
            <button
              type="button"
              onClick={onViewNextDay}
              className="min-h-11 rounded-xl border border-zinc-700 px-4 text-sm font-medium text-zinc-100"
            >
              {t("booking.viewNextDay")}
            </button>
          ) : null}
        </div>
      )}

      {future.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
          {future.map((slot) => renderFutureSlot(slot))}
        </div>
      ) : null}

      {past.length > 0 ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-expanded={showPast}
            onClick={() => setExpandedPastKey(showPast ? null : slotsKey)}
            className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-zinc-700 px-3 text-left text-sm text-zinc-300"
          >
            <span className="text-zinc-500" aria-hidden>
              {showPast ? "⌃" : "⌄"}
            </span>
            <span className="min-w-0 flex-1">
              {(showPast ? t("booking.hidePastTimes") : t("booking.showPastTimes")).replace(
                "{count}",
                String(past.length),
              )}
            </span>
            {!showPast && pastRange ? (
              <span className="shrink-0 text-xs text-zinc-500">{pastRange}</span>
            ) : null}
          </button>

          {showPast ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-zinc-500">{t("booking.pastUnavailable")}</p>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                {past.map((slot) => renderPastSlot(slot))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
