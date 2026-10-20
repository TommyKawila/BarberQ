import type { BarberLineInvite } from "@/lib/data/types";

export type PublicBarberLineInviteStatus =
  | "pending"
  | "expired"
  | "consumed"
  | "revoked";

export function publicBarberLineInviteStatus(
  invite: Pick<BarberLineInvite, "expiresAt" | "consumedAt" | "revokedAt">,
  now = Date.now(),
): PublicBarberLineInviteStatus {
  if (invite.revokedAt) return "revoked";
  if (invite.consumedAt) return "consumed";
  if (new Date(invite.expiresAt).getTime() < now) return "expired";
  return "pending";
}

/** Public invite payload — never includes the raw token. */
export function toPublicBarberLineInvite(invite: BarberLineInvite) {
  return {
    id: invite.id,
    status: publicBarberLineInviteStatus(invite),
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
  };
}

export type BarberLineLinkCardStatus = "unlinked" | "pending" | "linked";

export function barberLineLinkCardStatus(input: {
  lineId: string | null | undefined;
  pendingInvite: Pick<BarberLineInvite, "expiresAt" | "consumedAt" | "revokedAt"> | null;
  now?: number;
}): BarberLineLinkCardStatus {
  if (input.lineId?.trim()) return "linked";
  if (
    input.pendingInvite &&
    publicBarberLineInviteStatus(input.pendingInvite, input.now) === "pending"
  ) {
    return "pending";
  }
  return "unlinked";
}
