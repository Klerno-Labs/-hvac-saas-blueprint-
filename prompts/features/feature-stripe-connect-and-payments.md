# Feature Prompt — Stripe Connect and Payments

Implement Stripe Connect onboarding and invoice payment collection.

## Scope
- create connected account
- onboarding link or embedded flow
- readiness status checks
- invoice payment checkout flow
- webhook handler to mark invoice paid

## Must include
- secure webhook verification
- storage of account ID and readiness state
- payment_completed event emission
- refusal to present payment collection when charges are not enabled

## Do not include
- lending
- complex payout scheduling UI
- custom payment processor abstractions
