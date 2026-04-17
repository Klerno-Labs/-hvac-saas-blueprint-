# Deploying FieldClose to Vercel

## 1. Connect repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Set **Root Directory** to `app-scaffold/hvac-app`
4. Framework will auto-detect as **Next.js**

## 2. Set environment variables

Add these in Vercel project settings > Environment Variables:

| Variable | Value | Required |
|---|---|---|
| `DATABASE_URL` | Your Supabase/Postgres connection string | Yes |
| `AUTH_SECRET` | Run `openssl rand -base64 32` to generate | Yes |
| `AUTH_URL` | `https://your-domain.vercel.app` | Yes |
| `APP_URL` | `https://your-domain.vercel.app` | Yes |
| `STRIPE_SECRET_KEY` | From Stripe Dashboard (use live key for production) | Yes |
| `STRIPE_PUBLISHABLE_KEY` | From Stripe Dashboard | Yes |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook setup (step 3) | Yes |
| `RESEND_API_KEY` | From Resend dashboard | Yes |
| `EMAIL_FROM` | `FieldClose <noreply@yourdomain.com>` | Yes |
| `COLLECTIONS_CRON_SECRET` | Run `openssl rand -hex 32` to generate | Yes |
| `AUTH_GITHUB_ID` | From GitHub OAuth app (optional) | No |
| `AUTH_GITHUB_SECRET` | From GitHub OAuth app (optional) | No |
| `OPENAI_API_KEY` | From OpenAI (optional, for AI estimates) | No |

## 3. Set up Stripe webhook

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `account.updated`
4. Copy the signing secret and set it as `STRIPE_WEBHOOK_SECRET`

## 4. Run database migration

After the first deploy, run:

```bash
npx prisma migrate deploy
```

Or if the database already has the schema (from `db push`), the baseline migration is already marked as applied.

## 5. Set up collections cron (optional)

To run automated collections reminders, set up a cron job that hits:

```
POST https://your-domain.vercel.app/api/collections/run
Authorization: Bearer <COLLECTIONS_CRON_SECRET>
```

You can use Vercel Cron, GitHub Actions, or any external cron service. Recommended: daily at 9 AM.

## 6. Custom domain (optional)

1. Go to Vercel project settings > Domains
2. Add your custom domain
3. Update `AUTH_URL` and `APP_URL` to match
4. Update Stripe webhook URL to use the custom domain

## 7. Switch Stripe to live mode

When ready to accept real payments:

1. Replace `STRIPE_SECRET_KEY` with your live secret key (`sk_live_...`)
2. Replace `STRIPE_PUBLISHABLE_KEY` with your live publishable key (`pk_live_...`)
3. Create a new webhook in live mode and update `STRIPE_WEBHOOK_SECRET`
4. Each organization will need to re-onboard to Stripe Connect in live mode
