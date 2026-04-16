import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

/**
 * Returns the current authenticated user and their organization context.
 * Redirects to /login if not authenticated.
 * Redirects to /onboarding if authenticated but no organization membership exists.
 */
export async function requireAuth() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const userId = session.user.id

  const membership = await db.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
  })

  if (!membership) {
    redirect('/onboarding')
  }

  return {
    userId,
    user: session.user,
    organizationId: membership.organizationId,
    organization: membership.organization,
    role: membership.role,
  }
}

/**
 * Returns session if authenticated, null otherwise.
 * Does not redirect — useful for pages that show different content
 * based on auth state (e.g. landing page).
 */
export async function getOptionalSession() {
  const session = await auth()
  if (!session?.user?.id) return null

  const membership = await db.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  })

  return {
    userId: session.user.id,
    user: session.user,
    membership,
  }
}
