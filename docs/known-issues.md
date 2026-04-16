# Known Issues and Launch Risks

Honest assessment of the current implementation state as of the completion of Features 1-11.

## Launch Blockers

### Database Migrations Not Applied
- **Risk**: High
- **Status**: All schema changes exist in `prisma/schema.prisma` but no migrations have been run against a real database.
- **Action required**: Run `npx prisma migrate dev` in development, then `npx prisma migrate deploy` in production before launch.

### AUTH_SECRET Must Be Changed
- **Risk**: High
- **Status**: The `.env.example` contains a placeholder value `replace-me-with-openssl-rand-base64-32`.
- **Action required**: Generate a secure secret with `openssl rand -base64 32` and set it in production env.

### Stripe Webhook Must Be Configured
- **Risk**: High (payment flow)
- **Status**: Webhook endpoint exists at `/api/stripe/webhook` but requires Stripe Dashboard configuration.
- **Action required**: Create webhook in Stripe Dashboard pointing to `https://yourdomain.com/api/stripe/webhook` with events: `checkout.session.completed`, `checkout.session.expired`, `account.updated`.

## Non-Blockers (Accept for Beta)

### No Automated Tests
- **Risk**: Medium
- **Status**: No unit, integration, or e2e tests exist. Manual QA checklist is provided.
- **Recommendation**: Add critical-path tests post-launch using Vitest for unit tests and Playwright for e2e.

### No CI/CD Pipeline
- **Risk**: Medium
- **Status**: No GitHub Actions, Vercel CI, or other build pipeline configured.
- **Recommendation**: Add build + type-check step to prevent broken deploys.

### Invoice Number Race Condition
- **Risk**: Low (single-user MVP)
- **Status**: Invoice and estimate numbers generated via `count + 1` which could race under concurrent requests.
- **Recommendation**: Acceptable for single-user beta. Switch to database sequence or atomic increment for scale.

### No Email Delivery
- **Risk**: Medium
- **Status**: No outbound email for estimate/invoice sending, password reset, or collections reminders. Status changes are recorded but no emails are sent.
- **Recommendation**: Add Resend or Postmark integration post-launch.

### No Password Reset Flow
- **Risk**: Medium
- **Status**: Users can create accounts with email/password but cannot reset forgotten passwords.
- **Recommendation**: Add password reset via email token post-launch.

### Portal Tokens Not Rate-Limited
- **Risk**: Low
- **Status**: Portal token validation has no rate limiting. A brute-force attack on 64-character hex tokens is computationally infeasible but rate limiting would be defense in depth.
- **Recommendation**: Add rate limiting to portal routes if traffic warrants it.

### Accounting Sync Is Placeholder
- **Risk**: Low
- **Status**: Accounting sync creates local tracking records but does not call real QuickBooks/Xero APIs. No OAuth flow with provider.
- **Recommendation**: Implement real provider API integration when a customer needs it.

### Collections Automation Is Internal Only
- **Risk**: Low
- **Status**: Collections creates internal records but does not send emails or SMS. Requires external cron to run.
- **Recommendation**: Add email delivery for collection reminders post-launch.

### No Customer Edit/Delete
- **Risk**: Low
- **Status**: Customers can be created and viewed but not edited or deleted.
- **Recommendation**: Add edit functionality. Delete should be soft-delete due to invoice/job dependencies.

### Single Organization Per User
- **Risk**: Low
- **Status**: Users can only belong to one organization. No team invite flow exists.
- **Recommendation**: Add team invites when multi-user orgs are needed.

### No IP Address in Audit Logs
- **Risk**: Low
- **Status**: Audit log model accepts `ipAddress` but server actions don't capture it.
- **Recommendation**: Extract from request headers in middleware if needed.

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

### What Needs Work Post-Launch
- Email delivery for notifications
- Automated test suite
- CI/CD pipeline
- Real accounting provider integration
- Team invites and role management
- Customer edit/delete
- Pagination on list pages
- Search/filter functionality
