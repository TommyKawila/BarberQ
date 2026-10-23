/**
 * Thai PromptPay EMVCo QR payload (Tag 29) + CRC16-CCITT.
 * Target ID comes ONLY from server env BARBERQ_PROMPTPAY_ID — never hardcode real IDs.
 */

/** Labeled fake example for unit tests only — not a real PromptPay target. */
export const EXAMPLE_PROMPTPAY_ID = "0000000000000"; // example (fake 13-digit)

export const PROMPTPAY_ENV_KEY = "BARBERQ_PROMPTPAY_ID";

export function getPromptPayIdFromEnv(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const raw = env[PROMPTPAY_ENV_KEY]?.trim();
  return raw || null;
}

function tlv(id: string, value: string): string {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
}

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — EMVCo QR. */
export function crc16CcittFalse(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Normalize PromptPay ID:
 * - 10-digit mobile starting with 0 → 0066 + rest
 * - 13-digit tax/national ID → as-is
 * - already 0066… → as-is
 */
export function normalizePromptPayTarget(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return `0066${digits.slice(1)}`;
  }
  if (digits.startsWith("0066") && digits.length >= 13) {
    return digits;
  }
  if (digits.length === 13) {
    return digits;
  }
  throw new Error("INVALID_PROMPTPAY_ID");
}

export function formatPromptPayAmount(amountThb: number): string {
  if (!Number.isFinite(amountThb) || amountThb <= 0) {
    throw new Error("INVALID_AMOUNT");
  }
  return amountThb.toFixed(2);
}

/**
 * Build EMVCo PromptPay payload with exact amount.
 * @see BOT / EMVCo Merchant Presented Mode
 */
export function buildPromptPayPayload(
  promptPayId: string,
  amountThb: number,
): string {
  const target = normalizePromptPayTarget(promptPayId);
  const amount = formatPromptPayAmount(amountThb);

  const merchantInfo =
    tlv("00", "A000000677010111") + // PromptPay AID
    tlv("01", target);

  const body =
    tlv("00", "01") +
    tlv("01", "12") + // dynamic
    tlv("29", merchantInfo) +
    tlv("53", "764") +
    tlv("54", amount) +
    tlv("58", "TH");

  const withCrcPlaceholder = `${body}6304`;
  const crc = crc16CcittFalse(withCrcPlaceholder);
  return `${withCrcPlaceholder}${crc}`;
}
