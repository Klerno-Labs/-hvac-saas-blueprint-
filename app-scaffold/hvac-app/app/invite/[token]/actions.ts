'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/events'

type Result = { success: true } | { success: false; error: string }

export async function acceptInvite(token: string): Promise<Result> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'You must be logged in' }

  const invite = await db.teamInvite.findUnique({ where: { token } })
  if (!invite) return { success: false, error: 'Invalid invitation' }
  if (invite.acceptedAt) return { success: false, error: 'This invitation has already been accepted' }
  if (invite.expiresAt < new Date()) return { success: false, error: 'This invitation has expired' }

  // Check if user already in this org
  const existing = await db.organizationMember.findFirst({
    where: { userId: session.user.id, organizationId: invite.organizationId },
  })
  if (existing) return { success: false, error: 'You are already a member of this organization' }

  await db.$transaction([
    db.organizationMember.create({
      data: {
        organizationId: invite.organizationId,
        userId: session.user.id,
        role: invite.role,
        acceptedAt: new Date(),
      },
    }),
    db.teamInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ])

  await trackEvent({
    organizationId: invite.organizationId,
    userId: session.user.id,
    eventName: 'team_member_joined',
    entityType: 'organization_member',
  })

  return { success: true }
}
