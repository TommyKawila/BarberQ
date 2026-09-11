import { useState } from "react";
import { TRIAL_LEAD_STATUSES, type TrialLead, type TrialLeadStatus } from "@/lib/marketing/trial-leads";
import { useI18n } from "@/lib/i18n/locale-provider";
import { uniqueNonEmpty, type TrialCrmSort } from "@/lib/superadmin/trial-crm/filters";
import { TRIAL_CRM_STATUS_KEYS } from "@/lib/superadmin/trial-crm/status";

export function TrialLeadToolbar({
  leads,
  q,
  status,
  source,
  campaign,
  province,
  sort,
  onChange,
}: {
  leads: TrialLead[];
  q: string;
  status: TrialLeadStatus | null;
  source: string | null;
  campaign: string | null;
  province: string | null;
  sort: TrialCrmSort;
  onChange: (patch: {
    q?: string | null;
    status?: TrialLeadStatus | null;
    source?: string | null;
    campaign?: string | null;
    province?: string | null;
    sort?: TrialCrmSort | null;
  }) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const sources = uniqueNonEmpty(leads.map((l) => l.utm_source));
  const campaigns = uniqueNonEmpty(leads.map((l) => l.utm_campaign));
  const provinces = uniqueNonEmpty(leads.map((l) => l.province));

  const secondary = (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-400">
        <span className="sr-only sm:not-sr-only">{t("superadmin.crm.source")}</span>
        <select
          value={source ?? ""}
          onChange={(e) => onChange({ source: e.target.value || null })}
          className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
        >
          <option value="">{t("superadmin.crm.anySource")}</option>
          {sources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-400">
        <span className="sr-only sm:not-sr-only">{t("superadmin.crm.campaign")}</span>
        <select
          value={campaign ?? ""}
          onChange={(e) => onChange({ campaign: e.target.value || null })}
          className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
        >
          <option value="">{t("superadmin.crm.anyCampaign")}</option>
          {campaigns.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-400">
        <span className="sr-only sm:not-sr-only">{t("superadmin.crm.province")}</span>
        <select
          value={province ?? ""}
          onChange={(e) => onChange({ province: e.target.value || null })}
          className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
        >
          <option value="">{t("superadmin.crm.anyProvince")}</option>
          {provinces.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <label className="block min-w-0 flex-1">
          <span className="sr-only">{t("superadmin.crm.searchLabel")}</span>
          <input
            value={q}
            onChange={(e) => onChange({ q: e.target.value || null })}
            placeholder={t("superadmin.crm.search")}
            className="min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm outline-none focus:border-amber-500"
          />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-400">
          <span>{t("superadmin.crm.sortLabel")}</span>
          <select
            value={sort}
            onChange={(e) => onChange({ sort: e.target.value as TrialCrmSort })}
            className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200"
          >
            <option value="newest">{t("superadmin.crm.sort.newest")}</option>
            <option value="oldest">{t("superadmin.crm.sort.oldest")}</option>
            <option value="followup">{t("superadmin.crm.sort.followup")}</option>
            <option value="barbers">{t("superadmin.crm.sort.barbers")}</option>
          </select>
        </label>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300 lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {t("superadmin.crm.filters")}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={!status}
          onClick={() => onChange({ status: null })}
          label={t("superadmin.crm.all")}
        />
        {TRIAL_LEAD_STATUSES.map((s) => (
          <FilterChip
            key={s}
            active={status === s}
            onClick={() => onChange({ status: s })}
            label={t(TRIAL_CRM_STATUS_KEYS[s])}
          />
        ))}
      </div>
      <div className="hidden lg:block">{secondary}</div>
      {open ? <div className="lg:hidden">{secondary}</div> : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 rounded-full px-3 text-sm font-medium ${
        active ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
      }`}
    >
      {label}
    </button>
  );
}
