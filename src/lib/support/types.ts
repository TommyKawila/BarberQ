export type SupportTicketType = "setup_help" | "problem" | "feature" | "crash";

export type SupportTicketStatus = "new" | "in_progress" | "done" | "wont_do";

export type SupportReplyAuthor = "operator" | "owner";

export interface SupportTicket {
  id: string;
  shop_id: string;
  reporter_line_user_id: string;
  reporter_staff_id: string | null;
  reporter_name: string | null;
  type: SupportTicketType;
  status: SupportTicketStatus;
  body: string;
  page_path: string | null;
  device_info: string | null;
  error_message: string | null;
  error_digest: string | null;
  app_version: string | null;
  error_fingerprint: string | null;
  occurrence_count: number;
  last_occurred_at: string;
  screenshot_paths: string[];
  created_at: string;
  updated_at: string;
}

export interface SupportTicketReply {
  id: string;
  ticket_id: string;
  author_role: SupportReplyAuthor;
  body: string;
  created_at: string;
}

export interface CreateSupportTicketInput {
  shopId: string;
  reporterLineUserId: string;
  reporterStaffId?: string | null;
  reporterName?: string | null;
  type: SupportTicketType;
  body: string;
  pagePath?: string | null;
  deviceInfo?: string | null;
  errorMessage?: string | null;
  errorDigest?: string | null;
  appVersion?: string | null;
  errorFingerprint?: string | null;
  screenshotPaths?: string[];
}

export interface SupportTicketWithMeta extends SupportTicket {
  shopName?: string;
  shopSlug?: string | null;
  replies?: SupportTicketReply[];
}

export const SUPPORT_TICKET_TYPES: SupportTicketType[] = [
  "setup_help",
  "problem",
  "feature",
  "crash",
];

export const SUPPORT_TICKET_STATUSES: SupportTicketStatus[] = [
  "new",
  "in_progress",
  "done",
  "wont_do",
];

/** Crash occurrence counts that re-alert the operator (new ticket always alerts). */
export const CRASH_NOTIFY_OCCURRENCE_THRESHOLDS = [5, 10, 25, 50, 100] as const;

export const SUPPORT_REPLY_SLA_COPY_TH =
  "ทีม ClipperQ จะตอบภายใน 24 ชั่วโมง";
export const SUPPORT_REPLY_SLA_COPY_EN =
  "The ClipperQ team replies within 24 hours";
