import type { ShopLineChannelPublic } from "@/lib/line/shop-channel";

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
