# Event Tracking Plan

## Principles
- Track business-critical events, not vanity clicks.
- Use one canonical server-side event emitter where possible.
- Every event should include organization_id, user_id when available, timestamp, and entity identifiers.

## Core events
- user_signed_up
- organization_onboarding_started
- organization_onboarding_completed
- stripe_connect_onboarding_started
- stripe_connect_onboarding_completed
- customer_created
- job_created
- estimate_created
- estimate_ai_draft_generated
- estimate_sent
- job_marked_completed
- proof_asset_uploaded
- customer_signature_captured
- invoice_created
- invoice_sent
- payment_checkout_started
- payment_completed
- reminder_scheduled
- reminder_sent
- dashboard_viewed

## Funnel to measure
1. signup
2. onboarding completed
3. customer created
4. job created
5. estimate created
6. job completed
7. invoice sent
8. payment started
9. payment completed

## Key derived metrics
- signup to onboarding complete
- onboarding complete to first customer
- first customer to first invoice
- first invoice to first payment
- time to first payment
- weekly active paying organizations
