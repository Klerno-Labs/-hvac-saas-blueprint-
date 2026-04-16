import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

type AdminContext = {
  userId: string
  userEmail: string | null
  organizationId: string
  role: string
}

type AdminResult =
  | { authorized: true; context: AdminContext }
  | { authorized: false; error: string }

/**
 * Verify the current user is authenticated AND has an admin-level role (owner)
 * in their organization. Use this for sensitive actions like:
 * - changing organization settings
 * - managing integrations (Stripe, accounting)
 * - revoking portal tokens
 * - changing collections policy
 */
export async function requireAdmin(): Promise<AdminResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { authorized: false, error: 'You must be logged in' }
  }

  const userId = session.user.id
  const userEmail = session.user.email ?? null

  const membership = await db.organizationMember.findFirst({
    where: { userId },
  })
  if (!membership) {
    return { authorized: false, error: 'You must belong to an organization' }
  }

  if (membership.role !== 'owner') {
    return { authorized: false, error: 'Only organization owners can perform this action' }
  }

  return {
    authorized: true,
    context: {
      userId,
      userEmail,
      organizationId: membership.organizationId,
      role: membership.role,
    },
  }
}
