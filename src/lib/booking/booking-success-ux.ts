export function shouldShowLineReminder(
  addFriendUrl: string | null | undefined,
  alreadyFriend: boolean,
): boolean {
  if (!addFriendUrl?.trim()) return false;
  if (alreadyFriend) return false;
  return true;
}
