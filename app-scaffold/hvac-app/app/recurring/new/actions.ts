'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/events'
import { createRecurringJobSchema } from '@/lib/validations/recurring-job'

type CreateRecurringJobResult =
  | { success: true; recurringJobId: string }
  | { success: false; error: string }

export async function createRecurringJob(formData: FormData): Promise<CreateRecurringJobResult> {
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

  const raw = {
    customerId: formData.get('customerId'),
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    frequency: formData.get('frequency'),
    nextDueDate: formData.get('nextDueDate'),
  }

  const parsed = createRecurringJobSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const data = parsed.data

  // Validate customer belongs to the organization
  const customer = await db.customer.findFirst({
    where: { id: data.customerId, organizationId, deletedAt: null },
  })
  if (!customer) {
    return { success: false, error: 'Customer not found in your organization' }
  }

  const recurringJob = await db.recurringJob.create({
    data: {
      organizationId,
      customerId: data.customerId,
      title: data.title,
      description: data.description || null,
      frequency: data.frequency,
      nextDueDate: new Date(data.nextDueDate),
      isActive: true,
    },
  })

  await trackEvent({
    organizationId,
    userId,
    eventName: 'recurring_job_created',
    entityType: 'recurring_job',
    entityId: recurringJob.id,
  })

  return { success: true, recurringJobId: recurringJob.id }
}
