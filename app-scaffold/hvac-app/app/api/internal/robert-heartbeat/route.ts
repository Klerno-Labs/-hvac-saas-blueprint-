/**
 * GET /api/internal/robert-heartbeat
 *
 * Vercel-cron-triggered health ping from FieldClose to Robert. Fires every
 * 10 minutes (see vercel.json). Always returns 200 so Vercel Cron does
 * not mark the job as failed on a transient Robert blip — the JSON
 * body's `ok: false` is the silent signal.
 */

import { NextResponse } from "next/server";
import { heartbeat, type RobertSendResult } from "@/lib/robert-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const result: RobertSendResult = await heartbeat("ok");

  if (!result.ok) {
    console.warn("[robert-heartbeat] upstream not ok:", result.status, result.reason);
  }

  return NextResponse.json(
    {
      ok: result.ok,
      upstream: { status: result.status, reason: result.reason },
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
