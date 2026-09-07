import type { AppointmentStatus } from "@/types/booking";

const OCCUPYING: AppointmentStatus[] = ["confirmed", "completed", "no_show"];
const BLOCKING: AppointmentStatus[] = ["confirmed", "completed"];

export function isOccupyingStatus(status: AppointmentStatus): boolean {
  return OCCUPYING.includes(status);
}

export function isBlockingStatus(status: AppointmentStatus): boolean {
  return BLOCKING.includes(status);
}

export type AppointmentOutcome = "completed" | "no_show";
