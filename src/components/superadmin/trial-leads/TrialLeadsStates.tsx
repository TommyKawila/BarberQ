import Link from "next/link";
import { useI18n } from "@/lib/i18n/locale-provider";

export function TrialLeadsEmptyState() {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-zinc-800 px-4 py-12 text-center">
      <p className="text-lg font-semibold">{t("superadmin.crm.emptyTitle")}</p>
      <p className="mt-2 text-sm text-zinc-400">{t("superadmin.crm.emptyBody")}</p>
      <Link
        href="/"
        className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-amber-400 underline"
      >
        {t("superadmin.crm.emptyCta")}
      </Link>
    </div>
  );
}

export function TrialLeadsErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-red-900/50 px-4 py-10 text-center">
      <p className="font-semibold">{t("superadmin.crm.loadError")}</p>
      <p className="mt-2 text-sm text-zinc-400">{t("superadmin.crm.loadErrorBody")}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 min-h-11 rounded-lg bg-zinc-800 px-4 text-sm font-medium"
      >
        {t("superadmin.crm.retry")}
      </button>
    </div>
  );
}

export function TrialLeadsDetailPlaceholder() {
  const { t } = useI18n();
  return (
    <div className="hidden rounded-xl border border-dashed border-zinc-800 px-4 py-16 text-center lg:block">
      <p className="font-semibold text-zinc-200">{t("superadmin.crm.selectTitle")}</p>
      <p className="mt-2 text-sm text-zinc-400">{t("superadmin.crm.selectBody")}</p>
    </div>
  );
}

export function TrialLeadNotFound({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-zinc-800 px-4 py-10 text-center">
      <p className="font-semibold">{t("superadmin.crm.notFound")}</p>
      <button
        type="button"
        onClick={onBack}
        className="mt-4 min-h-11 text-sm font-medium text-amber-400"
      >
        {t("superadmin.crm.backToList")}
      </button>
    </div>
  );
}

export function TrialLeadsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="grid gap-2 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-900" />
        ))}
      </div>
      <div className="h-12 animate-pulse rounded-xl bg-zinc-900" />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-900" />
          ))}
        </div>
        <div className="hidden h-96 animate-pulse rounded-xl bg-zinc-900 lg:block" />
      </div>
    </div>
  );
}
