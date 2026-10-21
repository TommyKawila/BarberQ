import {
  evaluateSlipChecks,
  normalizePromptPayId,
  type SlipVerifier,
  type SlipVerifyRequest,
  type SlipVerifyResult,
} from "@/lib/billing/slip-verifier";

/**
 * EasySlip-style HTTP adapter.
 * Env: SLIP_VERIFIER=easyslip, EASYSLIP_API_KEY.
 */
export class EasySlipVerifier implements SlipVerifier {
  readonly name = "easyslip";

  constructor(
    private readonly apiKey: string,
    private readonly endpoint = "https://developer.easyslip.com/api/v1/verify",
  ) {}

  async verify(req: SlipVerifyRequest): Promise<SlipVerifyResult> {
    if (!this.apiKey.trim()) {
      return { ok: false, ambiguous: true, reason: "missing_api_key" };
    }

    try {
      const form = new FormData();
      form.append(
        "file",
        new Blob([new Uint8Array(req.image)], { type: req.contentType || "image/jpeg" }),
        "slip.jpg",
      );

      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}` },
        body: form,
      });

      const raw = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      if (!res.ok || !raw) {
        return {
          ok: false,
          ambiguous: true,
          reason: `easyslip_http_${res.status}`,
          raw,
        };
      }

      const data = (raw.data as Record<string, unknown> | undefined) ?? raw;
      const amountBaht = Number(data.amount ?? data.amountBaht ?? NaN);
      const receiver = normalizePromptPayId(
        String(data.receiver?.toString?.() ?? data.account ?? data.proxy ?? ""),
      );
      const transferAt = String(data.date ?? data.transDate ?? data.transferAt ?? "");
      const transRef = String(data.transRef ?? data.ref ?? "").trim();

      if (!Number.isFinite(amountBaht) || !receiver || !transRef || !transferAt) {
        return {
          ok: false,
          ambiguous: true,
          reason: "easyslip_incomplete",
          amountBaht: Number.isFinite(amountBaht) ? amountBaht : undefined,
          receiverPromptPay: receiver || undefined,
          transferAt: transferAt || undefined,
          transRef: transRef || undefined,
          raw,
        };
      }

      const checks = evaluateSlipChecks({
        amountBaht: Math.round(amountBaht),
        expectedAmountBaht: req.expectedAmountBaht,
        receiverPromptPay: receiver,
        expectedPromptPayId: req.expectedPromptPayId,
        transferAt,
        transRef,
        maxAgeMinutes: req.maxAgeMinutes,
      });

      if (!checks.pass) {
        return {
          ok: false,
          ambiguous: checks.ambiguous,
          reason: checks.reason,
          amountBaht: Math.round(amountBaht),
          receiverPromptPay: receiver,
          transferAt,
          transRef,
          raw,
        };
      }

      return {
        ok: true,
        ambiguous: false,
        amountBaht: Math.round(amountBaht),
        receiverPromptPay: receiver,
        transferAt,
        transRef,
        raw,
      };
    } catch (err) {
      return {
        ok: false,
        ambiguous: true,
        reason: err instanceof Error ? err.message : "easyslip_error",
      };
    }
  }
}
