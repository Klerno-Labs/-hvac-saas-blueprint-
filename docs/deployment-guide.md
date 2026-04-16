# Deployment Guide

## Overview
This guide covers deploying the HVAC SaaS application for production use. The application is a Next.js App Router application with PostgreSQL (Prisma ORM), Auth.js authentication, Stripe Connect payments, and optional OpenAI integration.

## Prerequisites
- Node.js 18+ (LTS recommended)
- PostgreSQL 14+ database
- Stripe account with Connect enabled
- Domain with HTTPS for production

## Environment Variables

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/hvac` |
| `AUTH_SECRET` | Auth.js session signing secret (min 32 chars) | Generate with `openssl rand -base64 32` |
| `AUTH_URL` | Full URL of the application | `https://app.yourdomain.com` |

### Required for Payments
| Variable | Description | Notes |
|----------|-------------|-------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | Use test key (`sk_test_...`) for staging |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | From Stripe Dashboard > Webhooks |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Used in future client-side flows |

### Required for Auth Providers
| Variable | Description | Notes |
|----------|-------------|-------|
| `AUTH_GITHUB_ID` | GitHub OAuth App client ID | Optional if using only credentials auth |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App client secret | Optional if using only credentials auth |

### Application
| Variable | Description | Default |
|----------|-------------|---------|
| `APP_URL` | Public URL of the application | `http://localhost:3000` |
| `OPENAI_API_KEY` | OpenAI API key for AI estimate drafting | Optional — falls back to template |
| `COLLECTIONS_CRON_SECRET` | Bearer token for collections cron endpoint | Required in production |

### Security Notes
- Never commit `.env` files to the repository
- Use a unique `AUTH_SECRET` for each environment
- Use separate Stripe accounts/keys for staging vs production
- Set `COLLECTIONS_CRON_SECRET` in production to protect the cron endpoint

## Database Setup

### Initial Setup
```bash
# Generate Prisma client
npm run db:generate

# Create initial migration
npx prisma migrate dev --name init

# Or push schema directly (for development)
npm run db:push
```

### Production Migrations
```bash
# Apply pending migrations in production
npx prisma migrate deploy
```

### Backup
- Use your database provider's backup tools (e.g., `pg_dump`)
- Back up before running migrations
- Store backups securely outside the database server

## Build and Deploy

### Build
```bash
npm install
npm run db:generate
npm run build
```

### Start
```bash
npm start
```

The application runs on port 3000 by default. Use a reverse proxy (nginx, Caddy) or platform (Vercel, Railway) for HTTPS.

### Vercel Deployment
1. Connect your repository to Vercel
2. Set all environment variables in Project Settings > Environment Variables
3. Build command: `npm run build` (Vercel auto-detects Next.js)
4. Prisma generate runs automatically via `postinstall` or build step

### Docker (if needed)
No Dockerfile is provided. A basic setup would:
1. Use `node:18-alpine` base image
2. Copy package files, install dependencies
3. Run `npx prisma generate`
4. Run `npm run build`
5. Start with `npm start`

## Stripe Setup

### Connect Setup
1. Enable Stripe Connect in your Stripe Dashboard
2. Set platform type to "Standard" or "Express"
3. Configure webhook endpoint: `https://app.yourdomain.com/api/stripe/webhook`
4. Subscribe to events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `account.updated`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Test Mode
- Use `sk_test_...` keys for development
- Use Stripe test card numbers (`4242424242424242`)
- Use Stripe CLI for local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## Collections Cron

The collections automation runs via an API endpoint that should be called by an external scheduler.

### Endpoint
```
POST /api/collections/run
Authorization: Bearer <COLLECTIONS_CRON_SECRET>
```

### Setup
- Use Vercel Cron, GitHub Actions, or any cron scheduler
- Recommended interval: once daily
- The endpoint is idempotent — safe to retry

## Health Check

### Endpoint
```
GET /api/health
```

Returns service status, database connectivity, and env configuration status. Returns 200 when healthy, 503 when degraded.

### Example Response
```json
{
  "ok": true,
  "service": "hvac-app",
  "version": "0.1.0",
  "checks": {
    "database": { "status": "ok" },
    "env": { "status": "ok" },
    "stripe": { "status": "configured" },
    "auth": { "status": "configured" }
  }
}
```

## Post-Deploy Verification

After deployment, verify:
1. Health check returns `ok: true` — `GET /api/health`
2. Login/signup works with credentials
3. Dashboard loads with org context
4. Stripe webhook test event succeeds (Stripe Dashboard > Webhooks > Send test webhook)
5. Portal links work (generate from customer detail, open in incognito)

## Rollback

If deployment causes issues:
1. Revert to previous deployment (platform-specific)
2. If schema migration was applied, assess whether rollback is safe
3. Check `/api/health` on the rolled-back version
4. Stripe webhooks continue to work as long as the endpoint is reachable

## Monitoring

- Check `/api/health` periodically for uptime monitoring
- Review audit logs at Settings > Audit for admin activity
- Monitor Stripe Dashboard for webhook delivery failures
- Check application logs for errors (platform-specific)
