"use client";

import { BarberAvatar } from "@/components/barber/BarberAvatar";
import { customerBarberPhotoUrl } from "@/lib/barber/barber-avatar";
import { useI18n } from "@/lib/i18n/locale-provider";
import { barberLabel, type Barber } from "@/types/booking";

interface BarberSelectorProps {
  barbers: Barber[];
  value: string | null;
  onChange: (barberId: string) => void;
}

export function BarberSelector({ barbers, value, onChange }: BarberSelectorProps) {
  const { locale, t } = useI18n();

  return (
    <div className="flex flex-col gap-2">
      {barbers.map((barber) => {
        const selected = barber.id === value;
        const photoUrl = customerBarberPhotoUrl(barber);
        return (
          <button
            key={barber.id}
            type="button"
            onClick={() => onChange(barber.id)}
            className={`flex min-h-[4.5rem] items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${
              selected
                ? "border-amber-400 bg-zinc-900"
                : "border-transparent bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            <BarberAvatar name={barber.name} imageUrl={photoUrl} size="md" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold leading-tight">
                {barberLabel(barber.name, locale)}
              </div>
              <div className="mt-0.5 text-xs text-zinc-400">
                {t("booking.minutesPerSlot").replace(
                  "{minutes}",
                  String(barber.slot_duration_minutes),
                )}
              </div>
            </div>
            {selected ? (
              <span className="text-amber-400" aria-hidden>✓</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
