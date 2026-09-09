import { legacyApiGone } from "@/lib/auth/legacy-gone";

export const runtime = "nodejs";

export async function GET() {
  return legacyApiGone();
}

export async function PUT() {
  return legacyApiGone();
}
