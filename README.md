# Shortee

Shortee is a short-form English feed built around clips, subtitle interaction, saves, repeats, and quick return loops.

## Product

- Brand: `Shortee`
- Internal workspace/repo name: `studyeng` (migration not fully finished)
- Stack: Next.js 16, React 19, TypeScript, Zustand, Supabase, Prisma
- Core surfaces: shorts feed, explore, learning history, profile/settings, premium gating

## Scripts

```bash
npm run dev
npm run lint
npm run test:run
npm run build
npm run cf:build
npm run cf:preview
npm run cf:deploy
```

## Deployment

- `Vercel` remains supported as the current deployment target.
- `Cloudflare Workers` is now scaffolded as a parallel target through OpenNext.
- Cloudflare config lives in `wrangler.jsonc`.
- Local Cloudflare preview should be run from `WSL/Linux` on this machine because `workerd` does not install cleanly on the current Windows ARM setup.
- Run the Cloudflare build from a WSL home/ext4 path, not `/mnt/c/...`, or Next/OpenNext can fail on lockfile IO.
- `src/middleware.ts` is intentionally kept for Cloudflare compatibility because the current OpenNext adapter does not support Node-style `proxy.ts` yet.
- Keep app secrets in `.env.local`; use `.dev.vars` only for Wrangler-specific flags such as `NEXTJS_ENV=development`.

### Release Checklist

1. Set production URLs before any web or native release:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SITE_URL`
   - `CAPACITOR_SERVER_URL`
2. Apply Supabase SQL migrations before deploying web or app binaries:
   - `supabase/migrations/003_billing.sql`
   - `supabase/migrations/004_premium_codes.sql`
   - `supabase/migrations/006_support_chat.sql`
   - `supabase/migrations/007_daily_view_usage.sql`
3. Verify the release build paths:
   - `npm run build`
   - `npm run cf:build`
   - `npm run cap:prepare`
4. Only then run:
   - `npm run cf:deploy`
   - `npm run cap:sync`

## Key Docs

- [Brand OS](./docs/reports/2026-03-08-shortee-brand-os.md)
- [Brand UI handoff](./docs/reports/2026-03-08-shortee-brand-ui-handoff.md)
- [OMX brand playbook](./docs/reports/2026-03-08-shortee-omx-brand-playbook.md)
- [Brand council review](./docs/reports/2026-03-08-shortee-brand-council-review.md)
- [Brand retrospective and priorities](./docs/reports/2026-03-08-shortee-brand-retrospective-and-priorities.md)
- [Brand and growth command center](./docs/reports/2026-03-08-shortee-brand-command-center.md)
- [Market offer and moat](./docs/reports/2026-03-08-shortee-market-offer-and-moat.md)
- [Competitor message gap](./docs/reports/2026-03-08-shortee-competitor-message-gap.md)
- [Shortee only claims](./docs/reports/2026-03-08-shortee-only-claims.md)
- [Brand lexicon](./docs/reports/2026-03-08-shortee-brand-lexicon.md)
- [Store launch kit](./docs/reports/2026-03-08-shortee-store-launch-kit.md)
- [Store screenshot system](./docs/reports/2026-03-08-shortee-store-screenshot-system.md)
- [Channel growth playbook](./docs/reports/2026-03-08-shortee-channel-growth-playbook.md)
- [Ad copy bank](./docs/reports/2026-03-08-shortee-ad-copy-bank.md)
- [Creator brief](./docs/reports/2026-03-08-shortee-creator-brief.md)
- [Short-form script pack](./docs/reports/2026-03-08-shortee-shortform-script-pack.md)
- [Weekly brand review template](./docs/reports/2026-03-08-shortee-weekly-brand-review-template.md)
- [Brand and UX strategy draft](./docs/plans/brand-ux-strategy.md)
- [Pricing strategy draft](./docs/plans/pricing-strategy.md)
- [Competitor analysis](./docs/research/2026-03-07-competitor-analysis.md)
- [UX improvement notes](./docs/plans/2026-03-08-ux-improvements.md)

## Current Release Reality

As of March 8, 2026:

- `npm run test:run` passes
- `npm run lint` passes with warnings
- `npm run build` passes
- branding is mostly aligned to `Shortee`, with some legacy internal `studyeng` naming still present
- premium UI exists, but real payment infrastructure is not integrated yet

See the command center document above for the launch blockers, brand direction, acquisition plan, and automation roadmap.
