import { NextResponse } from "next/server";

export function legacyApiGone(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "GONE",
        message: "This endpoint is deprecated. Use /api/{shop}/... instead.",
      },
    },
    { status: 410 },
  );
}
