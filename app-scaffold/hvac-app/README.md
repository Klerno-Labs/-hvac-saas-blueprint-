# HVAC App Starter

## Purpose
This is the real app scaffold for the residential HVAC quote-to-payment SaaS.

## What is included
- Next.js app structure
- Prisma schema starter
- Auth.js starter wiring
- Stripe client and webhook placeholder
- Route scaffolding for core product areas
- Basic pages for dashboard and product modules

## What is intentionally not finished
- Production auth UX
- full onboarding flow
- customer/job CRUD implementation
- estimate/invoice/payment logic
- webhook reconciliation logic
- role-based permission enforcement in route handlers

## Recommended implementation order
1. Install dependencies
2. Set environment variables from `.env.example`
3. Run `prisma generate`
4. Run initial migration
5. Implement auth and organization onboarding
6. Implement customers and jobs
7. Implement estimates
8. Implement proof of work and invoices
9. Implement Stripe Connect onboarding and payment flow
10. Implement dashboard and reminders
