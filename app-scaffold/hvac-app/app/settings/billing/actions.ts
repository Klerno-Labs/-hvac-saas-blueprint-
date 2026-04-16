'use server'

import { requireAdmin } from '@/lib/require-admin'
import { createSubscriptionCheckout, type PlanId } from '@/lib/billing'

export async function subscribe(planId: string, userEmail: string): Promise<{ url: string } | { error: string }> {
  const adminResult = await requireAdmin()
  if (!adminResult.authorized) return { error: adminResult.error }

  return createSubscriptionCheckout({
    organizationId: adminResult.context.organizationId,
    planId: planId as PlanId,
    userEmail,
  })
}
