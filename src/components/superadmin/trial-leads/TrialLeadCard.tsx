import type { TrialLead } from "@/lib/marketing/trial-leads";
import { useI18n } from "@/lib/i18n/locale-provider";
import { formatLeadDateTime } from "@/lib/superadmin/trial-crm/format";
import { TrialLeadStatusBadge } from "./TrialLeadStatusBadge";

export function TrialLeadCard({
  lead,
  selected,
  onSelect,
}: {
  lead: TrialLead;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t, locale } = useI18n();
  const barbers =
    lead.barber_count != null
      ? t("superadmin.crm.barbers").replace("{n}", String(lead.barber_count))
      : "—";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={`w-full min-h-11 rounded-xl border px-3 py-3 text-left transition ${
        selected
          ? "border-amber-400 bg-zinc-800 ring-1 ring-amber-400/40"
          : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-600"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 break-words font-semibold text-zinc-100">{lead.shop_name}</p>
        <TrialLeadStatusBadge status={lead.status} />
      </div>
      <p className="mt-1 break-words text-sm text-zinc-300">
        {lead.contact_name} · {lead.contact_value}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        {lead.province || "—"} · {barbers}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {lead.utm_source ? (
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
            {lead.utm_source}
          </span>
        ) : null}
        <span className="text-[11px] text-zinc-500">
          {formatLeadDateTime(lead.created_at, locale)}
        </span>
      </div>
    </button>
  );
}
