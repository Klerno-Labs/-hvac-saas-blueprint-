# Stripe Connect Plan

## Model
Use Stripe Connect as a SaaS platform model, where HVAC businesses are connected accounts that collect payments from their own customers.

## First integration choice
- Stripe-hosted or embedded onboarding, not fully custom onboarding in V1.
- Platform creates connected account and sends user through onboarding flow.
- Platform stores account ID and readiness states.

## Required flows
1. Create connected account.
2. Generate onboarding link or embedded onboarding session.
3. Detect onboarding completion and requirements changes.
4. Only allow payment collection when charges are enabled.
5. Reconcile invoice payment state from webhooks.

## Must-handle webhook families
- account.updated
- checkout.session.completed or payment_intent.succeeded depending on flow
- payment_intent.payment_failed
- charge.succeeded
- charge.refunded

## V1 recommendation
- Use Checkout or payment links tied to invoice payment flow if that reduces complexity.
- Keep the platform out of avoidable custom payment UX until the core loop works.
