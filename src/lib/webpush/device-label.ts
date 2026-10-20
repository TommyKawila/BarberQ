/** Label for this device — iPadOS often reports as Macintosh + touch. */
export function deviceLabelFromUa(ua: string, maxTouchPoints = 0): string {
  const isIpadOs =
    /iPad/i.test(ua) || (/Macintosh/i.test(ua) && maxTouchPoints > 1);
  if (isIpadOs) return "iPad Safari";
  if (/iPhone/i.test(ua)) return "iPhone Safari";
  if (/Android/i.test(ua) && /Chrome/i.test(ua)) return "Android Chrome";
  if (/Mac/i.test(ua) && /Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Mac Safari";
  if (/Chrome/i.test(ua)) return "Chrome";
  return "Browser";
}
