import { staffLoginRedirect } from "@/lib/admin/login-redirect";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return staffLoginRedirect(req, "saeb");
}
