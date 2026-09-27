import type { ShopHours } from "@/lib/shop/shop-hours";

/** Checked-in Founder QA identity. Not secrets. Do not derive the allowlist from runtime env. */
export const FOUNDER_QA_MANIFEST = {
  fixtureVersion: "fqa-fixtures-v1",
  qaSupabaseProjectRef: "unprovisioned-founder-qa",
  qaAppHostname: "unprovisioned-founder-qa.example.invalid",
  shop: {
    id: "c0a1b2c3-d4e5-4f60-8a11-00000000f001",
    name: "BarberQ Pilot Test",
    slug: "barberqpilottest",
  },
  sentinel: {
    id: "c0a1b2c3-d4e5-4f60-8a11-00000000f002",
    name: "BarberQ Isolation Sentinel",
    slug: "barberqisolationsentinel",
  },
  barbers: {
    johnny: {
      id: "c0a1b2c3-d4e5-4f60-8a11-00000000b001",
      name: "Johnny",
    },
    peter: {
      id: "c0a1b2c3-d4e5-4f60-8a11-00000000b002",
      name: "Peter",
    },
    jack: {
      id: "c0a1b2c3-d4e5-4f60-8a11-00000000b003",
      name: "Jack",
    },
  },
  sentinelBarber: {
    id: "c0a1b2c3-d4e5-4f60-8a11-00000000b101",
    name: "Sentinel Barber",
  },
  productionDenylist: {
    supabaseProjectRef: "lbnlsdkpajvczndodvjn",
    appHostname: "barber-q-pi.vercel.app",
  },
  phinx: {
    id: "00000000-0000-0000-0000-000000000001",
    name: "PHINX STUDIO",
    slug: "phinxstudio",
  },
} as const;

export type FounderQaManifest = typeof FOUNDER_QA_MANIFEST;

export const FOUNDER_QA_HOURS: ShopHours = [
  { closed: false, open: "10:00", close: "20:00" },
  { closed: false, open: "10:30", close: "20:00" },
  { closed: false, open: "10:30", close: "20:00" },
  { closed: false, open: "10:30", close: "20:00" },
  { closed: false, open: "10:30", close: "20:00" },
  { closed: false, open: "10:30", close: "20:00" },
  { closed: false, open: "10:00", close: "20:00" },
];
