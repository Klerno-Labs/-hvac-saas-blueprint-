# Stage 2 Prompt

Act as a staff software architect.
Goal: design the production-lean MVP architecture for a residential HVAC quote-to-payment SaaS.
Output:
1. Recommended stack for a solo founder optimizing for speed and maintainability.
2. Database schema.
3. API routes and webhook flows.
4. File storage model for photos and signatures.
5. Event schema for analytics.
6. Security checklist for auth, payments, uploads, and PII.
Constraints:
- Self-serve web app first.
- Stripe Connect for payments.
- Must support quote -> proof -> invoice -> payment.
- Keep architecture simple enough for solo maintenance.
Do not skip error handling or observability.
