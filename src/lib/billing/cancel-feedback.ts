/** Reasons for 「ไม่ใช้บริการต่อ」 feedback (stored as stable codes). */
export const CANCEL_FEEDBACK_REASONS = [
  "price_high",
  "hard_to_use",
  "few_bookings",
  "missing_features",
  "closing_shop",
  "other",
] as const;

export type CancelFeedbackReason = (typeof CANCEL_FEEDBACK_REASONS)[number];

export const CANCEL_FEEDBACK_REASON_LABELS_TH: Record<
  CancelFeedbackReason,
  string
> = {
  price_high: "ราคาแพง",
  hard_to_use: "ใช้ยาก",
  few_bookings: "ลูกค้าไม่ค่อยจอง",
  missing_features: "ฟีเจอร์ไม่พอ",
  closing_shop: "ปิดร้านหรือย้ายร้าน",
  other: "อื่นๆ",
};

export function isCancelFeedbackReason(
  value: unknown,
): value is CancelFeedbackReason {
  return (
    typeof value === "string" &&
    (CANCEL_FEEDBACK_REASONS as readonly string[]).includes(value)
  );
}

export interface ShopCancelFeedback {
  id: string;
  shop_id: string;
  reason: CancelFeedbackReason;
  detail: string | null;
  bookable_count: number | null;
  recommended_tier: string | null;
  created_by_barber_id: string | null;
  created_at: string;
}

export interface CreateShopCancelFeedbackInput {
  shopId: string;
  reason: CancelFeedbackReason;
  detail?: string | null;
  bookableCount?: number | null;
  recommendedTier?: string | null;
  createdByBarberId?: string | null;
}
