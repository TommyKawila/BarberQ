import { randomBytes } from "crypto";

export const STAFF_SEED = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "Saeb",
    role: "super_admin" as const,
    token: "saeb_admin_xyz123",
    barber_id: "11111111-1111-4111-8111-111111111111",
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    name: "Tide",
    role: "barber" as const,
    token: "tide_admin_abc456",
    barber_id: "22222222-2222-4222-8222-222222222222",
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    name: "Nat",
    role: "barber" as const,
    token: "nat_admin_def789",
    barber_id: "33333333-3333-4333-8333-333333333333",
  },
] as const;

export function generateStaffToken(): string {
  return randomBytes(32).toString("base64url");
}
