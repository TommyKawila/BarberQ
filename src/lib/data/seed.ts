export const BARBER_SEED = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Saeb",
    slot_duration_minutes: 30,
    off_days: [] as number[],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Tide",
    slot_duration_minutes: 45,
    off_days: [1],
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Nat",
    slot_duration_minutes: 60,
    off_days: [4],
  },
] as const;
