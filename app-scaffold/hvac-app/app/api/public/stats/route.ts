/**
 * GET /api/public/stats
 *
 * Public, unauthenticated social-proof endpoint. Returns fleet-wide
 * totals across every organization on the platform:
 *
 *   { jobsCompleted, customersServed, generatedAt }
 *
 * Intentional choices:
 *   · Global counts, not per-tenant. This is marketing copy fodder,
 *     not operator data. No `organizationId` ever appears in the
 *     response.
 *   · Cached at the CDN for 1 hour (s-maxage=3600) with a 24-hour
 *     stale-while-revalidate window. The underlying numbers change
 *     slowly and don't need to be second-fresh.
 *   · `runtime=nodejs` because the Prisma client is not edge-ready.
 *
 * Consumed by: fieldclose-web's homepage widget (PR-EXT-3) via the
 * satellite's signed read client.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const [jobsCompleted, customersServed] = await Promise.all([
    db.job.count({ where: { status: "completed" } }),
    db.customer.count(),
  ]);

  return NextResponse.json(
    {
      jobsCompleted,
      customersServed,
      generatedAt: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
