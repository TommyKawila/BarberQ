import {
  FOUNDER_QA_HOURS,
  FOUNDER_QA_MANIFEST,
} from "@/lib/founder-qa/manifest";

export function ordinaryBarberFixtures() {
  const { johnny, peter, jack } = FOUNDER_QA_MANIFEST.barbers;
  return [johnny, peter, jack].map((barber) => ({
    id: barber.id,
    name: barber.name,
    role: "barber" as const,
    slotDuration: 30,
    offDays: [] as number[],
    isActive: true,
    isBookable: true,
  }));
}

export function hoursMatch(actual: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(FOUNDER_QA_HOURS);
}
