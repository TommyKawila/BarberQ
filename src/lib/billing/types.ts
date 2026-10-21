export type PaymentStatus =
  | "pending"
  | "pending_review"
  | "verified"
  | "rejected"
  | "failed";

export interface ShopPayment {
  id: string;
  shop_id: string;
  amount_baht: number;
  plan_tier: string;
  status: PaymentStatus;
  trans_ref: string | null;
  slip_path: string | null;
  slip_content_type: string | null;
  verifier: string | null;
  verifier_raw: unknown | null;
  receiver_promptpay: string | null;
  transfer_at: string | null;
  submitted_by_line_id: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateShopPaymentInput {
  shopId: string;
  amountBaht: number;
  planTier: string;
  submittedByLineId?: string | null;
  slipPath?: string | null;
  slipContentType?: string | null;
}

export interface SubscriptionReminderRow {
  id: string;
  shop_id: string;
  subscribed_until: string;
  days_before: 0 | 3 | 7;
  sent_at: string;
}
