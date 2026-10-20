"use client";

import { blockConfirmSummary } from "@/lib/admin/block-time";
import { useI18n } from "@/lib/i18n/locale-provider";

interface UnblockConfirmSheetProps {
  open: boolean;
  barberName: string;
  startTime: string;
  endTime: string;
  pending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function UnblockConfirmSheet({
  open,
  barberName,
  startTime,
  endTime,
  pending = false,
  onClose,
  onConfirm,
}: UnblockConfirmSheetProps) {
  const { t } = useI18n();
  if (!open) return null;

  const summary = blockConfirmSummary(
    t("admin.unblockConfirm"),
    barberName,
    startTime,
    endTime,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label={t("common.cancel")}
        className="absolute inset-0"
        disabled={pending}
        onClick={() => {
          if (!pending) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        data-testid="unblock-confirm-sheet"
        className="relative z-10 w-full max-w-md rounded-t-2xl border border-zinc-800 bg-zinc-950 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700 sm:hidden" />
        <h2 className="text-base font-semibold text-zinc-50">{t("admin.unblockTitle")}</h2>
        <p className="mt-2 text-sm text-zinc-300">{summary}</p>
        <p className="mt-1 text-xs text-zinc-500">{t("admin.unblockWholeHint")}</p>
        <button
          type="button"
          disabled={pending}
          data-testid="unblock-confirm"
          aria-busy={pending || undefined}
          onClick={onConfirm}
          className="cq-press mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? (
            <>
              <span className="cq-btn-spinner" aria-hidden />
              {t("admin.unblockPending")}
            </>
          ) : (
            t("admin.unblockAction")
          )}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onClose}
          className="cq-press mt-2 flex min-h-11 w-full items-center justify-center rounded-xl text-sm font-medium text-zinc-300 disabled:opacity-50"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
