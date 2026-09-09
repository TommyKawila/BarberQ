export type LineOaInstallRequestStatus =
  | "NEW"
  | "CONTACTED"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELLED";

export type RichMenuState = "existing" | "none" | "unsure";

export type LineOaHelpType = "add_to_existing" | "new_menu" | "recommend";

export interface LineOaInstallRequest {
  id: string;
  shop_id: string;
  line_oa: string;
  rich_menu_state: RichMenuState;
  help_type: LineOaHelpType;
  contact_phone: string;
  status: LineOaInstallRequestStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateLineOaInstallRequestInput {
  lineOa: string;
  richMenuState: RichMenuState;
  helpType: LineOaHelpType;
  contactPhone: string;
}

export const LINE_OA_INSTALL_STATUSES: LineOaInstallRequestStatus[] = [
  "NEW",
  "CONTACTED",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
];

export const RICH_MENU_STATES: RichMenuState[] = ["existing", "none", "unsure"];

export const LINE_OA_HELP_TYPES: LineOaHelpType[] = [
  "add_to_existing",
  "new_menu",
  "recommend",
];

const OPEN_STATUSES: LineOaInstallRequestStatus[] = [
  "NEW",
  "CONTACTED",
  "IN_PROGRESS",
];

const FORBIDDEN_FIELD_PATTERN = /password|credential|token|secret/i;

export function normalizeLineOa(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export function validateLineOaInstallPayload(
  body: Record<string, unknown>,
): CreateLineOaInstallRequestInput {
  for (const key of Object.keys(body)) {
    if (FORBIDDEN_FIELD_PATTERN.test(key)) {
      throw new Error("INVALID_CREDENTIAL_FIELD");
    }
  }

  const lineOa = normalizeLineOa(String(body.lineOa ?? ""));
  if (!lineOa || lineOa === "@") {
    throw new Error("INVALID_LINE_OA");
  }

  const richMenuState = body.richMenuState as RichMenuState;
  if (!RICH_MENU_STATES.includes(richMenuState)) {
    throw new Error("INVALID_RICH_MENU_STATE");
  }

  const helpType = body.helpType as LineOaHelpType;
  if (!LINE_OA_HELP_TYPES.includes(helpType)) {
    throw new Error("INVALID_HELP_TYPE");
  }

  const contactPhone = String(body.contactPhone ?? "").trim();
  if (!contactPhone) {
    throw new Error("INVALID_CONTACT_PHONE");
  }

  return { lineOa, richMenuState, helpType, contactPhone };
}

export function isOpenLineOaInstallStatus(status: LineOaInstallRequestStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

export function canSubmitNewRequest(latest: LineOaInstallRequest | null): boolean {
  if (!latest) return true;
  return latest.status === "CANCELLED";
}

export function shouldShowSuccessState(latest: LineOaInstallRequest | null): boolean {
  return latest !== null && latest.status !== "CANCELLED";
}
