import { writeFileSync } from 'node:fs'

const outputPath = process.argv[2]

if (!outputPath) {
  console.error('Usage: node scripts/write-cloudflare-secrets-file.mjs <output-json-path>')
  process.exit(1)
}

const requiredSecrets = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'DATABASE_URL',
  'VIEW_COUNT_SECRET',
]

const billingSecrets = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PREMIUM_MONTHLY_PRICE_ID',
  'STRIPE_PREMIUM_YEARLY_PRICE_ID',
]

const optionalSecrets = [
  'DIRECT_URL',
  'NEXT_PUBLIC_REVENUECAT_API_KEY_APPLE',
  'NEXT_PUBLIC_REVENUECAT_API_KEY_GOOGLE',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_SENTRY_DSN',
  'NEXT_PUBLIC_GA_ID',
]

const publicRuntimeValues = ['NEXT_PUBLIC_BILLING_ENABLED', 'NEXT_PUBLIC_ENABLE_DEV_PREMIUM_OVERRIDE']

const billingEnabled = process.env.NEXT_PUBLIC_BILLING_ENABLED === 'true'
const requiredForDeploy = billingEnabled ? [...requiredSecrets, ...billingSecrets] : requiredSecrets

const missing = requiredForDeploy.filter((name) => !process.env[name]?.trim())

if (missing.length) {
  console.error('Missing GitHub/CI secrets:')
  for (const name of missing) {
    console.error(`- ${name}`)
  }
  process.exit(1)
}

const payload = {}

for (const name of [...requiredSecrets, ...billingSecrets, ...optionalSecrets, ...publicRuntimeValues]) {
  const value = process.env[name]?.trim()
  if (value) payload[name] = value
}

writeFileSync(outputPath, JSON.stringify(payload), { mode: 0o600 })
