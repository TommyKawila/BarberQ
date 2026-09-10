import type { MessageKey } from "@/lib/i18n/dictionary";

export function isBarberBookable(barber: { is_bookable?: boolean }): boolean {
  return barber.is_bookable !== false;
}

export function applyOptimisticBookable(current: boolean): boolean {
  return !current;
}

export function rollbackOptimisticBookable(previous: boolean): boolean {
  return previous;
}

export function canToggleBookable(pending: boolean): boolean {
  return !pending;
}

export function getQueueStatusLabelKey(bookable: boolean): MessageKey {
  return bookable ? "admin.queueOpen" : "admin.queueClosed";
}

export function getQueueStatusHintKey(bookable: boolean): MessageKey {
  return bookable ? "admin.queueOpenHint" : "admin.queueClosedHint";
}

export function shouldShowRemoveMenu(role: string | undefined): boolean {
  return role !== "owner";
}

export function updateBarberBookableInList<T extends { id: string; is_bookable?: boolean }>(
  barbers: T[],
  barberId: string,
  isBookable: boolean,
): T[] {
  return barbers.map((barber) =>
    barber.id === barberId ? { ...barber, is_bookable: isBookable } : barber,
  );
}
