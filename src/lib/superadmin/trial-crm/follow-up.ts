import { endOfDay, isSameDay, startOfDay } from "date-fns";
import type { TrialLeadStatus } from "@/lib/marketing/trial-leads";
import { isOpenPipelineStatus } from "./status";

export type FollowUpState = "none" | "future" | "today" | "overdue";

export function isFollowUpDueToday(
  followUpAt: string | null,
  status: TrialLeadStatus,
  now = new Date(),
): boolean {
  if (!followUpAt || !isOpenPipelineStatus(status)) return false;
  const at = new Date(followUpAt);
  if (Number.isNaN(at.getTime())) return false;
  return at.getTime() <= endOfDay(now).getTime();
}

export function followUpState(
  followUpAt: string | null,
  now = new Date(),
): FollowUpState {
  if (!followUpAt) return "none";
  const at = new Date(followUpAt);
  if (Number.isNaN(at.getTime())) return "none";
  if (at.getTime() < startOfDay(now).getTime()) return "overdue";
  if (isSameDay(at, now)) return "today";
  return "future";
}

export function parseFollowUpAt(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("INVALID_FOLLOW_UP");
  }
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) throw new Error("INVALID_FOLLOW_UP");
  return at.toISOString();
}

export function localFollowUpIso(daysFromToday: number, now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}
