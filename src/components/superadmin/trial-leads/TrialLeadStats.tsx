import type { TrialLeadStats } from "@/lib/superadmin/trial-crm/filters";
import { useI18n } from "@/lib/i18n/locale-provider";

export function TrialLeadStats({ stats }: { stats: TrialLeadStats }) {
  const { t } = useI18n();
  const all = [
    { key: "new", label: t("superadmin.crm.kpi.new"), value: stats.newCount },
    { key: "follow", label: t("superadmin.crm.kpi.followUp"), value: stats.followUpToday },
    { key: "contacted", label: t("superadmin.crm.kpi.contacted"), value: stats.contacted },
    { key: "converted", label: t("superadmin.crm.kpi.converted"), value: stats.converted },
    { key: "closed", label: t("superadmin.crm.kpi.closed"), value: stats.closed },
  ];

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
      {all.map((item) => (
        <div
          key={item.key}
          className={`min-w-[140px] shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-3 lg:min-w-0 ${
            item.key === "new" || item.key === "follow" || item.key === "converted"
              ? ""
              : "hidden lg:block"
          }`}
        >
          <p className="text-xs text-zinc-500">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-50">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
