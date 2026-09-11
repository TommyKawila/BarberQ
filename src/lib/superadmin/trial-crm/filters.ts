import type { TrialLead, TrialLeadStatus } from "@/lib/marketing/trial-leads";
import { isFollowUpDueToday } from "./follow-up";
import { isOpenPipelineStatus } from "./status";

export type TrialCrmSort = "newest" | "oldest" | "followup" | "barbers";

export interface TrialCrmFilters {
  q?: string;
  status?: TrialLeadStatus | null;
  source?: string | null;
  campaign?: string | null;
  province?: string | null;
}

export interface TrialLeadStats {
  newCount: number;
  followUpToday: number;
  contacted: number;
  converted: number;
  closed: number;
}

export function computeTrialLeadStats(
  leads: TrialLead[],
  now = new Date(),
): TrialLeadStats {
  return {
    newCount: leads.filter((l) => l.status === "NEW").length,
    followUpToday: leads.filter((l) =>
      isFollowUpDueToday(l.follow_up_at, l.status, now),
    ).length,
    contacted: leads.filter((l) => l.status === "CONTACTED").length,
    converted: leads.filter((l) => l.status === "CONVERTED").length,
    closed: leads.filter((l) => l.status === "CLOSED").length,
  };
}

function includesInsensitive(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function filterTrialLeads(
  leads: TrialLead[],
  filters: TrialCrmFilters,
): TrialLead[] {
  const q = filters.q?.trim() ?? "";
  return leads.filter((lead) => {
    if (filters.status && lead.status !== filters.status) return false;
    if (filters.source && (lead.utm_source ?? "") !== filters.source) return false;
    if (filters.campaign && (lead.utm_campaign ?? "") !== filters.campaign) {
      return false;
    }
    if (filters.province && (lead.province ?? "") !== filters.province) return false;
    if (!q) return true;
    return (
      includesInsensitive(lead.shop_name, q) ||
      includesInsensitive(lead.contact_name, q) ||
      includesInsensitive(lead.contact_value, q)
    );
  });
}

export function sortTrialLeads(leads: TrialLead[], sort: TrialCrmSort): TrialLead[] {
  const copy = [...leads];
  if (sort === "oldest") {
    return copy.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  if (sort === "followup") {
    return copy.sort((a, b) => {
      if (!a.follow_up_at && !b.follow_up_at) return b.created_at.localeCompare(a.created_at);
      if (!a.follow_up_at) return 1;
      if (!b.follow_up_at) return -1;
      return a.follow_up_at.localeCompare(b.follow_up_at);
    });
  }
  if (sort === "barbers") {
    return copy.sort((a, b) => {
      const an = a.barber_count ?? -1;
      const bn = b.barber_count ?? -1;
      if (bn !== an) return bn - an;
      return b.created_at.localeCompare(a.created_at);
    });
  }
  return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function uniqueNonEmpty(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v && v.trim())))].sort();
}

export function applyTrialCrmView(
  leads: TrialLead[],
  filters: TrialCrmFilters,
  sort: TrialCrmSort,
): TrialLead[] {
  return sortTrialLeads(filterTrialLeads(leads, filters), sort);
}

export { isOpenPipelineStatus };
