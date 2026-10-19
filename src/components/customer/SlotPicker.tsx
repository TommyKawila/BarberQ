"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/locale-provider";
import { formatSlotTime } from "@/lib/services/slot-service";
import type { Slot } from "@/types/booking";

interface SlotPickerProps {
  slots: Slot[];
  value: string | null;
  loading?: boolean;
  shopClosed?: boolean;
  onChange: (startTime: string) => void;
  now?: Date;
}

function isPastSlot(slot: Slot, now: Date): boolean {
  return new Date(slot.startTime).getTime() <= now.getTime();
}

export function SlotPicker({
  slots,
  value,
  loading,
  shopClosed,
  onChange,
  now: nowProp,
}: SlotPickerProps) {
  const { t } = useI18n();
  const [showPast, setShowPast] = useState(false);
  const firstAvailableRef = useRef<HTMLButtonElement>(null);
  const now = nowProp ?? new Date();

  const { past, future } = useMemo(() => {
    const pastSlots: Slot[] = [];
    const futureSlots: Slot[] = [];
    for (const slot of slots) {
      if (isPastSlot(slot, now)) pastSlots.push(slot);
      else futureSlots.push(slot);
    }
    return { past: pastSlots, future: futureSlots };
  }, [slots, now]);

  const visible = showPast ? [...past, ...future] : future;
  const hasAvailable = future.some((slot) => slot.available);

  useEffect(() => {
    setShowPast(false);
  }, [slots]);

  useEffect(() => {
    if (loading || shopClosed || !hasAvailable) return;
    const id = window.requestAnimationFrame(() => {
      firstAvailableRef.current?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "smooth",
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [loading, shopClosed, hasAvailable, future]);

  if (loading) {
    return <p className="py-8 text-center text-sm text-zinc-400">{t("booking.slotsLoading")}</p>;
  }

  if (shopClosed) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400">{t("booking.shopClosedDay")}</p>
    );
  }

  if (slots.length === 0 || !hasAvailable) {
    return <p className="py-8 text-center text-sm text-zinc-400">{t("booking.noSlots")}</p>;
  }

  let assignedFirstAvailable = false;

  return (
    <div className="flex flex-col gap-3">
      {past.length > 0 ? (
        <button
          type="button"
          onClick={() => setShowPast((open) => !open)}
          className="self-start text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
        >
          {showPast
            ? t("booking.hidePastSlots")
            : t("booking.showPastSlots").replace("{count}", String(past.length))}
        </button>
      ) : null}
      <div className="grid grid-cols-3 gap-2">
        {visible.map((slot) => {
          const selected = slot.startTime === value;
          const disabled = !slot.available;
          const pastSlot = isPastSlot(slot, now);
          const isFirstAvailable = !disabled && !assignedFirstAvailable;
          if (isFirstAvailable) assignedFirstAvailable = true;
          return (
            <button
              key={slot.startTime}
              ref={isFirstAvailable ? firstAvailableRef : undefined}
              type="button"
              disabled={disabled}
              onClick={() => onChange(slot.startTime)}
              className={`min-h-12 rounded-lg px-2 py-3 text-sm font-semibold transition ${
                pastSlot && disabled
                  ? "cursor-not-allowed bg-zinc-950 text-zinc-700 line-through"
                  : disabled
                    ? "cursor-not-allowed bg-zinc-900 text-zinc-500"
                    : selected
                      ? "bg-amber-400 text-zinc-950"
                      : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              }`}
            >
              {formatSlotTime(slot.startTime)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
