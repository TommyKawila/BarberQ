import {
  evaluateSlipChecks,
  normalizePromptPayId,
  type SlipVerifier,
  type SlipVerifyRequest,
  type SlipVerifyResult,
} from "@/lib/billing/slip-verifier";

/**
 * SlipOK HTTP adapter (https://developer.slipok.com style).
 * Env: SLIP_VERIFIER=slipok, SLIPOK_API_KEY, optional SLIPOK_BRANCH_ID.
 * Never hard-code keys.
 */
export class SlipOkVerifier implements SlipVerifier {
  readonly name = "slipok";

  constructor(
    private readonly apiKey: string,
    private readonly branchId?: string,
    private readonly endpoint = "https://api.slipok.com/api/line/apikey",
  ) {}

  async verify(req: SlipVerifyRequest): Promise<SlipVerifyResult> {
    const branch = this.branchId?.trim();
    if (!this.apiKey.trim()) {
      return { ok: false, ambiguous: true, reason: "missing_api_key" };
    }

    const url = branch
      ? `${this.endpoint}/${encodeURIComponent(branch)}`
      : this.endpoint;

    try {
      const form = new FormData();
      form.append(
        "files",
        new Blob([new Uint8Array(req.image)], { type: req.contentType || "image/jpeg" }),
        "slip.jpg",
      );
      form.append("amount", String(req.expectedAmountBaht));

      const res = await fetch(url, {
        method: "POST",
        headers: { "x-authorization": this.apiKey },
        body: form,
      });

      const raw = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      if (!res.ok || !raw) {
        return {
          ok: false,
          ambiguous: true,
          reason: `slipok_http_${res.status}`,
          raw,
        };
      }

      const data = (raw.data as Record<string, unknown> | undefined) ?? raw;
      const amountBaht = Number(
        data.amount ?? data.transAmount ?? data.amountBaht ?? NaN,
      );
      const receiver =
        String(data.receiver?.toString?.() ?? data.proxyId ?? data.receiverId ?? "").trim() ||
        normalizePromptPayId(String(data.receivingAccount ?? ""));
      const transferAt = String(
        data.transDate ?? data.date ?? data.transferAt ?? new Date().toISOString(),
      );
      const transRef = String(data.transRef ?? data.ref ?? data.transactionId ?? "").trim();

      if (!Number.isFinite(amountBaht) || !receiver || !transRef) {
        return {
          ok: false,
          ambiguous: true,
          reason: "slipok_incomplete",
          amountBaht: Number.isFinite(amountBaht) ? amountBaht : undefined,
          receiverPromptPay: receiver || undefined,
          transferAt,
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
        reason: err instanceof Error ? err.message : "slipok_error",
      };
    }
  }
}
