import { normalizePromptPayId } from "@/lib/billing/slip-verifier";

/** CRC-16/CCITT-FALSE for PromptPay EMVCo payloads. */
function crc16Ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

/**
 * Build a PromptPay QR payload with optional amount (THB).
 * Uses mobile (tag 01) when id looks like a phone, else national ID (tag 02).
 */
export function buildPromptPayPayload(
  promptPayId: string,
  amountBaht?: number | null,
): string {
  const id = normalizePromptPayId(promptPayId);
  if (!id) throw new Error("INVALID_PROMPTPAY_ID");

  let target: string;
  if (id.length >= 13) {
    target = tlv("02", id);
  } else {
    // Convert 0xxxxxxxxx → 66xxxxxxxxx
    const mobile = id.startsWith("0") ? `66${id.slice(1)}` : id.startsWith("66") ? id : `66${id}`;
    target = tlv("01", mobile);
  }

  const merchant = tlv(
    "29",
    `${tlv("00", "A000000677010111")}${target}`,
  );

  let payload =
    tlv("00", "01") +
    tlv("01", amountBaht != null && amountBaht > 0 ? "12" : "11") +
    merchant +
    tlv("53", "764") +
    tlv("58", "TH");

  if (amountBaht != null && amountBaht > 0) {
    payload += tlv("54", amountBaht.toFixed(2));
  }

  payload += "6304";
  return payload + crc16Ccitt(payload);
}
