import { getOptionalSession } from '@/lib/session'
import { getTrialDaysRemaining } from '@/lib/subscription'
import { TrialBanner } from './trial-banner'

/**
 * Server component that checks the current user's org trial status
 * and renders a banner when the trial has 7 or fewer days remaining.
 */
export async function TrialBannerWrapper() {
  const session = await getOptionalSession()
  if (!session?.membership?.organization) return null

  const org = session.membership.organization
  const daysRemaining = getTrialDaysRemaining(org)

  if (daysRemaining === null || daysRemaining > 7) return null

  return <TrialBanner daysRemaining={daysRemaining} />
}
