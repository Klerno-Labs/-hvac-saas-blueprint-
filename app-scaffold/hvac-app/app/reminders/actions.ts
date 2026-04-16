'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/events'
import { REMINDER_STATUSES } from '@/lib/validations/reminder'

type ActionResult =
  | { success: true }
  | { success: false; error: string }

export async function updateReminderStatus(
  reminderId: string,
  status: string,
): Promise<ActionResult> {
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

  if (!REMINDER_STATUSES.includes(status as typeof REMINDER_STATUSES[number])) {
    return { success: false, error: 'Invalid reminder status' }
  }

  const reminder = await db.reminder.findFirst({
    where: { id: reminderId, organizationId },
  })
  if (!reminder) {
    return { success: false, error: 'Reminder not found in your organization' }
  }

  await db.reminder.update({
    where: { id: reminderId },
    data: { status },
  })

  const eventName = status === 'completed' ? 'reminder_completed' : 'reminder_dismissed'
  await trackEvent({
    organizationId,
    userId,
    eventName,
    entityType: 'reminder',
    entityId: reminderId,
  })

  return { success: true }
}
