import type { TrialLeadStatus } from "@/lib/marketing/trial-leads";
import { useI18n } from "@/lib/i18n/locale-provider";
import { TRIAL_CRM_STATUS_KEYS } from "@/lib/superadmin/trial-crm/status";

const STYLES: Record<TrialLeadStatus, string> = {
  NEW: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  CONTACTED: "border-sky-500/40 bg-sky-500/15 text-sky-300",
  CONVERTED: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  CLOSED: "border-zinc-600 bg-zinc-800 text-zinc-400",
};

export function TrialLeadStatusBadge({ status }: { status: TrialLeadStatus }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STYLES[status]}`}
    >
      {t(TRIAL_CRM_STATUS_KEYS[status])}
    </span>
  );
}
