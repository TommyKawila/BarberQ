import {
  evaluateSlipChecks,
  type SlipVerifier,
  type SlipVerifyRequest,
  type SlipVerifyResult,
} from "@/lib/billing/slip-verifier";

/**
 * QA / test verifier. Encode expectations in the image filename path via
 * optional magic JSON in the first bytes is too heavy — instead use content
 * type + a deterministic parse of ASCII trailer, OR the env-driven defaults.
 *
 * Convention for tests: pass `contentType` ending with `+mock/<outcome>`
 * e.g. `image/jpeg+mock/pass`, `image/jpeg+mock/fail-amount`,
 * `image/jpeg+mock/ambiguous`, `image/jpeg+mock/reuse-ref:ABC123`.
 */
export class MockSlipVerifier implements SlipVerifier {
  readonly name = "mock";

  constructor(
    private readonly defaults: {
      receiverPromptPay: string;
      amountBaht?: number;
      transRef?: string;
      transferAt?: string;
    },
  ) {}

  async verify(req: SlipVerifyRequest): Promise<SlipVerifyResult> {
    const marker = req.contentType.includes("+mock/")
      ? req.contentType.split("+mock/")[1] ?? "pass"
      : "pass";

    const [kind, extra] = marker.split(":");
    const amountBaht = this.defaults.amountBaht ?? req.expectedAmountBaht;
    const receiver = this.defaults.receiverPromptPay;
    const transferAt = this.defaults.transferAt ?? new Date().toISOString();
    const transRef =
      extra && kind === "reuse-ref"
        ? extra
        : this.defaults.transRef ?? `MOCK-${Date.now()}`;

    if (kind === "ambiguous") {
      return {
        ok: false,
        ambiguous: true,
        reason: "mock_ambiguous",
        amountBaht,
        receiverPromptPay: receiver,
        transferAt,
        transRef,
        raw: { mock: true, kind },
      };
    }

    if (kind === "fail-amount") {
      return {
        ok: false,
        ambiguous: false,
        reason: "amount_mismatch",
        amountBaht: amountBaht + 1,
        receiverPromptPay: receiver,
        transferAt,
        transRef,
        raw: { mock: true, kind },
      };
    }

    if (kind === "fail-receiver") {
      return {
        ok: false,
        ambiguous: false,
        reason: "receiver_mismatch",
        amountBaht,
        receiverPromptPay: "0000000000",
        transferAt,
        transRef,
        raw: { mock: true, kind },
      };
    }

    if (kind === "api-error") {
      return {
        ok: false,
        ambiguous: true,
        reason: "verifier_unavailable",
        raw: { mock: true, kind },
      };
    }

    const checks = evaluateSlipChecks({
      amountBaht,
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
        amountBaht,
        receiverPromptPay: receiver,
        transferAt,
        transRef,
        raw: { mock: true, kind },
      };
    }

    return {
      ok: true,
      ambiguous: false,
      amountBaht,
      receiverPromptPay: receiver,
      transferAt,
      transRef,
      raw: { mock: true, kind },
    };
  }
}
