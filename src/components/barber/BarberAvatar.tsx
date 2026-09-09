"use client";

import { barberInitials } from "@/lib/barber/barber-avatar";

const SIZES = {
  sm: "h-10 w-10 text-xs",
  md: "h-14 w-14 text-sm",
  lg: "h-16 w-16 text-base",
} as const;

export function BarberAvatar({
  name,
  imageUrl,
  size = "md",
}: {
  name: string;
  imageUrl?: string | null;
  size?: keyof typeof SIZES;
}) {
  const sizeClass = SIZES[size];
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClass} shrink-0 rounded-full object-cover bg-zinc-800`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-zinc-800 font-semibold text-amber-300`}
      aria-hidden
    >
      {barberInitials(name)}
    </div>
  );
}
