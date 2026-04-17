'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/events'
import { revalidatePath } from 'next/cache'

type ToggleResult =
  | { success: true; isActive: boolean }
  | { success: false; error: string }

export async function toggleRecurringJob(recurringId: string): Promise<ToggleResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  const userId = session.user.id

  const membership = await db.organizationMember.findFirst({
    where: { userId },
  })
  if (!membership) {
    return { success: false, error: 'You must belong to an organization' }
  }

  const organizationId = membership.organizationId

  const recurringJob = await db.recurringJob.findFirst({
    where: { id: recurringId, organizationId },
  })
  if (!recurringJob) {
    return { success: false, error: 'Recurring job not found' }
  }

  const updated = await db.recurringJob.update({
    where: { id: recurringId },
    data: { isActive: !recurringJob.isActive },
  })

  await trackEvent({
    organizationId,
    userId,
    eventName: updated.isActive ? 'recurring_job_activated' : 'recurring_job_deactivated',
    entityType: 'recurring_job',
    entityId: recurringId,
  })

  revalidatePath(`/recurring/${recurringId}`)
  revalidatePath('/recurring')

  return { success: true, isActive: updated.isActive }
}
