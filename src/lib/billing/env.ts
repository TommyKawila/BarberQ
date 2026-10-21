function read(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

/** PromptPay id (phone 0xxxxxxxxx or national ID). */
export function getOptionalPromptPayId(): string | undefined {
  return read("PROMPTPAY_ID");
}

export function getSlipVerifierName(): string {
  return read("SLIP_VERIFIER") ?? "mock";
}

/** Tommy's personal LINE user id for operator alerts (ClipperQ OA push). */
export function getOptionalOperatorLineUserId(): string | undefined {
  return read("OPERATOR_LINE_USER_ID");
}

/**
 * Prefer ClipperQ platform OA token for operator pushes.
 * Falls back to deprecated LINE_CHANNEL_ACCESS_TOKEN.
 */
export function getOptionalOperatorLineToken(): string | undefined {
  return (
    read("CLIPPERQ_LINE_CHANNEL_ACCESS_TOKEN") ??
    read("LINE_CHANNEL_ACCESS_TOKEN")
  );
}
