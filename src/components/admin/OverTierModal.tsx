"use client";

import type { OverTierPromptCopy } from "@/lib/billing/barber-tier";

interface OverTierModalProps {
  open: boolean;
  copy: OverTierPromptCopy | null;
  supportLineUrl?: string | null;
  onContinue: () => void;
  onClose: () => void;
}

/**
 * Soft over-tier prompt after adding seat #3 / #6 / #11.
 * Never blocks — primary continues; secondary opens Tommy LINE.
 */
export function OverTierModal({
  open,
  copy,
  supportLineUrl,
  onContinue,
  onClose,
}: OverTierModalProps) {
  if (!open || !copy) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="ปิด"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        data-testid="over-tier-modal"
        className="relative z-10 w-full max-w-md rounded-t-2xl border border-zinc-800 bg-zinc-950 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700 sm:hidden" />
        <h2 className="text-base font-semibold text-zinc-50">{copy.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{copy.body}</p>
        <p className="mt-2 text-xs text-zinc-500">{copy.footnote}</p>
        <button
          type="button"
          data-testid="over-tier-continue"
          onClick={onContinue}
          className="cq-press mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950"
        >
          {copy.primaryCta}
        </button>
        {supportLineUrl ? (
          <a
            href={supportLineUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="over-tier-line"
            className="cq-press mt-2 flex min-h-11 w-full items-center justify-center rounded-xl border border-zinc-600 text-sm font-medium text-zinc-200"
          >
            {copy.secondaryCta}
          </a>
        ) : (
          <button
            type="button"
            data-testid="over-tier-line"
            onClick={onClose}
            className="cq-press mt-2 flex min-h-11 w-full items-center justify-center rounded-xl border border-zinc-600 text-sm font-medium text-zinc-200"
          >
            {copy.secondaryCta}
          </button>
        )}
      </div>
    </div>
  );
}
