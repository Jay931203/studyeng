# Cloudflare Workers Deployment

This repository now supports `Cloudflare Workers` as a parallel deployment target using OpenNext.

## Commands

```bash
npm run cf:build
npm run cf:preview
npm run cf:deploy
```

## Required Cloudflare Setup

1. Create a Worker named `studyeng`.
2. Connect the Git repository in Cloudflare Workers Builds or deploy with Wrangler.
3. Add the same application secrets already used in `.env.local`.
4. Keep the `IMAGES` binding enabled so Next.js `Image` optimization works.

## Notes

- `wrangler.jsonc` already includes `nodejs_compat` for Prisma, Stripe, and the existing Node-oriented API routes.
- `WORKER_SELF_REFERENCE` is configured for the OpenNext worker self-binding.
- On this Windows ARM machine, use `WSL/Linux` for `cf:preview` and `cf:deploy`.
- `CAPACITOR_SERVER_URL` can point to either the Vercel or Cloudflare origin during cutover.
- `src/middleware.ts` is kept on purpose. Next.js prefers `proxy.ts`, but the current Cloudflare OpenNext path still requires Edge middleware instead of Node-style proxy handling.
