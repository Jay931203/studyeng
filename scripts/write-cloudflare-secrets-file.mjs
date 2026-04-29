import { writeFileSync } from 'node:fs'

const outputPath = process.argv[2]

if (!outputPath) {
  console.error('Usage: node scripts/write-cloudflare-secrets-file.mjs <output-json-path>')
  process.exit(1)
}

const requiredSecrets = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'DIRECT_URL',
  'VIEW_COUNT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PREMIUM_MONTHLY_PRICE_ID',
  'STRIPE_PREMIUM_YEARLY_PRICE_ID',
  'NEXT_PUBLIC_REVENUECAT_API_KEY_APPLE',
  'NEXT_PUBLIC_REVENUECAT_API_KEY_GOOGLE',
  'ANTHROPIC_API_KEY',
]

const optionalSecrets = ['OPENAI_API_KEY', 'NEXT_PUBLIC_SENTRY_DSN', 'NEXT_PUBLIC_GA_ID']

const missing = requiredSecrets.filter((name) => !process.env[name]?.trim())

if (missing.length) {
  console.error('Missing GitHub/CI secrets:')
  for (const name of missing) {
    console.error(`- ${name}`)
  }
  process.exit(1)
}

const payload = {}

for (const name of [...requiredSecrets, ...optionalSecrets]) {
  const value = process.env[name]?.trim()
  if (value) payload[name] = value
}

writeFileSync(outputPath, JSON.stringify(payload), { mode: 0o600 })
