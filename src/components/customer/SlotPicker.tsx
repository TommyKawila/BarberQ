"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/locale-provider";
import {
  firstAvailableStartTime,
  partitionPastFutureSlots,
  summarizeAvailableSlots,
} from "@/lib/booking/slot-picker-ui";
import { formatSlotTime } from "@/lib/services/slot-service";
import type { Slot } from "@/types/booking";

interface SlotPickerProps {
  slots: Slot[];
  value: string | null;
  loading?: boolean;
  shopClosed?: boolean;
  onChange: (startTime: string) => void;
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

export function SlotPicker({ slots, value, loading, shopClosed, onChange }: SlotPickerProps) {
  const { t } = useI18n();
  const [showPast, setShowPast] = useState(false);
  const scrolledKeyRef = useRef<string | null>(null);
  const firstAvailableRef = useRef<HTMLButtonElement | null>(null);

  const { past, future } = partitionPastFutureSlots(slots);
  const summary = summarizeAvailableSlots(future);
  const firstAvailable = firstAvailableStartTime(future);
  const slotsKey = slots.map((s) => `${s.startTime}:${s.available ? 1 : 0}`).join("|");

  useEffect(() => {
    setShowPast(false);
  }, [slotsKey]);

  useEffect(() => {
    if (!firstAvailable || loading) return;
    if (scrolledKeyRef.current === slotsKey) return;
    scrolledKeyRef.current = slotsKey;
    const el = firstAvailableRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [firstAvailable, loading, slotsKey]);

  if (loading) {
    return <p className="py-8 text-center text-sm text-zinc-400">{t("booking.slotsLoading")}</p>;
  }

  if (shopClosed) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400">{t("booking.shopClosedDay")}</p>
    );
  }

  if (slots.length === 0 || future.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-400">{t("booking.noSlots")}</p>;
  }

  function renderSlot(slot: Slot, past: boolean) {
    const selected = slot.startTime === value;
    const disabled = !slot.available || past;
    const isFirstAvailable = !past && slot.startTime === firstAvailable;
    return (
      <button
        key={slot.startTime}
        ref={isFirstAvailable ? firstAvailableRef : undefined}
        type="button"
        disabled={disabled}
        onClick={() => onChange(slot.startTime)}
        className={`min-h-12 rounded-lg px-2 py-3 text-sm font-semibold transition ${slotButtonClass({
          selected,
          disabled,
          past,
        })}`}
      >
        {formatSlotTime(slot.startTime)}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {summary ? (
        <p className="text-sm text-zinc-500">
          {t("booking.slotsSummary")
            .replace("{n}", String(summary.availableCount))
            .replace("{time}", formatSlotTime(summary.earliestStartTime))}
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        {future.map((slot) => renderSlot(slot, false))}
      </div>

      {past.length > 0 ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-expanded={showPast}
            onClick={() => setShowPast((v) => !v)}
            className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-zinc-700 px-3 text-left text-sm text-zinc-300"
          >
            <span className="text-zinc-500" aria-hidden>
              {showPast ? "⌃" : "⌄"}
            </span>
            <span className="min-w-0 flex-1">
              {(showPast ? t("booking.hidePastSlots") : t("booking.showPastSlots")).replace(
                "{count}",
                String(past.length),
              )}
            </span>
          </button>

          {showPast ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-zinc-500">{t("booking.pastSlotsLabel")}</p>
              <div className="grid grid-cols-3 gap-2">
                {past.map((slot) => renderSlot(slot, true))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
