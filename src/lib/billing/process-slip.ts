import { getStore } from "@/lib/data";
import { getOptionalPromptPayId } from "@/lib/billing/env";
import {
  formatPaymentMessage,
  notifyOperator,
} from "@/lib/billing/operator-notify";
import { getPaymentStore } from "@/lib/billing/payment-store";
import { createSlipVerifier } from "@/lib/billing/slip-verifiers";
import { uploadPaymentSlip } from "@/lib/billing/slip-storage";
import type { ShopPayment } from "@/lib/billing/types";
import { pushTextForShop } from "@/lib/line/push-message";
import type { Shop } from "@/types/booking";

export interface ProcessSlipInput {
  shop: Shop;
  amountBaht: number;
  planTier: string;
  image: ArrayBuffer;
  contentType: string | null;
  submittedByLineId: string;
}

export async function processPaymentSlip(
  input: ProcessSlipInput,
): Promise<ShopPayment> {
  const promptPayId = getOptionalPromptPayId();
  if (!promptPayId) {
    throw new Error("PROMPTPAY_NOT_CONFIGURED");
  }

  const uploaded = await uploadPaymentSlip(
    input.shop.id,
    input.image,
    input.contentType,
  );

  const payments = getPaymentStore();
  let payment = await payments.createPayment({
    shopId: input.shop.id,
    amountBaht: input.amountBaht,
    planTier: input.planTier,
    submittedByLineId: input.submittedByLineId,
    slipPath: uploaded.path,
    slipContentType: uploaded.contentType,
  });

  void notifyOperator(
    "payment_submitted",
    formatPaymentMessage({
      kind: "payment_submitted",
      shopName: input.shop.name,
      shopSlug: input.shop.slug,
      amountBaht: input.amountBaht,
      paymentId: payment.id,
    }),
  );

  const verifier = createSlipVerifier({ promptPayId });
  const result = await verifier.verify({
    image: Buffer.from(input.image),
    contentType: uploaded.contentType,
    expectedAmountBaht: input.amountBaht,
    expectedPromptPayId: promptPayId,
  });

  if (result.transRef) {
    const existing = await payments.findByTransRef(result.transRef);
    if (existing && existing.id !== payment.id) {
      payment = await payments.updatePayment(payment.id, {
        status: "failed",
        verifier: verifier.name,
        verifier_raw: result.raw ?? result,
        trans_ref: null,
        receiver_promptpay: result.receiverPromptPay ?? null,
        transfer_at: result.transferAt ?? null,
        review_note: "trans_ref_reused",
      });
      void notifyOperator(
        "payment_failed",
        formatPaymentMessage({
          kind: "payment_failed",
          shopName: input.shop.name,
          shopSlug: input.shop.slug,
          amountBaht: input.amountBaht,
          paymentId: payment.id,
          detail: "trans_ref reused",
        }),
      );
      return payment;
    }
  }

  if (result.ok) {
    try {
      payment = await payments.updatePayment(payment.id, {
        status: "verified",
        verifier: verifier.name,
        verifier_raw: result.raw ?? result,
        trans_ref: result.transRef,
        receiver_promptpay: result.receiverPromptPay,
        transfer_at: result.transferAt,
      });
    } catch (err) {
      if (err instanceof Error && err.message === "TRANS_REF_REUSED") {
        payment = await payments.updatePayment(payment.id, {
          status: "failed",
          verifier: verifier.name,
          verifier_raw: result.raw ?? result,
          review_note: "trans_ref_reused",
        });
        void notifyOperator(
          "payment_failed",
          formatPaymentMessage({
            kind: "payment_failed",
            shopName: input.shop.name,
            shopSlug: input.shop.slug,
            amountBaht: input.amountBaht,
            paymentId: payment.id,
            detail: "trans_ref reused",
          }),
        );
        return payment;
      }
      throw err;
    }

    await getStore().extendShopSubscription(input.shop.id, 1);

    void notifyOperator(
      "payment_verified",
      formatPaymentMessage({
        kind: "payment_verified",
        shopName: input.shop.name,
        shopSlug: input.shop.slug,
        amountBaht: input.amountBaht,
        paymentId: payment.id,
      }),
    );

    if (input.submittedByLineId) {
      void pushTextForShop(
        input.shop.id,
        input.submittedByLineId,
        `ชำระเงินสำเร็จ ฿${input.amountBaht}\nร้าน ${input.shop.name} ต่ออายุ 1 เดือนแล้ว ขอบคุณครับ`,
        "push_other",
      );
    }
    return payment;
  }

  if (result.ambiguous) {
    payment = await payments.updatePayment(payment.id, {
      status: "pending_review",
      verifier: verifier.name,
      verifier_raw: result.raw ?? result,
      trans_ref: result.transRef ?? null,
      receiver_promptpay: result.receiverPromptPay ?? null,
      transfer_at: result.transferAt ?? null,
      review_note: result.reason,
    });
    void notifyOperator(
      "payment_pending_review",
      formatPaymentMessage({
        kind: "payment_pending_review",
        shopName: input.shop.name,
        shopSlug: input.shop.slug,
        amountBaht: input.amountBaht,
        paymentId: payment.id,
        detail: result.reason,
      }),
    );
    return payment;
  }

  payment = await payments.updatePayment(payment.id, {
    status: "failed",
    verifier: verifier.name,
    verifier_raw: result.raw ?? result,
    trans_ref: result.transRef ?? null,
    receiver_promptpay: result.receiverPromptPay ?? null,
    transfer_at: result.transferAt ?? null,
    review_note: result.reason,
  });
  void notifyOperator(
    "payment_failed",
    formatPaymentMessage({
      kind: "payment_failed",
      shopName: input.shop.name,
      shopSlug: input.shop.slug,
      amountBaht: input.amountBaht,
      paymentId: payment.id,
      detail: result.reason,
    }),
  );
  return payment;
}

export async function manuallyReviewPayment(input: {
  paymentId: string;
  approve: boolean;
  note?: string | null;
}): Promise<ShopPayment> {
  const payments = getPaymentStore();
  const payment = await payments.getPayment(input.paymentId);
  if (!payment) throw new Error("NOT_FOUND");
  if (payment.status !== "pending_review" && payment.status !== "failed") {
    throw new Error("INVALID_STATUS");
  }

  if (!input.approve) {
    return payments.updatePayment(payment.id, {
      status: "rejected",
      review_note: input.note ?? "rejected",
      reviewed_at: new Date().toISOString(),
    });
  }

  const updated = await payments.updatePayment(payment.id, {
    status: "verified",
    review_note: input.note ?? "manual_approve",
    reviewed_at: new Date().toISOString(),
  });
  await getStore().extendShopSubscription(payment.shop_id, 1);

  const shop = (await getStore().listShops()).find((s) => s.id === payment.shop_id);
  if (shop) {
    void notifyOperator(
      "payment_verified",
      formatPaymentMessage({
        kind: "payment_verified",
        shopName: shop.name,
        shopSlug: shop.slug,
        amountBaht: payment.amount_baht,
        paymentId: payment.id,
        detail: "manual approve",
      }),
    );
    if (payment.submitted_by_line_id) {
      void pushTextForShop(
        shop.id,
        payment.submitted_by_line_id,
        `ชำระเงินสำเร็จ ฿${payment.amount_baht}\nร้าน ${shop.name} ต่ออายุ 1 เดือนแล้ว ขอบคุณครับ`,
        "push_other",
      );
    }
  }
  return updated;
}
