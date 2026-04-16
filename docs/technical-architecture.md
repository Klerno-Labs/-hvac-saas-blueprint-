# Technical Architecture

## Recommended stack
- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma ORM
- NextAuth or Clerk/Auth.js-style auth layer
- Stripe Connect for connected account onboarding and payment collection
- S3-compatible object storage for proof-of-work assets
- Resend/Postmark for transactional email
- PostHog or server-side event logging for product analytics
- Vercel for deployment in the first phase

## Why this stack
This stack is optimized for solo-founder speed, common ecosystem support, and strong documentation around multi-tenant SaaS and Stripe integration. The goal is not technical novelty; the goal is maintainable velocity.

## Architecture principles
1. Multi-tenant by organization from day one.
2. Server-validated mutations only.
3. Every core action emits an analytics event.
4. Every payment state comes from Stripe webhooks, not frontend assumptions.
5. Every stage-2 feature should be replaceable or extendable without breaking the quote-to-payment loop.

## Core bounded contexts
- Identity and access
- Organization setup
- Customers and service locations
- Jobs and proof of work
- Estimates and invoices
- Payments and connected accounts
- Notifications and reminders
- Analytics and admin observability

## Deployment phases
### Phase 1
Single app, single database, simple object storage, direct Stripe integration.

### Phase 2
Background job queue, stronger admin tooling, more detailed reporting, more granular permissioning.

### Phase 3
Separate internal services only when scale or team size forces it.
