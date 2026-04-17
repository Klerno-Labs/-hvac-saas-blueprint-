# Known Issues and Launch Risks

Updated assessment as of the completion of all pre-launch work.

## Launch Blockers

### Stripe Webhook Must Be Configured
- **Risk**: High (payment flow)
- **Status**: Webhook endpoint exists at `/api/stripe/webhook` but requires Stripe Dashboard configuration.
- **Action required**: Create webhook in Stripe Dashboard pointing to `https://yourdomain.com/api/stripe/webhook` with events: `checkout.session.completed`, `checkout.session.expired`, `account.updated`. Set the signing secret as `STRIPE_WEBHOOK_SECRET`.

### Production Environment Variables
- **Risk**: High
- **Status**: `.env` is configured for local development. Production deployment requires setting `AUTH_URL`, `APP_URL`, and switching Stripe keys to live mode.
- **Action required**: See `docs/deploy-vercel.md` for the full checklist.

## Resolved (Previously Blockers)

### ~~Database Migrations Not Applied~~
- **Resolved**: Baseline migration created at `prisma/migrations/0001_initial_schema/` and marked as applied. Future schema changes use `prisma migrate dev` / `prisma migrate deploy`.

### ~~AUTH_SECRET Must Be Changed~~
- **Resolved**: A secure secret is set in `.env`. Production deployment should generate a new one.

### ~~No Email Delivery~~
- **Resolved**: Email delivery wired into estimate sending, invoice sending, collections automation, and password reset via Resend.

### ~~No Password Reset Flow~~
- **Resolved**: Full forgot-password → email → reset-password flow implemented and working.

### ~~No Customer Edit/Delete~~
- **Resolved**: Customer edit page and soft-delete (with `deletedAt` field) implemented. Deleted customers are hidden from all listings.

### ~~No CI/CD Pipeline~~
- **Resolved**: GitHub Actions workflow at `.github/workflows/ci.yml` runs type-check, build, and tests on push/PR to main.

### ~~No Automated Tests~~
- **Resolved**: Vitest test suite with 24 tests covering validation schemas (customer, estimate, invoice) and portal utilities.

## Non-Blockers (Accept for Beta)

### Invoice Number Race Condition
- **Risk**: Low (single-user MVP)
- **Status**: Invoice and estimate numbers generated via `count + 1` which could race under concurrent requests.
- **Recommendation**: Acceptable for single-user beta. Switch to database sequence or atomic increment for scale.

### Portal Tokens Not Rate-Limited
- **Risk**: Low
- **Status**: Portal token validation has no rate limiting. Brute-force on 64-character hex tokens is computationally infeasible but rate limiting would be defense in depth.
- **Recommendation**: Add rate limiting to portal routes if traffic warrants it.

### Accounting Sync Is Placeholder
- **Risk**: Low
- **Status**: Accounting sync creates local tracking records but does not call real QuickBooks/Xero APIs.
- **Recommendation**: Implement real provider API integration when a customer needs it.

### No Pagination on List Pages
- **Risk**: Low
- **Status**: Customer, job, estimate, and invoice lists load all records. Fine for beta.
- **Recommendation**: Add pagination when any list exceeds ~100 records.

### No Search/Filter
- **Risk**: Low
- **Status**: No search or filter functionality on list pages.
- **Recommendation**: Add as usage grows and users need to find specific records.

### No IP Address in Audit Logs
- **Risk**: Low
- **Status**: Audit log model accepts `ipAddress` but server actions don't capture it.
- **Recommendation**: Extract from request headers in middleware if needed.

### Single Organization Per User
- **Risk**: Low
- **Status**: Users can only belong to one organization. Team invite flow exists but is basic.
- **Recommendation**: Sufficient for target market (1-5 technician shops).

## Architecture Notes

### What's Solid
- Multi-tenant isolation enforced on every query (organizationId scoping)
- Webhook-confirmed payment truth (never optimistic)
- Server-side validation on all writes (Zod)
- Admin role enforcement on sensitive actions
- Audit trail for admin/security events
- Security headers via middleware
- Portal token-based access with expiration and revocation
- AI draft with graceful fallback when no API key configured
- Email delivery for estimates, invoices, collections, and password reset
- Soft-delete for customers preserving referential integrity
- CI/CD pipeline with type-check, build, and test
- Proper migration history for database schema

### Post-Launch Improvements
- Real accounting provider integration (QuickBooks/Xero)
- Pagination and search on list pages
- Rate limiting on portal and auth routes
- File upload for proof-of-work photos
- SMS notifications for collections
