/** Thai leading vowels (สระนำ) that appear before the consonant they modify. */
const THAI_LEADING_VOWELS = new Set(["เ", "แ", "โ", "ใ", "ไ"]);

/**
 * Single letter for Team / avatar circles.
 * Prefers the Latin nickname when the label is `ไทย · Latin` (e.g. นัด · Nat → N).
 * Otherwise skips Thai leading vowels and combining marks to the first consonant
 * (แสบ → ส, ไทด์ → ท).
 */
export function barberAvatarInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const latinFromNick = latinNicknameInitial(trimmed);
  if (latinFromNick) return latinFromNick;

  for (const ch of trimmed) {
    if (THAI_LEADING_VOWELS.has(ch)) continue;
    if (/\p{M}/u.test(ch)) continue;
    if (/\s|[·•]/.test(ch)) continue;
    if (/[A-Za-z]/.test(ch)) return ch.toUpperCase();
    if (/\p{L}/u.test(ch)) return ch;
  }
  return "?";
}

function latinNicknameInitial(name: string): string | null {
  // "นัด · Nat" / "แสบ · Saeb" — Latin side after middle-dot/bullet
  const afterSep = name.split(/\s*[·•]\s*/);
  if (afterSep.length >= 2) {
    const nick = afterSep[afterSep.length - 1].trim();
    const m = nick.match(/[A-Za-z]/);
    if (m) return m[0].toUpperCase();
  }
  // Pure Latin given name / nickname
  if (/^[A-Za-z]/.test(name)) {
    return name[0].toUpperCase();
  }
  return null;
}

export function barberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function customerBarberPhotoUrl(barber: {
  profile_image_url?: string | null;
  show_profile_in_booking?: boolean;
}): string | null {
  if (!barber.show_profile_in_booking || !barber.profile_image_url) return null;
  return barber.profile_image_url;
}
