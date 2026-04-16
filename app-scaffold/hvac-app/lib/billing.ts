import { getStripe } from '@/lib/stripe'
import { db } from '@/lib/db'

export const PLANS = {
  starter: {
    name: 'Starter',
    priceMonthly: 4900, // $49/month in cents
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || '',
    features: ['Unlimited customers', 'Unlimited jobs', 'AI estimate drafting', 'Invoice & payment collection', 'Customer portal'],
  },
  pro: {
    name: 'Pro',
    priceMonthly: 9900, // $99/month in cents
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || '',
    features: ['Everything in Starter', 'Collections automation', 'Accounting sync', 'Team members', 'Priority support'],
  },
} as const

export type PlanId = keyof typeof PLANS

/**
 * Create a Stripe Checkout session for subscription billing.
 * This charges the platform (us), not the connected account.
 */
export async function createSubscriptionCheckout(params: {
  organizationId: string
  planId: PlanId
  userEmail: string
}): Promise<{ url: string } | { error: string }> {
  const plan = PLANS[params.planId]
  if (!plan || !plan.stripePriceId) {
    return { error: `Subscription plan ${params.planId} is not configured. Set STRIPE_${params.planId.toUpperCase()}_PRICE_ID in env.` }
  }

  const stripe = getStripe()
  const appUrl = process.env.APP_URL || 'http://localhost:3000'

  const org = await db.organization.findUnique({ where: { id: params.organizationId } })
  if (!org) return { error: 'Organization not found' }

  // If org already has a subscription, redirect to billing portal
  if (org.subscriptionStripeId) {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: org.subscriptionStripeId,
      return_url: `${appUrl}/settings`,
    })
    return { url: portalSession.url }
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${appUrl}/settings?subscribed=true`,
    cancel_url: `${appUrl}/settings/billing`,
    customer_email: params.userEmail,
    metadata: {
      organizationId: params.organizationId,
      planId: params.planId,
    },
    subscription_data: {
      metadata: {
        organizationId: params.organizationId,
        planId: params.planId,
      },
    },
  })

  return { url: session.url! }
}

/**
 * Check if an organization has an active subscription or is in trial.
 */
export function isSubscriptionActive(org: { subscriptionStatus: string; trialEndsAt: Date | null }): boolean {
  if (org.subscriptionStatus === 'active') return true
  if (org.subscriptionStatus === 'trialing') {
    if (!org.trialEndsAt) return true // no trial end set = unlimited trial (beta)
    return org.trialEndsAt > new Date()
  }
  return false
}
