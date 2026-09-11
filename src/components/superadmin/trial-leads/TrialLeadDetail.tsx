"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  TRIAL_LEAD_STATUSES,
  type TrialLead,
  type TrialLeadNote,
  type TrialLeadStatus,
} from "@/lib/marketing/trial-leads";
import { useI18n } from "@/lib/i18n/locale-provider";
import { lineUrl, telHref } from "@/lib/superadmin/trial-crm/contact";
import {
  followUpState,
  localFollowUpIso,
} from "@/lib/superadmin/trial-crm/follow-up";
import { displayOrDash, formatLeadDateTime } from "@/lib/superadmin/trial-crm/format";
import { TRIAL_CRM_STATUS_KEYS } from "@/lib/superadmin/trial-crm/status";
import { TrialLeadStatusBadge } from "./TrialLeadStatusBadge";

export function TrialLeadDetail({
  lead,
  notes,
  notesLoading,
  pending,
  error,
  onStatus,
  onFollowUp,
  onNote,
  onBack,
  showBack,
}: {
  lead: TrialLead;
  notes: TrialLeadNote[];
  notesLoading: boolean;
  pending: "status" | "followUp" | "note" | null;
  error: string | null;
  onStatus: (status: TrialLeadStatus) => void;
  onFollowUp: (iso: string | null) => void;
  onNote: (body: string) => Promise<boolean>;
  onBack: () => void;
  showBack: boolean;
}) {
  const { t, locale } = useI18n();

  return (
    <div className="space-y-4">
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          className="min-h-11 text-sm font-medium text-amber-400"
        >
          {t("superadmin.crm.back")}
        </button>
      ) : null}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="break-words text-xl font-semibold">{lead.shop_name}</h2>
            <p className="mt-1 break-words text-sm text-zinc-300">
              {lead.contact_name} · {lead.contact_value}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {displayOrDash(lead.province)} ·{" "}
              {lead.barber_count != null
                ? t("superadmin.crm.barbers").replace("{n}", String(lead.barber_count))
                : "—"}{" "}
              · {formatLeadDateTime(lead.created_at, locale)}
            </p>
          </div>
          <div className="flex flex-col gap-2 lg:items-end">
            <TrialLeadStatusBadge status={lead.status} />
            <label className="text-sm text-zinc-400">
              <select
                value={lead.status}
                disabled={pending === "status"}
                onChange={(e) => onStatus(e.target.value as TrialLeadStatus)}
                className="mt-1 min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
              >
                {TRIAL_LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(TRIAL_CRM_STATUS_KEYS[s])}
                  </option>
                ))}
              </select>
            </label>
            {pending === "status" ? (
              <p className="text-xs text-zinc-500">{t("superadmin.crm.saving")}</p>
            ) : null}
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        <LeadContactActions value={lead.contact_value} />
      </section>

      <div className="flex flex-col gap-4">
        <div className="order-2 grid gap-4 lg:order-none lg:grid-cols-2">
          <LeadSummaryCard lead={lead} />
          <LeadAcquisitionCard lead={lead} />
        </div>
        <div className="order-1 lg:order-none">
          <LeadFollowUpCard
            lead={lead}
            pending={pending === "followUp"}
            onFollowUp={onFollowUp}
          />
        </div>
        <div className="order-3 lg:order-none">
          <LeadNotes
            notes={notes}
            loading={notesLoading}
            pending={pending === "note"}
            onNote={onNote}
          />
        </div>
      </div>
    </div>
  );
}

function LeadContactActions({ value }: { value: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const phone = telHref(value);
  const line = lineUrl(value);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void copy()}
        className="min-h-11 rounded-lg border border-zinc-700 px-3 text-sm font-medium text-zinc-200"
      >
        {copied ? t("superadmin.crm.copied") : t("superadmin.crm.copyContact")}
      </button>
      {phone ? (
        <a
          href={phone}
          className="inline-flex min-h-11 items-center rounded-lg border border-zinc-700 px-3 text-sm font-medium text-zinc-200"
        >
          {t("superadmin.crm.call")}
        </a>
      ) : null}
      {line ? (
        <a
          href={line}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-lg border border-zinc-700 px-3 text-sm font-medium text-zinc-200"
        >
          {t("superadmin.crm.openLine")}
        </a>
      ) : null}
    </div>
  );
}

function LeadSummaryCard({ lead }: { lead: TrialLead }) {
  const { t, locale } = useI18n();
  const rows = [
    [t("superadmin.crm.shop"), lead.shop_name],
    [t("superadmin.crm.contactName"), lead.contact_name],
    [t("superadmin.crm.contactValue"), lead.contact_value],
    [t("superadmin.crm.province"), displayOrDash(lead.province)],
    [
      t("superadmin.crm.barbers").replace("{n}", "").trim(),
      lead.barber_count != null ? String(lead.barber_count) : "—",
    ],
    [t("superadmin.crm.locale"), displayOrDash(lead.locale)],
    [t("superadmin.crm.created"), formatLeadDateTime(lead.created_at, locale)],
    [t("superadmin.crm.updated"), formatLeadDateTime(lead.updated_at, locale)],
  ];
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">{t("superadmin.crm.summary")}</h3>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[8rem_1fr] gap-2">
            <dt className="text-zinc-500">{k}</dt>
            <dd className="break-words text-zinc-200">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function LeadAcquisitionCard({ lead }: { lead: TrialLead }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const rows = [
    [t("superadmin.crm.source"), displayOrDash(lead.utm_source)],
    [t("superadmin.crm.medium"), displayOrDash(lead.utm_medium)],
    [t("superadmin.crm.campaign"), displayOrDash(lead.utm_campaign)],
    [t("superadmin.crm.locale"), displayOrDash(lead.locale)],
  ];

  async function copyRef() {
    if (!lead.referrer) return;
    try {
      await navigator.clipboard.writeText(lead.referrer);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">{t("superadmin.crm.acquisition")}</h3>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[8rem_1fr] gap-2">
            <dt className="text-zinc-500">{k}</dt>
            <dd className="break-all font-mono text-xs text-zinc-200">{v}</dd>
          </div>
        ))}
        <div className="grid grid-cols-[8rem_1fr] gap-2">
          <dt className="text-zinc-500">{t("superadmin.crm.referrer")}</dt>
          <dd className="min-w-0">
            <p className="break-all font-mono text-xs text-zinc-200">
              {displayOrDash(lead.referrer)}
            </p>
            {lead.referrer ? (
              <button
                type="button"
                onClick={() => void copyRef()}
                className="mt-1 min-h-11 text-xs text-amber-400"
              >
                {copied ? t("superadmin.crm.copied") : t("superadmin.crm.copyReferrer")}
              </button>
            ) : null}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function LeadFollowUpCard({
  lead,
  pending,
  onFollowUp,
}: {
  lead: TrialLead;
  pending: boolean;
  onFollowUp: (iso: string | null) => void;
}) {
  const { t, locale } = useI18n();
  const state = followUpState(lead.follow_up_at);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");

  useEffect(() => {
    if (!lead.follow_up_at) {
      setDate("");
      setTime("10:00");
      return;
    }
    const d = new Date(lead.follow_up_at);
    setDate(format(d, "yyyy-MM-dd"));
    setTime(format(d, "HH:mm"));
  }, [lead.follow_up_at, lead.id]);

  function applyCustom() {
    if (!date) return;
    const [h, m] = time.split(":").map(Number);
    const d = new Date(`${date}T00:00:00`);
    d.setHours(h || 10, m || 0, 0, 0);
    onFollowUp(d.toISOString());
  }

  const statusText =
    state === "none"
      ? t("superadmin.crm.followUpNone")
      : state === "today"
        ? t("superadmin.crm.followUpToday")
        : state === "overdue"
          ? t("superadmin.crm.followUpOverdue")
          : `${t("superadmin.crm.followUpPrefix")} ${formatLeadDateTime(lead.follow_up_at!, locale)}`;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">{t("superadmin.crm.followUp")}</h3>
      <p
        className={`mt-2 text-sm ${
          state === "overdue" ? "font-semibold text-amber-300" : "text-zinc-300"
        }`}
      >
        {statusText}
        {state === "overdue" ? ` · ${formatLeadDateTime(lead.follow_up_at!, locale)}` : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => onFollowUp(localFollowUpIso(0))} className="min-h-11 rounded-lg border border-zinc-700 px-3 text-sm">
          {t("superadmin.crm.followUpToday")}
        </button>
        <button type="button" disabled={pending} onClick={() => onFollowUp(localFollowUpIso(1))} className="min-h-11 rounded-lg border border-zinc-700 px-3 text-sm">
          {t("superadmin.crm.followUpTomorrow")}
        </button>
        <button type="button" disabled={pending} onClick={() => onFollowUp(localFollowUpIso(3))} className="min-h-11 rounded-lg border border-zinc-700 px-3 text-sm">
          {t("superadmin.crm.followUpIn3")}
        </button>
        <button type="button" disabled={pending} onClick={() => onFollowUp(null)} className="min-h-11 rounded-lg border border-zinc-700 px-3 text-sm">
          {t("superadmin.crm.followUpClear")}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-xs text-zinc-500">
          {t("superadmin.crm.followUpDate")}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm"
          />
        </label>
        <label className="text-xs text-zinc-500">
          {t("superadmin.crm.followUpTime")}
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 block min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={pending || !date}
          onClick={applyCustom}
          className="min-h-11 rounded-lg bg-zinc-800 px-3 text-sm"
        >
          {pending ? t("superadmin.crm.saving") : t("superadmin.crm.followUpSave")}
        </button>
      </div>
    </section>
  );
}

function LeadNotes({
  notes,
  loading,
  pending,
  onNote,
}: {
  notes: TrialLeadNote[];
  loading: boolean;
  pending: boolean;
  onNote: (body: string) => Promise<boolean>;
}) {
  const { t, locale } = useI18n();
  const [body, setBody] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function submit() {
    setLocalError(null);
    const ok = await onNote(body);
    if (ok) setBody("");
    else setLocalError(t("superadmin.crm.noteError"));
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">{t("superadmin.crm.notes")}</h3>
      <label className="mt-3 block">
        <span className="sr-only">{t("superadmin.crm.notes")}</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("superadmin.crm.notePlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-amber-500"
        />
      </label>
      {localError ? <p className="mt-2 text-sm text-red-400">{localError}</p> : null}
      <button
        type="button"
        disabled={pending || !body.trim()}
        onClick={() => void submit()}
        className="mt-2 min-h-11 rounded-lg bg-amber-400 px-4 text-sm font-semibold text-zinc-950 disabled:opacity-50"
      >
        {pending ? t("superadmin.crm.noteSaving") : t("superadmin.crm.noteSubmit")}
      </button>
      <ul className="mt-4 space-y-3">
        {loading ? <li className="text-sm text-zinc-500">{t("superadmin.crm.saving")}</li> : null}
        {notes.map((note) => (
          <li key={note.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
            <p className="whitespace-pre-wrap break-words text-sm text-zinc-200">{note.body}</p>
            <p className="mt-1 text-[11px] text-zinc-500">
              {formatLeadDateTime(note.created_at, locale)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
