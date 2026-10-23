"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CANCEL_FEEDBACK_REASONS,
  CANCEL_FEEDBACK_REASON_LABELS_TH,
  type CancelFeedbackReason,
} from "@/lib/billing/cancel-feedback";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { isShopOperatorRole } from "@/lib/admin-auth";
import { useShopSlug } from "@/lib/shop/shop-slug-context";

interface NoticePayload {
  show: boolean;
  message: string;
  bookableCount: number;
  recommendedTier: string;
  rangeLabel: string;
  priceLabel: string | null;
  overdue?: boolean;
  graceDaysLeft?: number;
  overdueHeadline?: string;
  overdueMessage?: string;
}

type Panel = "notice" | "form" | "thanks";

/**
 * Soft post-trial billing card (admin only, no LINE).
 * From trial day 25+; never blocks. Includes cancel-intent feedback.
 */
export function TierBillingNotice() {
  const { ready, profile, authHeaders } = useAdminAuth();
  const { shopApi, shopPath } = useShopSlug();
  const [notice, setNotice] = useState<NoticePayload | null>(null);
  const [panel, setPanel] = useState<Panel>("notice");
  const [reason, setReason] = useState<CancelFeedbackReason | null>(null);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const dismissKey = `cq_tier_notice_dismissed:${shopApi("/").replace(/\/$/, "")}`;

  const load = useCallback(async () => {
    if (!ready || !profile || !isShopOperatorRole(profile.role)) {
      setNotice(null);
      return;
    }
    try {
      if (typeof sessionStorage !== "undefined") {
        setDismissed(sessionStorage.getItem(dismissKey) === "1");
      }
      const res = await fetch(shopApi("/billing/tier-notice"), {
        headers: authHeaders,
      });
      if (!res.ok) {
        setNotice(null);
        return;
      }
      const json = (await res.json()) as NoticePayload;
      setNotice(json.show ? json : null);
      if (json.show) setPanel("notice");
    } catch {
      setNotice(null);
    }
  }, [authHeaders, dismissKey, profile, ready, shopApi]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitFeedback() {
    if (!reason) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(shopApi("/billing/cancel-feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ reason, detail: detail.trim() || null }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? "ส่งไม่สำเร็จ");
        return;
      }
      setPanel("thanks");
    } catch {
      setError("ส่งไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  const overdue = Boolean(notice?.overdue);
  // Overdue red banner cannot be session-dismissed — keep showing after day 30.
  if (!notice || (dismissed && panel === "notice" && !overdue)) return null;

  const shellClass = overdue
    ? "mx-4 mt-3 rounded-2xl border border-red-500/50 bg-red-950/40 px-4 py-3 lg:mx-0"
    : "mx-4 mt-3 rounded-2xl border border-amber-500/35 bg-zinc-900 px-4 py-3 lg:mx-0";
  const ctaClass = overdue
    ? "flex min-h-11 w-full items-center justify-center rounded-xl bg-red-500 text-sm font-semibold text-white"
    : "flex min-h-11 w-full items-center justify-center rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950";

  return (
    <section
      data-testid="tier-billing-notice"
      data-overdue={overdue ? "true" : "false"}
      className={shellClass}
    >
      {panel === "notice" ? (
        <>
          {overdue ? (
            <>
              <p
                className="text-sm font-semibold text-red-300"
                data-testid="tier-notice-overdue-headline"
              >
                {notice.overdueHeadline || "เลยกำหนดชำระแล้ว"}
              </p>
              {notice.graceDaysLeft != null && notice.graceDaysLeft > 0 ? (
                <p
                  className="mt-1 text-sm text-red-200/90"
                  data-testid="tier-notice-grace-days"
                >
                  เหลือเวลาผ่อนผัน {notice.graceDaysLeft} วัน
                </p>
              ) : null}
              <p className="mt-1 text-sm leading-relaxed text-zinc-100">
                {notice.overdueMessage || notice.message}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-zinc-100">
                {notice.message}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                ใช้ได้ตามปกติ · ไม่ล็อกร้าน · ไม่มีการตัดบัตรอัตโนมัติ
              </p>
            </>
          )}
          <div className="mt-3 flex flex-col gap-2">
            <Link
              href={shopPath("/admin/settings/billing")}
              data-testid="tier-notice-billing"
              className={ctaClass}
            >
              {overdue ? "ชำระเงินเลย" : "ไปหน้าชำระเงิน PromptPay"}
            </Link>
            {!overdue ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  data-testid="tier-notice-continue"
                  onClick={() => {
                    try {
                      sessionStorage.setItem(dismissKey, "1");
                    } catch {
                      /* ignore */
                    }
                    setDismissed(true);
                  }}
                  className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-zinc-600 text-sm font-medium text-zinc-200"
                >
                  รับทราบ
                </button>
                <button
                  type="button"
                  data-testid="tier-notice-cancel"
                  onClick={() => {
                    setPanel("form");
                    setReason(null);
                    setDetail("");
                    setError(null);
                  }}
                  className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-zinc-600 text-sm font-medium text-zinc-200"
                >
                  ไม่ใช้บริการต่อ
                </button>
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {panel === "form" ? (
        <div data-testid="cancel-feedback-form">
          <h2 className="text-sm font-semibold text-zinc-50">
            ทำไมถึงอยากหยุดใช้?
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            บอกเหตุผลได้เลยครับ ร้านยังใช้ได้ตามปกติ
          </p>
          <ul className="mt-3 space-y-2">
            {CANCEL_FEEDBACK_REASONS.map((code) => (
              <li key={code}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 has-[:checked]:border-amber-400/60 has-[:checked]:bg-amber-400/10">
                  <input
                    type="radio"
                    name="cancel-reason"
                    value={code}
                    checked={reason === code}
                    onChange={() => setReason(code)}
                    className="accent-amber-400"
                  />
                  {CANCEL_FEEDBACK_REASON_LABELS_TH[code]}
                </label>
              </li>
            ))}
          </ul>
          <label className="mt-3 block text-xs text-zinc-400">
            รายละเอียดเพิ่มเติม (ไม่บังคับ)
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              maxLength={1000}
              data-testid="cancel-feedback-detail"
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              data-testid="cancel-feedback-submit"
              disabled={!reason || submitting}
              onClick={() => void submitFeedback()}
              className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950 disabled:opacity-50"
            >
              {submitting ? "กำลังส่ง…" : "ส่งความคิดเห็น"}
            </button>
            <button
              type="button"
              onClick={() => setPanel("notice")}
              className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-zinc-600 text-sm font-medium text-zinc-200"
            >
              ย้อนกลับ
            </button>
          </div>
        </div>
      ) : null}

      {panel === "thanks" ? (
        <div data-testid="cancel-feedback-thanks">
          <p className="text-sm font-semibold text-zinc-50">ขอบคุณครับ</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-300">
            รับเรื่องแล้ว ร้านยังใช้ ClipperQ ได้ตามปกติ ไม่มีการปิดบัญชีอัตโนมัติ
          </p>
          <button
            type="button"
            onClick={() => setPanel("notice")}
            className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950"
          >
            กลับ
          </button>
        </div>
      ) : null}
    </section>
  );
}
