'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/events'
import { createOrganizationSchema } from '@/lib/validations/onboarding'

type OnboardingResult =
  | { success: true; organizationId: string }
  | { success: false; error: string }

export async function createOrganization(formData: FormData): Promise<OnboardingResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  const userId = session.user.id

  // Check if user already has an organization
  const existingMembership = await db.organizationMember.findFirst({
    where: { userId },
  })
  if (existingMembership) {
    return { success: false, error: 'You already belong to an organization' }
  }

  const raw = {
    name: formData.get('name'),
    phone: formData.get('phone') || undefined,
    email: formData.get('email') || undefined,
    timezone: formData.get('timezone') || undefined,
  }

  const parsed = createOrganizationSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { name, phone, email, timezone } = parsed.data

  // Fire onboarding_started before the create
  await trackEvent({
    userId,
    eventName: 'organization_onboarding_started',
    entityType: 'user',
    entityId: userId,
  })

  // Create organization + owner membership in a transaction
  const organization = await db.$transaction(async (tx) => {
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    const org = await tx.organization.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        timezone: timezone || null,
        onboardingStatus: 'completed',
        trialEndsAt,
      },
    })

    await tx.organizationMember.create({
      data: {
        organizationId: org.id,
        userId,
        role: 'owner',
        acceptedAt: new Date(),
      },
    })

    return org
  })

  await trackEvent({
    organizationId: organization.id,
    userId,
    eventName: 'organization_onboarding_completed',
    entityType: 'organization',
    entityId: organization.id,
  })

  return { success: true, organizationId: organization.id }
}
