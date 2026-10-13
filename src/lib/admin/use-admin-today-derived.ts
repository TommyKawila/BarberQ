"use client";

import { useMemo } from "react";
import {
  computeBoardMiniStats,
  listFreeBarbersNow,
  type BoardMiniStats,
  type FreeBarberNow,
} from "@/lib/admin/free-barbers";
import type { ShopActivation } from "@/lib/onboarding/activation";
import type { AdminColumn } from "@/types/booking";

export interface AdminTodayDerived {
  freeNow: FreeBarberNow[];
  mini: BoardMiniStats;
  hasBookingsToday: boolean;
  setupIncomplete: boolean;
}

/**
 * Derived Today-board values. Must always be called unconditionally
 * (never after an auth early-return) to avoid React error #310.
 */
export function useAdminTodayDerived(
  columns: AdminColumn[],
  isToday: boolean,
  activation: ShopActivation | null,
): AdminTodayDerived {
  const freeNow = useMemo(
    () => (isToday ? listFreeBarbersNow(columns) : []),
    [columns, isToday],
  );
  const mini = useMemo(() => computeBoardMiniStats(columns), [columns]);
  const hasBookingsToday = useMemo(
    () => columns.some((col) => (col.slots ?? []).some((slot) => slot.kind === "booked")),
    [columns],
  );
  const setupIncomplete = Boolean(
    activation && (!activation.teamOk || !activation.hoursOk || !activation.ready),
  );
  return { freeNow, mini, hasBookingsToday, setupIncomplete };
}
