import type { ShopManagerInvite } from "@/lib/data/types";

export type PublicManagerInviteStatus =
  | "pending"
  | "expired"
  | "consumed"
  | "revoked";

export function publicManagerInviteStatus(
  invite: Pick<ShopManagerInvite, "expiresAt" | "consumedAt" | "revokedAt">,
  now = Date.now(),
): PublicManagerInviteStatus {
  if (invite.revokedAt) return "revoked";
  if (invite.consumedAt) return "consumed";
  if (new Date(invite.expiresAt).getTime() < now) return "expired";
  return "pending";
}

export function toPublicManagerInvite(invite: ShopManagerInvite) {
  return {
    id: invite.id,
    status: publicManagerInviteStatus(invite),
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
  };
}

export function toPublicManager(manager: {
  id: string;
  displayName: string;
  createdAt: string;
  revokedAt: string | null;
}) {
  return {
    id: manager.id,
    displayName: manager.displayName,
    createdAt: manager.createdAt,
    active: manager.revokedAt == null,
  };
}
