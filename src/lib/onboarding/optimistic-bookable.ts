export function applyOptimisticToggle(current: boolean): boolean {
  return !current;
}

export function rollbackOptimisticToggle(previous: boolean): boolean {
  return previous;
}

export function shouldShowOwnerSlotDuration(ownerBookable: boolean): boolean {
  return ownerBookable;
}
