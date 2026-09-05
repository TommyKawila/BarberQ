"use client";

import { formatSlotTime } from "@/lib/services/slot-service";
import type { Slot } from "@/types/booking";

interface SlotPickerProps {
  slots: Slot[];
  value: string | null;
  loading?: boolean;
  onChange: (startTime: string) => void;
}

export function SlotPicker({ slots, value, loading, onChange }: SlotPickerProps) {
  if (loading) {
    return <p className="py-8 text-center text-sm text-zinc-400">กำลังโหลดคิวว่าง…</p>;
  }

  if (slots.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400">
        วันนี้ช่างหยุด หรือไม่มีคิวที่จองได้
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot) => {
        const selected = slot.startTime === value;
        const disabled = !slot.available;
        return (
          <button
            key={slot.startTime}
            type="button"
            disabled={disabled}
            onClick={() => onChange(slot.startTime)}
            className={`min-h-11 rounded-lg px-2 py-3 text-sm font-semibold transition ${
              disabled
                ? "cursor-not-allowed bg-zinc-900 text-zinc-600 line-through"
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
  );
}
