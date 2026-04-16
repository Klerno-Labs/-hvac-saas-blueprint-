import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import { getStripe } from '@/lib/stripe'
import { trackEvent } from '@/lib/events'
import { redirect } from 'next/navigation'

export default async function StripeCallbackPage() {
  const { userId, organizationId } = await requireAuth()

  const org = await db.organization.findUnique({ where: { id: organizationId } })

  if (org?.stripeConnectedAccountId) {
    // Refresh account state from Stripe
    try {
      const stripe = getStripe()
      const account = await stripe.accounts.retrieve(org.stripeConnectedAccountId)

      const chargesEnabled = account.charges_enabled ?? false
      const payoutsEnabled = account.payouts_enabled ?? false

      await db.organization.update({
        where: { id: organizationId },
        data: { stripeChargesEnabled: chargesEnabled, stripePayoutsEnabled: payoutsEnabled },
      })

      if (chargesEnabled && !org.stripeChargesEnabled) {
        await trackEvent({
          organizationId,
          userId,
          eventName: 'stripe_connect_completed',
          entityType: 'organization',
          entityId: organizationId,
        })
      }
    } catch (error) {
      console.error('Failed to refresh Stripe account status:', error)
    }
  }

  redirect('/settings')
}
