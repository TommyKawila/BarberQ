import type { TrialLead } from "@/lib/marketing/trial-leads";
import { useI18n } from "@/lib/i18n/locale-provider";
import { TrialLeadCard } from "./TrialLeadCard";

export function TrialLeadList({
  leads,
  selectedId,
  onSelect,
  filteredEmpty,
  onReset,
}: {
  leads: TrialLead[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filteredEmpty: boolean;
  onReset: () => void;
}) {
  const { t } = useI18n();

  if (filteredEmpty) {
    return (
      <div className="rounded-xl border border-zinc-800 px-4 py-10 text-center">
        <p className="font-semibold">{t("superadmin.crm.filteredTitle")}</p>
        <p className="mt-2 text-sm text-zinc-400">{t("superadmin.crm.filteredBody")}</p>
        <button
          type="button"
          onClick={onReset}
          className="mt-4 min-h-11 rounded-lg bg-zinc-800 px-4 text-sm font-medium text-zinc-100"
        >
          {t("superadmin.crm.reset")}
        </button>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {leads.map((lead) => (
        <li key={lead.id}>
          <TrialLeadCard
            lead={lead}
            selected={lead.id === selectedId}
            onSelect={() => onSelect(lead.id)}
          />
        </li>
      ))}
    </ul>
  );
}
