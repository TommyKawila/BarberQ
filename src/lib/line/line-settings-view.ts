import type { ShopLineChannelPublic } from "@/lib/line/shop-channel";
import type { ConnectionTestResult } from "@/lib/line/connection-test";

export type LineSettingsView = "checklist" | "keys" | "connected" | "error";

/**
 * Decide which LINE settings surface to show after load / test.
 * Keyless shops that only failed a MISSING_KEYS probe must stay on the
 * setup wizard (checklist), not auto-jump to manual key entry.
 */
export function resolveLineSettingsView(
  channel: ShopLineChannelPublic | null | undefined,
): LineSettingsView {
  if (!channel) return "checklist";
  if (channel.status === "verified") return "connected";

  const hasAnyKey = Boolean(
    channel.hasSecret ||
      channel.hasAccessToken ||
      channel.messagingChannelId?.trim(),
  );

  if (channel.status === "broken") {
    // Failed empty-key test created a broken row with no secrets — keep wizard.
    if (!hasAnyKey) return "checklist";
    return "error";
  }

  if (channel.hasSecret || channel.hasAccessToken) return "keys";
  return "checklist";
}

/**
 * Show the latest failed connection test above the wizard when a keyless
 * shop stays on checklist (so ✗ Channel ID / Secret / Token remain visible).
 * Reload clears in-memory testResult → no auto-redirect / no sticky error.
 */
export function shouldShowLineTestErrorOnChecklist(
  view: LineSettingsView,
  testResult: Pick<ConnectionTestResult, "ok"> | null | undefined,
): boolean {
  return view === "checklist" && Boolean(testResult && !testResult.ok);
}
