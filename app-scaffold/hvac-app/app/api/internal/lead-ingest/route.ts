/**
 * POST /api/internal/lead-ingest
 *
 * Browser-callable bridge that emits one signed `lead.ingest` event to
 * Robert. Called fire-and-forget from the signup flow AFTER the user
 * record is created, so Robert outages never block onboarding UX.
 *
 * Body:
 *   { email: string; plan?: string; source?: string }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { emitEvent } from "@/lib/robert-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().max(320),
  plan: z.string().max(64).optional(),
  source: z.string().max(128).optional(),
});

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "invalid_input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const eventId = randomUUID();
  const result = await emitEvent({
    eventId,
    type: "lead.ingest",
    occurredAt: new Date().toISOString(),
    payload: {
      email: parsed.data.email,
      plan: parsed.data.plan ?? "trial",
      source: parsed.data.source ?? "fieldclose.app/signup",
    },
  });

  if (!result.ok) {
    console.warn("[lead-ingest] upstream not ok:", result.status, result.reason);
  }

  return NextResponse.json(
    { ok: result.ok, eventId, status: result.status, reason: result.reason },
    { status: 200 },
  );
}
