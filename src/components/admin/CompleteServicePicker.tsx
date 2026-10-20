"use client";

import { useEffect, useState } from "react";
import {
  activeShopServices,
  closeQueueConfirmLabel,
  defaultActiveService,
  formatServicePriceBaht,
} from "@/lib/admin/complete-service-picker";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { ShopService } from "@/types/booking";

export interface CompleteServiceChoice {
  serviceId: string;
  priceBaht: number;
  serviceName: string;
}

interface CompleteServicePickerProps {
  open: boolean;
  services: ShopService[];
  /** Preselect this service (e.g. when editing a completed booking). */
  initialServiceId?: string | null;
  pending?: boolean;
  /** complete = first mark done; change = edit after complete */
  mode?: "complete" | "change";
  customerLabel?: string | null;
  onClose: () => void;
  onConfirm: (choice: CompleteServiceChoice) => void;
}

export function CompleteServicePicker({
  open,
  services,
  initialServiceId = null,
  pending = false,
  mode = "complete",
  customerLabel = null,
  onClose,
  onConfirm,
}: CompleteServicePickerProps) {
  const { t } = useI18n();
  const active = activeShopServices(services);
  const fallback = defaultActiveService(services);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const preferred =
      (initialServiceId && active.find((s) => s.id === initialServiceId)?.id) ||
      fallback?.id ||
      null;
    setSelectedId(preferred);
  }, [open, initialServiceId, fallback?.id, active]);

  if (!open) return null;

  const selected = active.find((s) => s.id === selectedId) ?? fallback;
  const title =
    mode === "change" ? t("admin.changeServiceTitle") : t("admin.pickServiceTitle");
  const confirmTemplate =
    mode === "change" ? t("admin.saveServicePrice") : t("admin.closeQueueConfirm");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label={t("common.cancel")}
        className="absolute inset-0"
        onClick={onClose}
        disabled={pending}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-service-picker-title"
        data-testid="complete-service-picker"
        className="relative z-10 flex max-h-[min(90vh,40rem)] w-full max-w-md flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 shadow-xl sm:rounded-2xl"
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-zinc-700 sm:hidden" />
        <header className="shrink-0 border-b border-zinc-800 px-4 py-3">
          <h2
            id="complete-service-picker-title"
            className="text-base font-semibold text-zinc-50"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-zinc-300">
            {customerLabel
              ? t("admin.pickServiceSubtitleNamed").replace("{name}", customerLabel)
              : t("admin.pickServiceSubtitle")}
          </p>
        </header>

        <ul
          className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3"
          role="listbox"
          aria-label={title}
        >
          {active.map((service) => {
            const selectedRow = selected?.id === service.id;
            return (
              <li key={service.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedRow}
                  disabled={pending}
                  onClick={() => setSelectedId(service.id)}
                  className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition disabled:opacity-50 ${
                    selectedRow
                      ? "border-amber-400 bg-amber-400/15 text-zinc-50"
                      : "border-zinc-700 bg-zinc-900 text-zinc-100"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">
                    {service.name}
                    {service.is_default ? (
                      <span className="ml-2 text-xs font-medium text-zinc-400">
                        {t("admin.servicesDefault")}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-base font-semibold tabular-nums text-amber-200">
                    {formatServicePriceBaht(service.price_baht)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="shrink-0 space-y-2 border-t border-zinc-800 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-3">
          <button
            type="button"
            disabled={pending || !selected}
            data-testid="complete-service-confirm"
            onClick={() => {
              if (!selected) return;
              onConfirm({
                serviceId: selected.id,
                priceBaht: selected.price_baht,
                serviceName: selected.name,
              });
            }}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-amber-400 text-base font-semibold text-zinc-950 disabled:opacity-50"
          >
            {selected
              ? closeQueueConfirmLabel(confirmTemplate, selected.price_baht)
              : t("common.save")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="flex min-h-11 w-full items-center justify-center rounded-xl text-sm font-medium text-zinc-300 disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
