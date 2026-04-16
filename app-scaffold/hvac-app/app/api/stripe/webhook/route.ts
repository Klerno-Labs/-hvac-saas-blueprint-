import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing webhook configuration' }, { status: 400 })
  }

  try {
    stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }
}
