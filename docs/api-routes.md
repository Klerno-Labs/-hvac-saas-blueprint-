# API Routes

## Auth and onboarding
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/onboarding/organization
- POST /api/onboarding/stripe/connect-account
- GET /api/onboarding/stripe/status

## Customers
- GET /api/customers
- POST /api/customers
- GET /api/customers/:id
- PATCH /api/customers/:id
- DELETE /api/customers/:id

## Service locations
- GET /api/service-locations
- POST /api/service-locations
- PATCH /api/service-locations/:id

## Jobs
- GET /api/jobs
- POST /api/jobs
- GET /api/jobs/:id
- PATCH /api/jobs/:id
- POST /api/jobs/:id/complete

## Estimates
- GET /api/estimates
- POST /api/estimates
- GET /api/estimates/:id
- PATCH /api/estimates/:id
- POST /api/estimates/:id/send
- POST /api/estimates/:id/ai-draft

## Proof of work
- POST /api/jobs/:id/assets/upload-url
- POST /api/jobs/:id/signature
- GET /api/jobs/:id/proof

## Invoices
- GET /api/invoices
- POST /api/invoices
- GET /api/invoices/:id
- PATCH /api/invoices/:id
- POST /api/invoices/:id/send
- POST /api/invoices/:id/reminders

## Payments
- POST /api/payments/create-checkout-session
- GET /api/payments/status/:invoiceId
- POST /api/webhooks/stripe

## Dashboard
- GET /api/dashboard/cash-summary
- GET /api/dashboard/unpaid-invoices
- GET /api/dashboard/recent-activity
