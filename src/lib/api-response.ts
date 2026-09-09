import { NextResponse } from "next/server";
import { EnvConfigError } from "@/lib/env";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export function jsonError(error: unknown): NextResponse {
  if (error instanceof BookingError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }
  if (error instanceof EnvConfigError) {
    return NextResponse.json(
      { error: { code: "CONFIG", message: error.message } },
      { status: 500 },
    );
  }
  console.error(error);
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "Internal server error" } },
    { status: 500 },
  );
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new BookingError("INVALID_JSON", "Request body must be JSON", 400);
  }
}
