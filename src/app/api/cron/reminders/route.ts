import { NextResponse } from "next/server";
import { processDueReminders } from "@/lib/reminders/process-due";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function assertCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    // Allow in non-production so local/dev can hit the route; production must set CRON_SECRET.
    return process.env.NODE_ENV !== "production";
  }
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

/**
 * Vercel Cron — scan due appointment reminders.
 * Hobby: vercel.json uses daily "0 1 * * *" (once/day limit).
 * Pro (launch): change schedule to every 5 minutes ("star-slash-5 * * * *").
 */
export async function GET(req: Request) {
  if (!assertCronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDueReminders(new Date());
    console.info(JSON.stringify({ event: "cron_reminders", ...result }));
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error(
      JSON.stringify({
        event: "cron_reminders_failed",
        message: err instanceof Error ? err.message : "unknown",
      }),
    );
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
