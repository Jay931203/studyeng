# Free Hosting Status

Current no-cost deployment status:

- Vercel is not usable while the project/account is paused.
- Cloudflare Workers Free rejects the current OpenNext Worker bundle because it exceeds the 3 MB script limit.
- Netlify Free is the next practical target for this Next.js app because it supports App Router, SSR, route handlers/API routes, and middleware through its Next.js adapter.

## Netlify Free Setup

Connect the GitHub repository from the Netlify dashboard.

Use these build settings:

- Build command: `npm run build`
- Publish directory: `.next`
- Node version: `24`

Set these environment variables in Netlify:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `VIEW_COUNT_SECRET`
- `OPENAI_API_KEY` if enabled

Keep billing disabled until production payment keys are ready:

- `NEXT_PUBLIC_BILLING_ENABLED=false`
- `NEXT_PUBLIC_ENABLE_DEV_PREMIUM_OVERRIDE=false`

To enable paid subscriptions later, add the Supabase service-role key and Stripe/RevenueCat keys, then turn billing back on.
