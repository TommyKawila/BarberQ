import { randomUUID } from "crypto";
import { isPrototypeMode } from "@/lib/data";
import { createServiceClient } from "@/lib/supabase/server";
import type {
  CreateSupportTicketInput,
  SupportTicket,
  SupportTicketReply,
  SupportTicketStatus,
  SupportTicketType,
  SupportReplyAuthor,
} from "@/lib/support/types";

const GLOBAL_KEY = "__barberq_support_ticket_store__";

interface MemState {
  tickets: SupportTicket[];
  replies: SupportTicketReply[];
}

type GlobalStore = typeof globalThis & { [GLOBAL_KEY]?: MemState };

function mem(): MemState {
  const g = globalThis as GlobalStore;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = { tickets: [], replies: [] };
  return g[GLOBAL_KEY]!;
}

function nowIso() {
  return new Date().toISOString();
}

export interface SupportTicketStore {
  createTicket(input: CreateSupportTicketInput): Promise<SupportTicket>;
  getTicket(id: string): Promise<SupportTicket | null>;
  listTicketsForShop(shopId: string): Promise<SupportTicket[]>;
  listTickets(filters?: {
    type?: SupportTicketType;
    status?: SupportTicketStatus;
  }): Promise<SupportTicket[]>;
  findOpenCrashByFingerprint(
    shopId: string,
    fingerprint: string,
  ): Promise<SupportTicket | null>;
  incrementCrashOccurrence(id: string): Promise<SupportTicket>;
  updateTicketStatus(id: string, status: SupportTicketStatus): Promise<SupportTicket>;
  listReplies(ticketId: string): Promise<SupportTicketReply[]>;
  addReply(
    ticketId: string,
    authorRole: SupportReplyAuthor,
    body: string,
  ): Promise<SupportTicketReply>;
}

function rowFromInput(input: CreateSupportTicketInput): SupportTicket {
  const now = nowIso();
  return {
    id: randomUUID(),
    shop_id: input.shopId,
    reporter_line_user_id: input.reporterLineUserId,
    reporter_staff_id: input.reporterStaffId ?? null,
    reporter_name: input.reporterName ?? null,
    type: input.type,
    status: "new",
    body: input.body,
    page_path: input.pagePath ?? null,
    device_info: input.deviceInfo ?? null,
    error_message: input.errorMessage ?? null,
    error_digest: input.errorDigest ?? null,
    app_version: input.appVersion ?? null,
    error_fingerprint: input.errorFingerprint ?? null,
    occurrence_count: 1,
    last_occurred_at: now,
    screenshot_paths: input.screenshotPaths ?? [],
    created_at: now,
    updated_at: now,
  };
}

const memoryStore: SupportTicketStore = {
  async createTicket(input) {
    const row = rowFromInput(input);
    mem().tickets.push(row);
    return { ...row, screenshot_paths: [...row.screenshot_paths] };
  },

  async getTicket(id) {
    const row = mem().tickets.find((t) => t.id === id);
    return row ? { ...row, screenshot_paths: [...row.screenshot_paths] } : null;
  },

  async listTicketsForShop(shopId) {
    return mem()
      .tickets.filter((t) => t.shop_id === shopId)
      .map((t) => ({ ...t, screenshot_paths: [...t.screenshot_paths] }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async listTickets(filters) {
    return mem()
      .tickets.filter((t) => {
        if (filters?.type && t.type !== filters.type) return false;
        if (filters?.status && t.status !== filters.status) return false;
        return true;
      })
      .map((t) => ({ ...t, screenshot_paths: [...t.screenshot_paths] }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async findOpenCrashByFingerprint(shopId, fingerprint) {
    const row = mem().tickets.find(
      (t) =>
        t.shop_id === shopId &&
        t.type === "crash" &&
        t.error_fingerprint === fingerprint &&
        (t.status === "new" || t.status === "in_progress"),
    );
    return row ? { ...row, screenshot_paths: [...row.screenshot_paths] } : null;
  },

  async incrementCrashOccurrence(id) {
    const row = mem().tickets.find((t) => t.id === id);
    if (!row) throw new Error("NOT_FOUND");
    row.occurrence_count += 1;
    row.last_occurred_at = nowIso();
    row.updated_at = row.last_occurred_at;
    return { ...row, screenshot_paths: [...row.screenshot_paths] };
  },

  async updateTicketStatus(id, status) {
    const row = mem().tickets.find((t) => t.id === id);
    if (!row) throw new Error("NOT_FOUND");
    row.status = status;
    row.updated_at = nowIso();
    return { ...row, screenshot_paths: [...row.screenshot_paths] };
  },

  async listReplies(ticketId) {
    return mem()
      .replies.filter((r) => r.ticket_id === ticketId)
      .map((r) => ({ ...r }))
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async addReply(ticketId, authorRole, body) {
    const ticket = mem().tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error("NOT_FOUND");
    const reply: SupportTicketReply = {
      id: randomUUID(),
      ticket_id: ticketId,
      author_role: authorRole,
      body: body.trim(),
      created_at: nowIso(),
    };
    mem().replies.push(reply);
    ticket.updated_at = nowIso();
    return { ...reply };
  },
};

const supabaseStore: SupportTicketStore = {
  async createTicket(input) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        shop_id: input.shopId,
        reporter_line_user_id: input.reporterLineUserId,
        reporter_staff_id: input.reporterStaffId ?? null,
        reporter_name: input.reporterName ?? null,
        type: input.type,
        body: input.body,
        page_path: input.pagePath ?? null,
        device_info: input.deviceInfo ?? null,
        error_message: input.errorMessage ?? null,
        error_digest: input.errorDigest ?? null,
        app_version: input.appVersion ?? null,
        error_fingerprint: input.errorFingerprint ?? null,
        screenshot_paths: input.screenshotPaths ?? [],
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return normalizeTicket(data);
  },

  async getTicket(id) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? normalizeTicket(data) : null;
  },

  async listTicketsForShop(shopId) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(normalizeTicket);
  },

  async listTickets(filters) {
    const supabase = createServiceClient();
    let q = supabase.from("support_tickets").select("*");
    if (filters?.type) q = q.eq("type", filters.type);
    if (filters?.status) q = q.eq("status", filters.status);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(normalizeTicket);
  },

  async findOpenCrashByFingerprint(shopId, fingerprint) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("shop_id", shopId)
      .eq("type", "crash")
      .eq("error_fingerprint", fingerprint)
      .in("status", ["new", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? normalizeTicket(data) : null;
  },

  async incrementCrashOccurrence(id) {
    const existing = await this.getTicket(id);
    if (!existing) throw new Error("NOT_FOUND");
    const supabase = createServiceClient();
    const now = nowIso();
    const { data, error } = await supabase
      .from("support_tickets")
      .update({
        occurrence_count: existing.occurrence_count + 1,
        last_occurred_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return normalizeTicket(data);
  },

  async updateTicketStatus(id, status) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .update({ status, updated_at: nowIso() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return normalizeTicket(data);
  },

  async listReplies(ticketId) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("support_ticket_replies")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as SupportTicketReply[]) ?? [];
  },

  async addReply(ticketId, authorRole, body) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("support_ticket_replies")
      .insert({
        ticket_id: ticketId,
        author_role: authorRole,
        body: body.trim(),
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await supabase
      .from("support_tickets")
      .update({ updated_at: nowIso() })
      .eq("id", ticketId);
    return data as SupportTicketReply;
  },
};

function normalizeTicket(raw: Record<string, unknown>): SupportTicket {
  const paths = raw.screenshot_paths;
  return {
    ...(raw as unknown as SupportTicket),
    screenshot_paths: Array.isArray(paths) ? (paths as string[]) : [],
  };
}

export function getSupportTicketStore(): SupportTicketStore {
  return isPrototypeMode() ? memoryStore : supabaseStore;
}

/** Test helper — clear in-memory tickets/replies. */
export function resetMemorySupportTicketStore(): void {
  const g = globalThis as GlobalStore;
  g[GLOBAL_KEY] = { tickets: [], replies: [] };
}
