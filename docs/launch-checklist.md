# Launch Checklist

Pre-launch validation checklist for the HVAC SaaS application. Each item should be verified before allowing real users.

## Environment Configuration

- [ ] `DATABASE_URL` set to production PostgreSQL instance
- [ ] `AUTH_SECRET` set to unique production value (NOT the default)
- [ ] `AUTH_URL` set to production URL (e.g., `https://app.yourdomain.com`)
- [ ] `APP_URL` set to production URL
- [ ] `STRIPE_SECRET_KEY` set to live Stripe key (or test key for beta)
- [ ] `STRIPE_WEBHOOK_SECRET` set from Stripe Dashboard
- [ ] `STRIPE_PUBLISHABLE_KEY` set
- [ ] `COLLECTIONS_CRON_SECRET` set to a secure random value
- [ ] `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` set if using GitHub OAuth
- [ ] No `.env` files committed to repository
- [ ] No insecure default values remain in production env

## Database

- [ ] Production database provisioned and accessible
- [ ] `npx prisma migrate deploy` run successfully
- [ ] Database backups configured
- [ ] Connection pool settings appropriate for expected load

## Build and Deploy

- [ ] `npm run build` completes without errors
- [ ] Application starts and serves requests
- [ ] HTTPS configured (via platform or reverse proxy)
- [ ] Custom domain configured if applicable

## Auth Verification

- [ ] Signup creates user and redirects to login
- [ ] Login with credentials works
- [ ] Login with GitHub OAuth works (if configured)
- [ ] Unauthenticated users redirected to /login
- [ ] Users without org redirected to /onboarding
- [ ] Org creation works and creates owner membership

## Core Workflow Verification

- [ ] Customer creation works with validation
- [ ] Job creation linked to customer works
- [ ] Estimate creation from job works
- [ ] AI draft generation works (or falls back to template if no OPENAI_API_KEY)
- [ ] Proof of work recording sets job to completed
- [ ] Invoice creation from job works (seeds from estimate if available)
- [ ] Invoice status updates work (draft → sent → paid/void)
- [ ] Dashboard shows real metrics
- [ ] Reminders creation and status update work

## Stripe / Payment Verification

- [ ] Organization can start Stripe Connect onboarding
- [ ] Stripe onboarding callback refreshes connection state
- [ ] Payment link creation works for sent invoices
- [ ] Stripe Checkout session loads for customer
- [ ] Webhook endpoint receives and processes events:
  - [ ] `checkout.session.completed` marks invoice as paid
  - [ ] `checkout.session.expired` clears checkout session
  - [ ] `account.updated` refreshes org connection state
- [ ] Invoice NOT marked paid from redirect alone (only from webhook)

## Collections Verification

- [ ] Collections policy can be enabled/configured in settings
- [ ] `/api/collections/run` creates attempts for overdue invoices
- [ ] Paid invoices are excluded from collections
- [ ] Paused invoices are excluded from collections
- [ ] Collections cron endpoint requires bearer token in production

## Portal Verification

- [ ] Portal link generation works from customer detail page
- [ ] Portal link opens customer dashboard with correct data
- [ ] Portal shows only customer-visible data (no internal notes)
- [ ] Portal invoice detail shows line items and totals
- [ ] Portal payment button creates checkout session
- [ ] Portal does not expose other customers' data
- [ ] Expired/revoked tokens return 404

## Accounting Sync Verification

- [ ] Accounting provider can be configured in settings
- [ ] Manual sync creates sync records
- [ ] Sync status visible in reports page

## Admin / Audit Verification

- [ ] Settings changes require owner role
- [ ] Non-owner users see access denied for sensitive actions
- [ ] Audit log records for settings changes
- [ ] Audit log viewer accessible to owners only
- [ ] Audit log does not expose secrets in metadata

## Security

- [ ] Security headers present on responses (X-Content-Type-Options, X-Frame-Options)
- [ ] Webhook signature verification working
- [ ] No secrets in client-side code or error responses
- [ ] Portal routes isolated from admin routes
- [ ] Cross-tenant data isolation verified (create two orgs, verify no leakage)

## Monitoring

- [ ] Health check endpoint returns 200: `GET /api/health`
- [ ] Health check reports database connectivity
- [ ] Health check reports env configuration status
- [ ] Application error logging visible in platform (Vercel/Railway logs)
- [ ] Stripe webhook delivery monitored in Stripe Dashboard

## Post-Launch

- [ ] First real user can complete full signup → invoice → payment flow
- [ ] Webhook events processing correctly for real payments
- [ ] Audit log capturing real admin actions
- [ ] Collections automation running on schedule (if enabled)
- [ ] Health check monitoring set up (e.g., Uptime Robot, Better Uptime)
