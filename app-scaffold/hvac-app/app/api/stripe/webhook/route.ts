import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/events'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing webhook configuration' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      default:
        // Unhandled event type — log but don't fail
        console.log(`Unhandled webhook event type: ${event.type}`)
    }

    await trackEvent({
      eventName: 'webhook_processed',
      metadataJson: { eventType: event.type, eventId: event.id },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Webhook processing error for ${event.type}:`, error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const invoiceId = session.metadata?.invoiceId
  if (!invoiceId) {
    console.error('checkout.session.completed: missing invoiceId in metadata')
    return
  }

  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } })
  if (!invoice) {
    console.error(`checkout.session.completed: invoice ${invoiceId} not found`)
    return
  }

  // Idempotency: skip if already paid
  if (invoice.status === 'paid') {
    return
  }

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id || null

  await db.$transaction(async (tx) => {
    // Update invoice to paid
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'paid',
        paidAt: new Date(),
        outstandingCents: 0,
      },
    })

    // Stop collections: mark open attempts as skipped
    await tx.collectionAttempt.updateMany({
      where: { invoiceId, status: 'created' },
      data: { status: 'skipped' },
    })

    // Update or create payment record
    if (paymentIntentId) {
      const existingPayment = await tx.payment.findUnique({
        where: { stripePaymentIntent: paymentIntentId },
      })

      if (existingPayment) {
        await tx.payment.update({
          where: { id: existingPayment.id },
          data: { status: 'succeeded', paidAt: new Date() },
        })
      } else {
        await tx.payment.create({
          data: {
            organizationId: invoice.organizationId,
            invoiceId: invoice.id,
            stripePaymentIntent: paymentIntentId,
            amountCents: session.amount_total || invoice.totalCents,
            status: 'succeeded',
            paidAt: new Date(),
          },
        })
      }
    }
  })

  await trackEvent({
    organizationId: invoice.organizationId,
    eventName: 'invoice_payment_confirmed',
    entityType: 'invoice',
    entityId: invoiceId,
    metadataJson: { paymentIntentId, sessionId: session.id },
  })

  await trackEvent({
    organizationId: invoice.organizationId,
    eventName: 'collections_stopped_due_to_payment',
    entityType: 'invoice',
    entityId: invoiceId,
  })
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const invoiceId = session.metadata?.invoiceId
  if (!invoiceId) return

  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } })
  if (!invoice || invoice.status === 'paid') return

  // Clear the checkout session reference so a new one can be created
  await db.invoice.update({
    where: { id: invoiceId },
    data: { stripeCheckoutSessionId: null },
  })

  // Mark any pending payment as failed
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id || null

  if (paymentIntentId) {
    const payment = await db.payment.findUnique({
      where: { stripePaymentIntent: paymentIntentId },
    })
    if (payment && payment.status === 'pending') {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      })
    }
  }

  await trackEvent({
    organizationId: invoice.organizationId,
    eventName: 'invoice_payment_failed',
    entityType: 'invoice',
    entityId: invoiceId,
    metadataJson: { reason: 'checkout_expired', sessionId: session.id },
  })
}

async function handleAccountUpdated(account: Stripe.Account) {
  if (!account.id) return

  const org = await db.organization.findFirst({
    where: { stripeConnectedAccountId: account.id },
  })
  if (!org) return

  const chargesEnabled = account.charges_enabled ?? false
  const payoutsEnabled = account.payouts_enabled ?? false

  await db.organization.update({
    where: { id: org.id },
    data: { stripeChargesEnabled: chargesEnabled, stripePayoutsEnabled: payoutsEnabled },
  })

  if (chargesEnabled && !org.stripeChargesEnabled) {
    await trackEvent({
      organizationId: org.id,
      eventName: 'stripe_connect_completed',
      entityType: 'organization',
      entityId: org.id,
    })
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const invoiceId = paymentIntent.metadata?.invoiceId
  if (!invoiceId) return

  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } })
  if (!invoice || invoice.status === 'paid') return

  // Mark the local payment record as failed
  if (paymentIntent.id) {
    const payment = await db.payment.findUnique({
      where: { stripePaymentIntent: paymentIntent.id },
    })
    if (payment && payment.status === 'pending') {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      })
    }
  }

  await trackEvent({
    organizationId: invoice.organizationId,
    eventName: 'invoice_payment_failed',
    entityType: 'invoice',
    entityId: invoiceId,
    metadataJson: { reason: 'payment_intent_failed', paymentIntentId: paymentIntent.id },
  })
}
