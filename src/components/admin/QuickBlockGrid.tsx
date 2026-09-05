"use client";

import { formatSlotTime } from "@/lib/services/slot-service";
import { barberLabel, type AdminColumn, type AdminSlot } from "@/types/booking";

interface QuickBlockGridProps {
  columns: AdminColumn[];
  pendingKey: string | null;
  onToggle: (barberId: string, slot: AdminSlot) => void;
}

function slotClass(slot: AdminSlot, pending: boolean): string {
  if (pending) return "bg-amber-300 text-zinc-950";
  if (!slot.available && slot.kind === "free") {
    return "bg-zinc-900 text-zinc-600";
  }
  if (slot.kind === "booked") return "bg-sky-700 text-white";
  if (slot.kind === "blocked") return "bg-red-600 text-white";
  return "bg-emerald-700 text-white";
}

export function QuickBlockGrid({ columns, pendingKey, onToggle }: QuickBlockGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {columns.map((column) => (
        <div key={column.barber.id} className="flex flex-col gap-2">
          <div className="rounded-lg bg-zinc-900 px-1 py-2 text-center">
            <div className="text-sm font-semibold">{barberLabel(column.barber.name)}</div>
            <div className="text-[10px] text-zinc-400">{column.barber.slot_duration_minutes} นาที</div>
          </div>
          {column.slots.length === 0 ? (
            <p className="px-1 text-center text-xs text-zinc-500">หยุด</p>
          ) : (
            column.slots.map((slot) => {
              const key = `${column.barber.id}:${slot.startTime}`;
              const pending = pendingKey === key;
              const pastFree = slot.kind === "free" && !slot.available;
              const booked = slot.kind === "booked";
              const label =
                slot.kind === "booked"
                  ? slot.customerName
                  : slot.kind === "blocked"
                    ? slot.reason || "Walk-in"
                    : "ว่าง";
              return (
                <button
                  key={slot.startTime}
                  type="button"
                  disabled={pending || booked || pastFree}
                  onClick={() => onToggle(column.barber.id, slot)}
                  className={`min-h-14 rounded-lg px-1 py-2 text-left transition disabled:cursor-default ${slotClass(slot, pending)}`}
                >
                  <div className="text-xs font-bold">{formatSlotTime(slot.startTime)}</div>
                  <div className="truncate text-[11px] leading-tight">{label}</div>
                </button>
              );
            })
          )}
        </div>
      ))}
    </div>
  );
}
