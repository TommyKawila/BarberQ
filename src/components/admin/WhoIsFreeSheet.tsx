"use client";

import { formatInTimeZone } from "date-fns-tz";
import { useI18n } from "@/lib/i18n/locale-provider";
import { SHOP_TIMEZONE } from "@/lib/services/slot-service";
import { barberLabel } from "@/types/booking";
import type { FreeBarberNow, WhoIsFreeEmptyState } from "@/lib/admin/free-barbers";

interface WhoIsFreeSheetProps {
  open: boolean;
  rows: FreeBarberNow[];
  emptyState?: WhoIsFreeEmptyState | null;
  onClose: () => void;
  onWalkIn: (row: FreeBarberNow) => void;
  onOpenSchedule?: () => void;
}

export function WhoIsFreeSheet({
  open,
  rows,
  emptyState,
  onClose,
  onWalkIn,
  onOpenSchedule,
}: WhoIsFreeSheetProps) {
  const { t, locale } = useI18n();
  if (!open) return null;

  function emptyCopy(): { body: string; showSchedule: boolean } {
    if (emptyState?.kind === "closed") {
      const when = emptyState.nextOpenLabel ?? "—";
      return {
        body: t("admin.whoIsFreeShopClosed").replace("{time}", when),
        showSchedule: true,
      };
    }
    if (emptyState?.kind === "busy" && emptyState.nextFreeLabel) {
      return {
        body: t("admin.whoIsFreeAllBusy").replace("{time}", emptyState.nextFreeLabel),
        showSchedule: true,
      };
    }
    return { body: t("admin.whoIsFreeEmpty"), showSchedule: Boolean(onOpenSchedule) };
  }

  const empty = emptyCopy();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-zinc-950 p-4 pb-8 sm:rounded-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700" />
        <h2 className="font-heading text-base font-semibold">{t("admin.whoIsFreeSheetTitle")}</h2>
        {rows.length === 0 ? (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-sm text-zinc-400">{empty.body}</p>
            {empty.showSchedule && onOpenSchedule ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSchedule();
                }}
                className="min-h-11 w-full rounded-xl border border-zinc-600 text-sm font-medium text-zinc-100"
              >
                {t("admin.whoIsFreeOpenSchedule")}
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {rows.map((row) => {
              const until = formatInTimeZone(new Date(row.freeUntil), SHOP_TIMEZONE, "HH:mm");
              return (
                <li
                  key={row.barberId}
                  className="flex items-center justify-between gap-3 rounded-xl bg-zinc-900 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{barberLabel(row.barberName, locale)}</p>
                    <p className="text-[11px] text-zinc-400">
                      {t("admin.whoIsFreeUntil").replace("{time}", until)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onWalkIn(row)}
                    className="cq-press min-h-11 shrink-0 rounded-xl bg-amber-400 px-3 text-[11px] font-semibold text-zinc-950 sm:text-sm"
                  >
                    {t("admin.whoIsFreeWalkIn")}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 min-h-11 w-full rounded-xl border border-zinc-700 text-sm text-zinc-300"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
