"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { TrialLead, TrialLeadNote, TrialLeadStatus } from "@/lib/marketing/trial-leads";
import { TRIAL_LEAD_STATUSES } from "@/lib/marketing/trial-leads";
import { useI18n } from "@/lib/i18n/locale-provider";
import {
  applyTrialCrmView,
  computeTrialLeadStats,
  type TrialCrmSort,
} from "@/lib/superadmin/trial-crm/filters";
import { TrialLeadDetail } from "./TrialLeadDetail";
import { TrialLeadList } from "./TrialLeadList";
import { TrialLeadStats } from "./TrialLeadStats";
import { TrialLeadToolbar } from "./TrialLeadToolbar";
import {
  TrialLeadNotFound,
  TrialLeadsDetailPlaceholder,
  TrialLeadsEmptyState,
  TrialLeadsErrorState,
  TrialLeadsSkeleton,
} from "./TrialLeadsStates";

function isStatus(value: string | null): value is TrialLeadStatus {
  return Boolean(value && TRIAL_LEAD_STATUSES.includes(value as TrialLeadStatus));
}

function isSort(value: string | null): value is TrialCrmSort {
  return value === "newest" || value === "oldest" || value === "followup" || value === "barbers";
}

export function TrialLeadsCrm({ token }: { token: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<TrialLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notes, setNotes] = useState<TrialLeadNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [pending, setPending] = useState<"status" | "followUp" | "note" | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [isLg, setIsLg] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );

  const q = searchParams.get("q") ?? "";
  const rawStatus = searchParams.get("status");
  const status: TrialLeadStatus | null = isStatus(rawStatus) ? rawStatus : null;
  const source = searchParams.get("source");
  const campaign = searchParams.get("campaign");
  const province = searchParams.get("province");
  const sort: TrialCrmSort = isSort(searchParams.get("sort"))
    ? (searchParams.get("sort") as TrialCrmSort)
    : "newest";
  const leadId = searchParams.get("lead");

  const setParams = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (!value) next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/superadmin/trial-leads", {
        headers: { "x-superadmin-token": token },
      });
      const json = (await res.json()) as { leads?: TrialLead[] };
      if (!res.ok) throw new Error("load");
      setLeads(json.leads ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setIsLg(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const visible = useMemo(
    () =>
      applyTrialCrmView(
        leads,
        { q, status, source, campaign, province },
        sort,
      ),
    [leads, q, status, source, campaign, province, sort],
  );
  const stats = useMemo(() => computeTrialLeadStats(leads), [leads]);
  const selected = leads.find((l) => l.id === leadId) ?? null;

  useEffect(() => {
    if (!isLg || leadId || visible.length === 0) return;
    setParams({ lead: visible[0].id });
  }, [isLg, leadId, visible, setParams]);

  useEffect(() => {
    if (!selected) {
      setNotes([]);
      return;
    }
    let cancelled = false;
    setNotesLoading(true);
    void fetch(`/api/superadmin/trial-leads/${selected.id}/notes`, {
      headers: { "x-superadmin-token": token },
    })
      .then(async (res) => {
        const json = (await res.json()) as { notes?: TrialLeadNote[] };
        if (!cancelled && res.ok) setNotes(json.notes ?? []);
      })
      .finally(() => {
        if (!cancelled) setNotesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected, token]);

  async function patchLead(id: string, body: Record<string, unknown>, kind: "status" | "followUp") {
    const previous = leads.find((l) => l.id === id);
    if (!previous || pending) return;
    setPending(kind);
    setMutationError(null);
    setLeads((rows) =>
      rows.map((row) =>
        row.id === id
          ? {
              ...row,
              status: (body.status as TrialLeadStatus | undefined) ?? row.status,
              follow_up_at:
                body.followUpAt === undefined
                  ? row.follow_up_at
                  : (body.followUpAt as string | null),
              updated_at: new Date().toISOString(),
            }
          : row,
      ),
    );
    try {
      const res = await fetch("/api/superadmin/trial-leads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-superadmin-token": token,
        },
        body: JSON.stringify({ id, ...body }),
      });
      const json = (await res.json()) as { lead?: TrialLead };
      if (!res.ok || !json.lead) throw new Error("fail");
      setLeads((rows) => rows.map((row) => (row.id === id ? json.lead! : row)));
    } catch {
      setLeads((rows) => rows.map((row) => (row.id === id ? previous : row)));
      setMutationError(
        kind === "status" ? t("superadmin.crm.statusError") : t("superadmin.crm.followUpError"),
      );
    } finally {
      setPending(null);
    }
  }

  async function submitNote(body: string): Promise<boolean> {
    if (!selected || pending) return false;
    setPending("note");
    setMutationError(null);
    try {
      const res = await fetch(`/api/superadmin/trial-leads/${selected.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-superadmin-token": token,
        },
        body: JSON.stringify({ body }),
      });
      const json = (await res.json()) as { note?: TrialLeadNote };
      if (!res.ok || !json.note) return false;
      setNotes((rows) => [...rows, json.note!]);
      return true;
    } catch {
      return false;
    } finally {
      setPending(null);
    }
  }

  const mobileDetail = Boolean(leadId) && !isLg;

  if (loading) return <TrialLeadsSkeleton />;
  if (error) return <TrialLeadsErrorState onRetry={() => void load()} />;
  if (leads.length === 0) return <TrialLeadsEmptyState />;

  if (mobileDetail) {
    if (!selected) {
      return <TrialLeadNotFound onBack={() => setParams({ lead: null })} />;
    }
    return (
      <TrialLeadDetail
        lead={selected}
        notes={notes}
        notesLoading={notesLoading}
        pending={pending}
        error={mutationError}
        showBack
        onBack={() => setParams({ lead: null })}
        onStatus={(next) => void patchLead(selected.id, { status: next }, "status")}
        onFollowUp={(iso) => void patchLead(selected.id, { followUpAt: iso }, "followUp")}
        onNote={submitNote}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("superadmin.crm.title")}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t("superadmin.crm.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="min-h-11 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300"
        >
          {t("superadmin.crm.refresh")}
        </button>
      </header>
      <TrialLeadStats stats={stats} />
      <TrialLeadToolbar
        leads={leads}
        q={q}
        status={status}
        source={source}
        campaign={campaign}
        province={province}
        sort={sort}
        onChange={(patch) =>
          setParams({
            q: patch.q === undefined ? q || null : patch.q,
            status: patch.status === undefined ? status : patch.status,
            source: patch.source === undefined ? source : patch.source,
            campaign: patch.campaign === undefined ? campaign : patch.campaign,
            province: patch.province === undefined ? province : patch.province,
            sort: patch.sort === undefined ? sort : patch.sort,
          })
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <TrialLeadList
          leads={visible}
          selectedId={leadId}
          onSelect={(id) => setParams({ lead: id })}
          filteredEmpty={visible.length === 0}
          onReset={() =>
            setParams({
              q: null,
              status: null,
              source: null,
              campaign: null,
              province: null,
              sort: null,
            })
          }
        />
        {isLg ? (
          leadId && !selected ? (
            <TrialLeadNotFound onBack={() => setParams({ lead: null })} />
          ) : selected ? (
            <TrialLeadDetail
              lead={selected}
              notes={notes}
              notesLoading={notesLoading}
              pending={pending}
              error={mutationError}
              showBack={false}
              onBack={() => setParams({ lead: null })}
              onStatus={(next) => void patchLead(selected.id, { status: next }, "status")}
              onFollowUp={(iso) => void patchLead(selected.id, { followUpAt: iso }, "followUp")}
              onNote={submitNote}
            />
          ) : (
            <TrialLeadsDetailPlaceholder />
          )
        ) : null}
      </div>
    </div>
  );
}
