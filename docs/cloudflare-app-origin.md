# Cloudflare App Origin Runbook

Shortee can run the web app and native shell from the same production origin.

## Target Shape

- Primary web origin: `https://shortee.app`
- Cloudflare deployment target: Workers through OpenNext
- Native app shell: Capacitor remote origin through `CAPACITOR_SERVER_URL`
- Data/auth/billing backend: Supabase, Stripe, RevenueCat as already configured

## Preflight

Set these to the same Cloudflare-backed origin before web deploy or native sync:

```bash
NEXT_PUBLIC_APP_URL=https://shortee.app
NEXT_PUBLIC_SITE_URL=https://shortee.app
CAPACITOR_SERVER_URL=https://shortee.app
```

Then run:

```bash
node scripts/verify-cloudflare-app-origin.mjs
```

The check verifies:

- production origin variables are present, valid, HTTPS, and aligned
- `package.json` still has web, Cloudflare, and Capacitor build scripts
- `wrangler.jsonc` still targets OpenNext Workers with `nodejs_compat`
- required Supabase migration files exist through `007_daily_view_usage.sql`

## Release Flow

1. Apply Supabase migrations through `007_daily_view_usage.sql`.
2. Run the normal web checks:
   - `npm run test:run`
   - `npm run build`
3. Build and deploy Cloudflare from WSL/Linux ext4:
   - `npm run cf:build`
   - `npm run cf:deploy`
4. Point `shortee.app` at the Cloudflare Worker.
5. Build the native shell against the same origin:
   - `npm run cap:prepare`
   - `npm run cap:sync`
6. Install/run the Android or iOS build and smoke test the same features checked on web.

## Daily Development Loop

- For feature work, use `npm run dev` and check the web flow locally.
- For release verification, deploy to the Cloudflare-backed origin and check `https://shortee.app`.
- For app verification, run `cap:sync` with `CAPACITOR_SERVER_URL=https://shortee.app` and install the native build.

The web and app will exercise the same deployed Next.js routes because the native shell loads the remote production origin.

## GitHub Push Deploy

The repository includes `.github/workflows/cloudflare-deploy.yml`.

When the following GitHub Actions secrets are set, every push to `master` will deploy the Worker:

```bash
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
DIRECT_URL
VIEW_COUNT_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PREMIUM_MONTHLY_PRICE_ID
STRIPE_PREMIUM_YEARLY_PRICE_ID
NEXT_PUBLIC_REVENUECAT_API_KEY_APPLE
NEXT_PUBLIC_REVENUECAT_API_KEY_GOOGLE
ANTHROPIC_API_KEY
OPENAI_API_KEY
NEXT_PUBLIC_SENTRY_DSN
NEXT_PUBLIC_GA_ID
```

`NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_GA_ID`, and `OPENAI_API_KEY` can be blank if that service is not being used in production.

Cloudflare runtime secrets still need to exist on the Worker as well. GitHub Actions uses these values for CI build/deploy; the deployed Worker reads runtime values from Cloudflare.

The deploy workflow uploads runtime secrets alongside the Worker code with:

```bash
npx wrangler deploy --secrets-file .cloudflare-secrets.json
```

The required runtime secret names are also declared in `wrangler.jsonc`, so deploy fails clearly if one is missing.
