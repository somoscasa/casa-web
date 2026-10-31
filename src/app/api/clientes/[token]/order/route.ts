import { NextResponse } from "next/server";

// Gallery print orders are paused (CASA doesn't offer printing right now); the code is in git history.
export async function POST() {
  return NextResponse.json({ error: "store_disabled" }, { status: 410 });
}
