# Security Checklist

## Auth and access
- Enforce organization-level authorization on every query and mutation.
- Never trust client-provided organization IDs without server validation.
- Use secure session management and CSRF-safe flows where applicable.

## Payments
- Trust Stripe webhook events for payment truth.
- Verify webhook signatures.
- Store Stripe IDs, not full card data.
- Do not mark invoices paid from client-side callbacks alone.

## Uploads
- Use signed upload URLs.
- Restrict mime types and size limits.
- Scan or validate uploads before long-term use if possible.
- Separate private proof-of-work assets from public marketing assets.

## Data privacy
- Minimize sensitive personal data collected in V1.
- Log access and changes for key billing objects.
- Avoid storing unnecessary financial or identity data outside Stripe.

## App safety
- Validate all inputs with shared schemas.
- Rate-limit public endpoints.
- Add audit logging for admin actions.
- Use environment-specific secrets management.
