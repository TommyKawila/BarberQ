export function isBarberActive(barber: { is_active?: boolean }): boolean {
  return barber.is_active !== false;
}

export function isBarberOpenForQueue(barber: { is_bookable?: boolean }): boolean {
  return barber.is_bookable !== false;
}

export function selectAdminBoardBarbers<T extends {
  id: string;
  is_active?: boolean;
  is_bookable?: boolean;
}>(
  barbers: T[],
  bookedBarberIds: ReadonlySet<string>,
  includeClosedQueue: boolean,
): T[] {
  return barbers.filter((barber) => {
    if (!isBarberActive(barber)) return false;
    if (isBarberOpenForQueue(barber)) return true;
    return bookedBarberIds.has(barber.id) || includeClosedQueue;
  });
}
