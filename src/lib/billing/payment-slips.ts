import type { BillingPeriod } from "@/lib/billing/billing-amount";
import type { BarberTierId } from "@/lib/billing/barber-tier";

export const PAYMENT_SLIP_STATUSES = ["pending", "paid", "rejected"] as const;
export type PaymentSlipStatus = (typeof PAYMENT_SLIP_STATUSES)[number];

export const PAYMENT_SLIPS_BUCKET = "payment-slips";

export interface ShopPaymentSlip {
  id: string;
  shop_id: string;
  amount_thb: number;
  tier: BarberTierId;
  period: BillingPeriod;
  status: PaymentSlipStatus;
  storage_path: string;
  content_type: string | null;
  note: string | null;
  uploaded_by_barber_id: string | null;
  reviewed_at: string | null;
  reviewed_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentSlipInput {
  shopId: string;
  amountThb: number;
  tier: BarberTierId;
  period?: BillingPeriod;
  storagePath: string;
  contentType: string | null;
  note?: string | null;
  uploadedByBarberId?: string | null;
}

export function isPaymentSlipStatus(value: unknown): value is PaymentSlipStatus {
  return (
    typeof value === "string" &&
    (PAYMENT_SLIP_STATUSES as readonly string[]).includes(value)
  );
}
