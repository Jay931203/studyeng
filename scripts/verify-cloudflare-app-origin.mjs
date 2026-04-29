import { existsSync, readFileSync } from 'node:fs'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local', override: false, quiet: true })
loadEnv({ quiet: true })

const requiredMigrations = [
  'supabase/migrations/003_billing.sql',
  'supabase/migrations/004_premium_codes.sql',
  'supabase/migrations/006_support_chat.sql',
  'supabase/migrations/007_daily_view_usage.sql',
]

const requiredScripts = ['build', 'cf:build', 'cf:deploy', 'cap:prepare', 'cap:sync']
const requiredWranglerKeys = ['main', 'compatibility_flags', 'assets', 'services', 'images']

const failures = []
const warnings = []

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`${path} is not readable JSON: ${error.message}`)
    return null
  }
}

function getEnv(name) {
  return process.env[name]?.trim() ?? ''
}

function checkHttpsUrl(name) {
  const value = getEnv(name)
  if (!value) {
    failures.push(`${name} is required`)
    return ''
  }

  let parsed
  try {
    parsed = new URL(value)
  } catch {
    failures.push(`${name} must be a valid URL`)
    return value
  }

  if (parsed.protocol !== 'https:') {
    failures.push(`${name} must use https for production app builds`)
  }
  if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
    warnings.push(`${name} should normally be just an origin, e.g. https://shortee.app`)
  }
  if (parsed.hostname.endsWith('.vercel.app')) {
    warnings.push(`${name} still points at Vercel; use the Cloudflare-backed custom domain for primary release`)
  }
  return parsed.origin
}

const appUrl = checkHttpsUrl('NEXT_PUBLIC_APP_URL')
const siteUrl = checkHttpsUrl('NEXT_PUBLIC_SITE_URL')
const capacitorUrl = checkHttpsUrl('CAPACITOR_SERVER_URL')

const uniqueOrigins = new Set([appUrl, siteUrl, capacitorUrl].filter(Boolean))
if (uniqueOrigins.size > 1) {
  failures.push(
    `production origins do not match: ${[...uniqueOrigins].join(', ')}`,
  )
}

const packageJson = readJson('package.json')
if (packageJson) {
  for (const scriptName of requiredScripts) {
    if (!packageJson.scripts?.[scriptName]) {
      failures.push(`package.json is missing script: ${scriptName}`)
    }
  }
}

const wrangler = readJson('wrangler.jsonc')
if (wrangler) {
  for (const key of requiredWranglerKeys) {
    if (!(key in wrangler)) {
      failures.push(`wrangler.jsonc is missing ${key}`)
    }
  }
  if (!wrangler.compatibility_flags?.includes('nodejs_compat')) {
    failures.push('wrangler.jsonc must include compatibility_flags: nodejs_compat')
  }
  if (wrangler.main !== '.open-next/worker.js') {
    warnings.push('wrangler.jsonc main should stay aligned with OpenNext output: .open-next/worker.js')
  }
}

for (const migration of requiredMigrations) {
  if (!existsSync(migration)) {
    failures.push(`missing required migration: ${migration}`)
  }
}

if (process.platform === 'win32' && process.arch === 'arm64') {
  warnings.push('Cloudflare build/deploy must run from WSL/Linux on this Windows ARM machine')
}

if (warnings.length) {
  console.log('Warnings:')
  for (const warning of warnings) {
    console.log(`- ${warning}`)
  }
}

if (failures.length) {
  console.error('Cloudflare app-origin check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(`Cloudflare app-origin check passed for ${capacitorUrl}`)
