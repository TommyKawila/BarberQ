"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/locale-provider";
import { formatSlotTime } from "@/lib/services/slot-service";
import type { AdminSlot, StaffBookingSource } from "@/types/booking";

export type StaffSheetMode = "pick" | "form" | "shorten" | "block";

interface StaffBookingSheetProps {
  open: boolean;
  barberId: string;
  barberName: string;
  slot: AdminSlot;
  pending: boolean;
  shortenUntil?: string | null;
  onClose: () => void;
  onWalkInNow: () => void;
  onStaffBooking: (input: {
    source: StaffBookingSource;
    customerName: string;
    customerPhone: string;
    endTime?: string;
  }) => void;
  onBlock: () => void;
}

export function StaffBookingSheet({
  open,
  barberName,
  slot,
  pending,
  shortenUntil = null,
  onClose,
  onWalkInNow,
  onStaffBooking,
  onBlock,
}: StaffBookingSheetProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<StaffSheetMode>("pick");
  const [formSource, setFormSource] = useState<Exclude<StaffBookingSource, "walk_in">>("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!open) return;
    setMode(shortenUntil ? "shorten" : "pick");
    setName("");
    setPhone("");
  }, [open, slot.startTime, shortenUntil]);

  if (!open) return null;

  function submitForm() {
    onStaffBooking({
      source: formSource,
      customerName: name,
      customerPhone: phone,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label={t("common.cancel")}
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-zinc-950 px-4 pb-8 pt-4 shadow-xl sm:rounded-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700 sm:hidden" />
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-zinc-50">{t("admin.staffBook.title")}</h2>
            <p className="text-xs text-zinc-400">
              {barberName} · {formatSlotTime(slot.startTime)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-900"
          >
            ✕
          </button>
        </div>

        {mode === "pick" ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={onWalkInNow}
              className="flex min-h-12 items-center justify-center rounded-xl bg-rose-600 text-sm font-semibold text-white disabled:opacity-50"
            >
              🚶 {t("admin.staffBook.walkInNow")}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setFormSource("phone");
                  setMode("form");
                }}
                className="flex min-h-12 items-center justify-center rounded-xl bg-teal-700 text-sm font-semibold text-white disabled:opacity-50"
              >
                📞 {t("admin.staffBook.phone")}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setFormSource("chat");
                  setMode("form");
                }}
                className="flex min-h-12 items-center justify-center rounded-xl bg-indigo-700 text-sm font-semibold text-white disabled:opacity-50"
              >
                💬 {t("admin.staffBook.chat")}
              </button>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={onBlock}
              className="flex min-h-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-medium text-zinc-200 disabled:opacity-50"
            >
              {t("admin.staffBook.blockTime")}
            </button>
          </div>
        ) : null}

        {mode === "form" ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-zinc-400">
              {formSource === "phone" ? t("admin.staffBook.phoneHint") : t("admin.staffBook.chatHint")}
            </p>
            <label className="flex flex-col gap-1 text-sm text-zinc-300">
              {t("admin.staffBook.name")}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-zinc-50"
                autoFocus
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-300">
              {t("admin.staffBook.phoneOptional")}
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-zinc-50"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("pick")}
                className="min-h-12 flex-1 rounded-xl bg-zinc-800 text-sm text-zinc-200"
              >
                {t("common.back")}
              </button>
              <button
                type="button"
                disabled={pending || !name.trim()}
                onClick={submitForm}
                className="min-h-12 flex-1 rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950 disabled:opacity-50"
              >
                {t("admin.staffBook.confirm")}
              </button>
            </div>
          </div>
        ) : null}

        {mode === "shorten" && shortenUntil ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-amber-200">
              {t("admin.staffBook.shortenHint").replace(
                "{time}",
                formatSlotTime(shortenUntil),
              )}
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                onStaffBooking({
                  source: "walk_in",
                  customerName: "",
                  customerPhone: "",
                  endTime: shortenUntil,
                })
              }
              className="flex min-h-12 items-center justify-center rounded-xl bg-rose-600 text-sm font-semibold text-white disabled:opacity-50"
            >
              ⏱ {t("admin.staffBook.shortenConfirm")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 rounded-xl bg-zinc-800 text-sm text-zinc-200"
            >
              {t("common.cancel")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
