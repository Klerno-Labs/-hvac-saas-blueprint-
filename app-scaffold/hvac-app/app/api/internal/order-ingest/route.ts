/**
 * POST /api/internal/order-ingest
 *
 * Called fire-and-forget from the Stripe webhook AFTER a successful
 * payment is recorded locally. Emits one signed `order.ingest` event
 * to Robert with attribution.
 *
 * Body:
 *   {
 *     stripeInvoiceId: string;
 *     customerId: string;
 *     amountPaid: number;
 *     currency: string;
 *     planId?: string;
 *   }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { emitEvent } from "@/lib/robert-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  stripeInvoiceId: z.string().min(1).max(256),
  customerId: z.string().min(1).max(256),
  amountPaid: z.number().int().nonnegative(),
  currency: z.string().min(3).max(8),
  planId: z.string().max(128).optional(),
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
    type: "order.ingest",
    occurredAt: new Date().toISOString(),
    payload: {
      stripeInvoiceId: parsed.data.stripeInvoiceId,
      customerId: parsed.data.customerId,
      amountPaid: parsed.data.amountPaid,
      currency: parsed.data.currency,
      planId: parsed.data.planId ?? "unknown",
      source: "fieldclose.com/stripe-webhook",
    },
  });

  if (!result.ok) {
    console.warn("[order-ingest] upstream not ok:", result.status, result.reason);
  }

  return NextResponse.json({ ok: result.ok, eventId }, { status: 200 });
}
