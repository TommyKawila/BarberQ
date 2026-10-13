"use client";

import { useI18n } from "@/lib/i18n/locale-provider";
import { ALLOWED_SLOT_DURATIONS } from "@/lib/schedule/validation";

interface AddBarberSheetProps {
  open: boolean;
  name: string;
  lineId: string;
  slotDuration: number;
  saving: boolean;
  formMessage: string | null;
  onClose: () => void;
  onChangeName: (v: string) => void;
  onChangeLineId: (v: string) => void;
  onChangeSlotDuration: (v: number) => void;
  onSave: () => void;
}

export function AddBarberSheet({
  open,
  name,
  lineId,
  slotDuration,
  saving,
  formMessage,
  onClose,
  onChangeName,
  onChangeLineId,
  onChangeSlotDuration,
  onSave,
}: AddBarberSheetProps) {
  const { t } = useI18n();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-zinc-950 p-4 pb-8 sm:rounded-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700" />
        <h2 className="text-base font-semibold">{t("admin.addBarber")}</h2>
        <label className="mt-3 flex flex-col gap-1 text-sm">
          {t("admin.barberName")}
          <input
            value={name}
            onChange={(e) => onChangeName(e.target.value)}
            className="min-h-11 rounded-lg bg-zinc-800 px-3 outline-none ring-amber-400 focus:ring-2"
          />
        </label>
        <label className="mt-3 flex flex-col gap-1 text-sm">
          {t("admin.barberLineHint")}
          <input
            value={lineId}
            onChange={(e) => onChangeLineId(e.target.value)}
            className="min-h-11 rounded-lg bg-zinc-800 px-3 outline-none ring-amber-400 focus:ring-2"
          />
        </label>
        <label className="mt-3 flex flex-col gap-1 text-sm">
          {t("admin.slotDuration")}
          <select
            value={slotDuration}
            onChange={(e) => onChangeSlotDuration(Number(e.target.value))}
            className="min-h-11 rounded-lg bg-zinc-800 px-3"
          >
            {ALLOWED_SLOT_DURATIONS.map((m) => (
              <option key={m} value={m}>
                {m} {t("common.minutes")}
              </option>
            ))}
          </select>
        </label>
        {formMessage ? <p className="mt-2 text-sm text-emerald-400">{formMessage}</p> : null}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={saving || !name.trim()}
            onClick={onSave}
            className="min-h-11 flex-1 rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
          >
            {t("admin.saveBarber")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-zinc-700 px-4 text-sm text-zinc-300"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
