import type { MessageKey } from "@/lib/i18n/dictionary";
import type { TrialLeadStatus } from "@/lib/marketing/trial-leads";

export const TRIAL_CRM_STATUS_KEYS: Record<TrialLeadStatus, MessageKey> = {
  NEW: "superadmin.crm.status.new",
  CONTACTED: "superadmin.crm.status.contacted",
  CONVERTED: "superadmin.crm.status.converted",
  CLOSED: "superadmin.crm.status.closed",
};

export function isOpenPipelineStatus(status: TrialLeadStatus): boolean {
  return status !== "CONVERTED" && status !== "CLOSED";
}
