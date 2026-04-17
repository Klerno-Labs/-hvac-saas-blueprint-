'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

export async function requestReview(jobId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Not authenticated.' }
  }

  // Look up membership for org scoping
  const membership = await db.organizationMember.findFirst({
    where: { userId: session.user.id },
  })

  if (!membership) {
    return { error: 'No organization membership found.' }
  }

  const organizationId = membership.organizationId

  // Verify job belongs to org
  const job = await db.job.findFirst({
    where: { id: jobId, organizationId },
    select: { id: true, customerId: true, status: true },
  })

  if (!job) {
    return { error: 'Job not found.' }
  }

  if (job.status !== 'completed') {
    return { error: 'Job must be completed before requesting a review.' }
  }

  // Check if review already exists
  const existing = await db.customerReview.findUnique({
    where: { jobId },
  })

  if (existing) {
    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    return { url: `${appUrl}/reviews/${existing.token}` }
  }

  // Create review with token
  const token = randomBytes(32).toString('hex')
  await db.customerReview.create({
    data: {
      organizationId,
      jobId,
      customerId: job.customerId,
      rating: 0, // placeholder until submitted
      token,
    },
  })

  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  return { url: `${appUrl}/reviews/${token}` }
}
