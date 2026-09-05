"use client";

import { barberLabel, type Barber } from "@/types/booking";

interface BarberSelectorProps {
  barbers: Barber[];
  value: string | null;
  onChange: (barberId: string) => void;
}

export function BarberSelector({ barbers, value, onChange }: BarberSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {barbers.map((barber) => {
        const selected = barber.id === value;
        return (
          <button
            key={barber.id}
            type="button"
            onClick={() => onChange(barber.id)}
            className={`min-w-[6.5rem] flex-1 rounded-xl px-3 py-3 text-left transition ${
              selected
                ? "bg-amber-400 text-zinc-950"
                : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
            }`}
          >
            <div className="text-sm font-semibold leading-tight">{barberLabel(barber.name)}</div>
            <div className={`mt-1 text-xs ${selected ? "text-zinc-800" : "text-zinc-400"}`}>
              {barber.slot_duration_minutes} นาที
            </div>
          </button>
        );
      })}
    </div>
  );
}
