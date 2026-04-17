'use server'

import { requireActiveSubscription } from '@/lib/session'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function dismissOnboarding() {
  const { organizationId } = await requireActiveSubscription()
  await db.organization.update({
    where: { id: organizationId },
    data: { onboardingStatus: 'completed' },
  })
  revalidatePath('/dashboard')
}
