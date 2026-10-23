"use client";

import { SlotDurationPicker } from "@/components/admin/SlotDurationPicker";
import { useI18n } from "@/lib/i18n/locale-provider";

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        data-testid="add-barber-sheet"
        className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-zinc-700 sm:hidden" />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3">
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
          <div className="mt-3 text-sm">
            <p className="font-medium">{t("admin.slotDuration")}</p>
            <SlotDurationPicker
              value={slotDuration}
              onChange={onChangeSlotDuration}
            />
          </div>
          {formMessage ? (
            <p className="mt-2 text-sm text-emerald-400">{formMessage}</p>
          ) : null}
        </div>
        <div className="shrink-0 border-t border-zinc-800 bg-zinc-950 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="add-barber-save"
              disabled={saving || !name.trim()}
              onClick={onSave}
              className="min-h-12 flex-1 rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
            >
              {t("admin.saveBarber")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 rounded-xl border border-zinc-700 px-4 text-sm text-zinc-300"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
