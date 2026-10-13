"use client";

import { useI18n } from "@/lib/i18n/locale-provider";
import type { Barber } from "@/types/booking";

interface StaffActionsSheetProps {
  barber: Barber | null;
  onClose: () => void;
  onUnlink: () => void;
  onRemove: () => void;
}

export function StaffActionsSheet({ barber, onClose, onUnlink, onRemove }: StaffActionsSheetProps) {
  const { t } = useI18n();
  if (!barber) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-zinc-950 p-4 pb-8 sm:rounded-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700" />
        <h2 className="text-base font-semibold">{barber.name}</h2>
        <div className="mt-3 flex flex-col gap-2">
          {barber.line_id ? (
            <button
              type="button"
              onClick={onUnlink}
              className="min-h-11 rounded-xl bg-zinc-800 text-sm text-zinc-200"
            >
              {t("admin.unlinkLine")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRemove}
            className="min-h-11 rounded-xl bg-red-700/90 text-sm font-medium text-white"
          >
            {t("admin.removeFromShop")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-zinc-700 text-sm text-zinc-300"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
