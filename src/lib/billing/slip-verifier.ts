export interface SlipVerifyRequest {
  /** Raw slip image bytes */
  image: Buffer;
  contentType: string;
  /** Expected transfer amount in THB (whole baht) */
  expectedAmountBaht: number;
  /** Our PromptPay id (phone or national ID), digits only preferred */
  expectedPromptPayId: string;
  /** Reject transfers older than this many minutes (default 24h) */
  maxAgeMinutes?: number;
}

export interface SlipVerifySuccess {
  ok: true;
  ambiguous: false;
  amountBaht: number;
  receiverPromptPay: string;
  transferAt: string;
  transRef: string;
  raw?: unknown;
}

export interface SlipVerifyAmbiguous {
  ok: false;
  ambiguous: true;
  reason: string;
  amountBaht?: number;
  receiverPromptPay?: string;
  transferAt?: string;
  transRef?: string;
  raw?: unknown;
}

export interface SlipVerifyFail {
  ok: false;
  ambiguous: false;
  reason: string;
  amountBaht?: number;
  receiverPromptPay?: string;
  transferAt?: string;
  transRef?: string;
  raw?: unknown;
}

export type SlipVerifyResult = SlipVerifySuccess | SlipVerifyAmbiguous | SlipVerifyFail;

export interface SlipVerifier {
  readonly name: string;
  verify(req: SlipVerifyRequest): Promise<SlipVerifyResult>;
}

export function normalizePromptPayId(value: string): string {
  return value.replace(/\D/g, "");
}

export function promptPayIdsMatch(a: string, b: string): boolean {
  const na = normalizePromptPayId(a);
  const nb = normalizePromptPayId(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Compare last 9–10 digits (phone vs +66)
  const ta = na.slice(-9);
  const tb = nb.slice(-9);
  return ta.length >= 9 && ta === tb;
}

export function isTransferRecent(
  transferAtIso: string,
  now: Date = new Date(),
  maxAgeMinutes = 24 * 60,
): boolean {
  const t = new Date(transferAtIso).getTime();
  if (Number.isNaN(t)) return false;
  const ageMs = now.getTime() - t;
  if (ageMs < -5 * 60_000) return false; // >5 min in the future
  return ageMs <= maxAgeMinutes * 60_000;
}

export function evaluateSlipChecks(input: {
  amountBaht: number;
  expectedAmountBaht: number;
  receiverPromptPay: string;
  expectedPromptPayId: string;
  transferAt: string;
  transRef: string;
  maxAgeMinutes?: number;
  now?: Date;
}): { pass: true } | { pass: false; ambiguous: boolean; reason: string } {
  if (!input.transRef?.trim()) {
    return { pass: false, ambiguous: true, reason: "missing_trans_ref" };
  }
  if (input.amountBaht !== input.expectedAmountBaht) {
    return { pass: false, ambiguous: false, reason: "amount_mismatch" };
  }
  if (!promptPayIdsMatch(input.receiverPromptPay, input.expectedPromptPayId)) {
    return { pass: false, ambiguous: false, reason: "receiver_mismatch" };
  }
  if (!isTransferRecent(input.transferAt, input.now, input.maxAgeMinutes)) {
    return { pass: false, ambiguous: false, reason: "transfer_too_old" };
  }
  return { pass: true };
}
