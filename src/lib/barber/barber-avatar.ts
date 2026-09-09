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
