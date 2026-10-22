function read(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

/** Tommy's personal LINE user id for operator alerts (ClipperQ OA push). */
export function getOptionalOperatorLineUserId(): string | undefined {
  return read("OPERATOR_LINE_USER_ID");
}

/**
 * Prefer ClipperQ platform OA token for operator / owner support pushes.
 * Falls back to deprecated LINE_CHANNEL_ACCESS_TOKEN.
 */
export function getOptionalClipperqLineToken(): string | undefined {
  return (
    read("CLIPPERQ_LINE_CHANNEL_ACCESS_TOKEN") ??
    read("LINE_CHANNEL_ACCESS_TOKEN")
  );
}

export function getAppVersionLabel(): string {
  return (
    read("NEXT_PUBLIC_APP_VERSION") ??
    read("VERCEL_GIT_COMMIT_SHA")?.slice(0, 7) ??
    "dev"
  );
}
