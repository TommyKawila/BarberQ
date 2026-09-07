"use client";

import { useI18n } from "@/lib/i18n/locale-provider";
import { formatSlotTime } from "@/lib/services/slot-service";
import { barberLabel, type AdminColumn, type AdminSlot } from "@/types/booking";

interface QuickBlockGridProps {
  columns: AdminColumn[];
  pendingKey: string | null;
  outcomePendingKey?: string | null;
  latePendingKey?: string | null;
  editableBarberId?: string | null;
  onToggle: (barberId: string, slot: AdminSlot) => void;
  onOutcome?: (barberId: string, slot: AdminSlot, outcome: "completed" | "no_show") => void;
  onLateCalled?: (barberId: string, slot: AdminSlot) => void;
}

function slotClass(slot: AdminSlot, pending: boolean): string {
  if (pending) return "bg-amber-300 text-zinc-950";
  if (!slot.available && slot.kind === "free") {
    return "bg-zinc-900 text-zinc-600";
  }
  if (slot.kind === "booked") {
    if (slot.status === "completed") return "bg-green-600 text-white";
    if (slot.status === "no_show") return "bg-orange-700 text-white";
    if (slot.isLate) return "bg-yellow-500 text-zinc-950";
    return "bg-sky-700 text-white";
  }
  if (slot.kind === "blocked") return "bg-red-600 text-white";
  return "bg-emerald-700 text-white";
}

function canMarkOutcome(slot: AdminSlot, now: number): boolean {
  return (
    slot.kind === "booked" &&
    slot.status === "confirmed" &&
    new Date(slot.endTime).getTime() <= now &&
    Boolean(slot.appointmentId)
  );
}

export function QuickBlockGrid({
  columns,
  pendingKey,
  outcomePendingKey = null,
  latePendingKey = null,
  editableBarberId = null,
  onToggle,
  onOutcome,
  onLateCalled,
}: QuickBlockGridProps) {
  const { locale, t } = useI18n();
  const now = Date.now();

  return (
    <div className="grid grid-cols-3 gap-2">
      {columns.map((column) => {
        const canEdit =
          editableBarberId === null || column.barber.id === editableBarberId;
        return (
        <div key={column.barber.id} className="flex flex-col gap-2">
          <div className="rounded-lg bg-zinc-900 px-1 py-2 text-center">
            <div className="text-sm font-semibold">
              {barberLabel(column.barber.name, locale)}
            </div>
            <div className="text-[10px] text-zinc-400">
              {column.barber.slot_duration_minutes} {t("common.minutes")}
            </div>
          </div>
          {column.slots.length === 0 ? (
            <p className="px-1 text-center text-xs text-zinc-500">{t("admin.off")}</p>
          ) : (
            column.slots.map((slot) => {
              const key = `${column.barber.id}:${slot.startTime}`;
              const pending = pendingKey === key;
              const outcomePending = outcomePendingKey === key;
              const latePending = latePendingKey === key;
              const pastFree = slot.kind === "free" && !slot.available;
              const booked = slot.kind === "booked";
              const locked = slot.kind === "blocked" && slot.reason === "break";
              const markable = canMarkOutcome(slot, now) && canEdit && onOutcome;
              const lateConfirmed =
                booked && slot.status === "confirmed" && Boolean(slot.isLate) && canEdit;
              const label =
                slot.kind === "booked"
                  ? slot.status === "completed"
                    ? `${slot.customerName} · ${t("admin.completed")}`
                    : slot.status === "no_show"
                      ? `${slot.customerName} · ${t("admin.noShow")}`
                      : slot.isLate
                        ? `${slot.customerName} · ${slot.lateCalledAt ? t("admin.called") : t("admin.late")}`
                        : slot.customerName
                  : slot.kind === "blocked"
                    ? slot.reason === "break"
                      ? t("admin.break")
                      : slot.reason || t("admin.walkIn")
                    : t("admin.free");

              if (markable || lateConfirmed) {
                return (
                  <div
                    key={slot.startTime}
                    className={`min-h-14 rounded-lg px-1.5 py-2 text-left ${slotClass(slot, outcomePending || latePending)}`}
                  >
                    <div className="text-xs font-bold">{formatSlotTime(slot.startTime)}</div>
                    <div className="truncate text-[11px] font-medium leading-tight">{slot.customerName}</div>
                    {slot.customerPhone ? (
                      <a
                        href={`tel:${slot.customerPhone}`}
                        className="mt-0.5 block truncate text-[10px] font-semibold underline"
                      >
                        {slot.customerPhone}
                      </a>
                    ) : null}
                    <div className="mt-1.5 flex flex-col gap-1">
                      {lateConfirmed ? (
                        slot.lateCalledAt ? (
                          <div className="rounded bg-zinc-950/40 px-1.5 py-1 text-center text-[9px] font-semibold">
                            ✓ {t("admin.called")}
                          </div>
                        ) : onLateCalled ? (
                          <button
                            type="button"
                            disabled={latePending}
                            onClick={() => onLateCalled(column.barber.id, slot)}
                            className="rounded bg-zinc-950/50 px-1.5 py-1 text-[9px] font-semibold hover:bg-zinc-950/70 disabled:opacity-50"
                          >
                            📞 {t("admin.markCalled")}
                          </button>
                        ) : null
                      ) : null}
                      {markable ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={outcomePending}
                            onClick={() => onOutcome(column.barber.id, slot, "completed")}
                            className="flex-1 rounded bg-zinc-950/50 px-1.5 py-1 text-[9px] font-semibold hover:bg-zinc-950/70 disabled:opacity-50"
                          >
                            ✓ {t("admin.markDone")}
                          </button>
                          <button
                            type="button"
                            disabled={outcomePending}
                            onClick={() => onOutcome(column.barber.id, slot, "no_show")}
                            className="flex-1 rounded bg-zinc-950/50 px-1.5 py-1 text-[9px] font-semibold hover:bg-zinc-950/70 disabled:opacity-50"
                          >
                            ✗ {t("admin.markNoShow")}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={slot.startTime}
                  type="button"
                  disabled={pending || booked || pastFree || locked || !canEdit}
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
        );
      })}
    </div>
  );
}
