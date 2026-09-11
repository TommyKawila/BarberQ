export type LineFriendship = "unknown" | "friend" | "not_friend";

export function shouldShowLineReminder(
  addFriendUrl: string | null | undefined,
  friendship: LineFriendship,
): boolean {
  if (!addFriendUrl?.trim()) return false;
  return friendship !== "friend";
}
