# User Flows

## Flow 1: New organization to payment-ready
1. User signs up.
2. User creates organization.
3. User enters business details.
4. User starts Stripe onboarding.
5. System checks readiness.
6. User lands on dashboard with next-step checklist.

## Flow 2: Quote to payment
1. User creates customer.
2. User creates job.
3. User drafts estimate with optional AI help.
4. User completes job.
5. User uploads proof photos and captures signature.
6. User converts work into invoice.
7. User sends invoice.
8. Customer opens payment link / checkout.
9. Stripe confirms payment.
10. Invoice marked paid and dashboard updated.

## Flow 3: Unpaid invoice follow-up
1. Invoice remains unpaid after send.
2. Reminder is scheduled.
3. User sees invoice in unpaid queue.
4. Reminder sends.
5. If payment succeeds, invoice status updates and reminder chain stops.
