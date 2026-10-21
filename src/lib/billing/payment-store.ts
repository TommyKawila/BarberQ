import { randomUUID } from "crypto";
import { isPrototypeMode } from "@/lib/data";
import { createServiceClient } from "@/lib/supabase/server";
import type {
  CreateShopPaymentInput,
  PaymentStatus,
  ShopPayment,
  SubscriptionReminderRow,
} from "@/lib/billing/types";

const GLOBAL_KEY = "__barberq_payment_store__";

interface MemState {
  payments: ShopPayment[];
  reminders: SubscriptionReminderRow[];
}

type GlobalStore = typeof globalThis & { [GLOBAL_KEY]?: MemState };

function mem(): MemState {
  const g = globalThis as GlobalStore;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = { payments: [], reminders: [] };
  return g[GLOBAL_KEY]!;
}

function nowIso() {
  return new Date().toISOString();
}

export interface PaymentStore {
  createPayment(input: CreateShopPaymentInput): Promise<ShopPayment>;
  getPayment(id: string): Promise<ShopPayment | null>;
  listPaymentsForShop(shopId: string): Promise<ShopPayment[]>;
  listPendingReview(): Promise<ShopPayment[]>;
  findByTransRef(transRef: string): Promise<ShopPayment | null>;
  updatePayment(
    id: string,
    patch: Partial<{
      status: PaymentStatus;
      trans_ref: string | null;
      slip_path: string | null;
      slip_content_type: string | null;
      verifier: string | null;
      verifier_raw: unknown | null;
      receiver_promptpay: string | null;
      transfer_at: string | null;
      review_note: string | null;
      reviewed_at: string | null;
    }>,
  ): Promise<ShopPayment>;
  claimSubscriptionReminder(
    shopId: string,
    subscribedUntil: string,
    daysBefore: 0 | 3 | 7,
  ): Promise<boolean>;
}

const memoryPaymentStore: PaymentStore = {
  async createPayment(input) {
    const row: ShopPayment = {
      id: randomUUID(),
      shop_id: input.shopId,
      amount_baht: input.amountBaht,
      plan_tier: input.planTier,
      status: "pending",
      trans_ref: null,
      slip_path: input.slipPath ?? null,
      slip_content_type: input.slipContentType ?? null,
      verifier: null,
      verifier_raw: null,
      receiver_promptpay: null,
      transfer_at: null,
      submitted_by_line_id: input.submittedByLineId ?? null,
      review_note: null,
      reviewed_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    mem().payments.push(row);
    return { ...row };
  },

  async getPayment(id) {
    const row = mem().payments.find((p) => p.id === id);
    return row ? { ...row } : null;
  },

  async listPaymentsForShop(shopId) {
    return mem()
      .payments.filter((p) => p.shop_id === shopId)
      .map((p) => ({ ...p }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async listPendingReview() {
    return mem()
      .payments.filter((p) => p.status === "pending_review")
      .map((p) => ({ ...p }))
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async findByTransRef(transRef) {
    const ref = transRef.trim();
    if (!ref) return null;
    const row = mem().payments.find((p) => p.trans_ref === ref);
    return row ? { ...row } : null;
  },

  async updatePayment(id, patch) {
    const row = mem().payments.find((p) => p.id === id);
    if (!row) throw new Error("NOT_FOUND");
    Object.assign(row, patch, { updated_at: nowIso() });
    return { ...row };
  },

  async claimSubscriptionReminder(shopId, subscribedUntil, daysBefore) {
    const exists = mem().reminders.some(
      (r) =>
        r.shop_id === shopId &&
        r.subscribed_until === subscribedUntil &&
        r.days_before === daysBefore,
    );
    if (exists) return false;
    mem().reminders.push({
      id: randomUUID(),
      shop_id: shopId,
      subscribed_until: subscribedUntil,
      days_before: daysBefore,
      sent_at: nowIso(),
    });
    return true;
  },
};

const supabasePaymentStore: PaymentStore = {
  async createPayment(input) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("shop_payments")
      .insert({
        shop_id: input.shopId,
        amount_baht: input.amountBaht,
        plan_tier: input.planTier,
        slip_path: input.slipPath ?? null,
        slip_content_type: input.slipContentType ?? null,
        submitted_by_line_id: input.submittedByLineId ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as ShopPayment;
  },

  async getPayment(id) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("shop_payments")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as ShopPayment | null) ?? null;
  },

  async listPaymentsForShop(shopId) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("shop_payments")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as ShopPayment[]) ?? [];
  },

  async listPendingReview() {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("shop_payments")
      .select("*")
      .eq("status", "pending_review")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as ShopPayment[]) ?? [];
  },

  async findByTransRef(transRef) {
    const ref = transRef.trim();
    if (!ref) return null;
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("shop_payments")
      .select("*")
      .eq("trans_ref", ref)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as ShopPayment | null) ?? null;
  },

  async updatePayment(id, patch) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("shop_payments")
      .update({ ...patch, updated_at: nowIso() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("TRANS_REF_REUSED");
      throw new Error(error.message);
    }
    return data as ShopPayment;
  },

  async claimSubscriptionReminder(shopId, subscribedUntil, daysBefore) {
    const supabase = createServiceClient();
    const { error } = await supabase.from("shop_subscription_reminders").insert({
      shop_id: shopId,
      subscribed_until: subscribedUntil,
      days_before: daysBefore,
    });
    if (error) {
      if (error.code === "23505") return false;
      throw new Error(error.message);
    }
    return true;
  },
};

export function getPaymentStore(): PaymentStore {
  return isPrototypeMode() ? memoryPaymentStore : supabasePaymentStore;
}

/** Test helper — clear in-memory payments/reminders. */
export function resetMemoryPaymentStore(): void {
  const g = globalThis as GlobalStore;
  g[GLOBAL_KEY] = { payments: [], reminders: [] };
}
