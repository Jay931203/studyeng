#!/usr/bin/env node

/**
 * Generate premium codes and insert them into Supabase.
 *
 * Usage:
 *   node scripts/generate-premium-codes.mjs --count 10 --plan premium_monthly --days 30
 *   node scripts/generate-premium-codes.mjs --count 5 --plan premium_yearly --days 365 --memo "launch promo"
 *   node scripts/generate-premium-codes.mjs --count 1 --days 7 --memo "test code"
 *
 * Options:
 *   --count   Number of codes to generate (default: 1)
 *   --plan    Plan key: premium_monthly or premium_yearly (default: premium_monthly)
 *   --days    Duration in days (default: 30)
 *   --memo    Optional memo for tracking
 *   --dry-run Print codes without inserting
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = {
    count: 1,
    plan: 'premium_monthly',
    days: 30,
    memo: null,
    dryRun: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--count':
        opts.count = parseInt(args[++i], 10)
        break
      case '--plan':
        opts.plan = args[++i]
        break
      case '--days':
        opts.days = parseInt(args[++i], 10)
        break
      case '--memo':
        opts.memo = args[++i]
        break
      case '--dry-run':
        opts.dryRun = true
        break
    }
  }

  return opts
}

function generateCode() {
  // Format: XXXX-XXXX-XXXX (12 alphanumeric chars)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I, O, 0, 1 to avoid confusion
  const segments = []
  for (let s = 0; s < 3; s++) {
    let segment = ''
    for (let i = 0; i < 4; i++) {
      segment += chars[crypto.randomInt(chars.length)]
    }
    segments.push(segment)
  }
  return segments.join('-')
}

async function main() {
  const opts = parseArgs()
  const codes = []

  for (let i = 0; i < opts.count; i++) {
    codes.push({
      code: generateCode(),
      plan_key: opts.plan,
      duration_days: opts.days,
      memo: opts.memo,
    })
  }

  console.log(`\nGenerated ${codes.length} premium code(s):`)
  console.log(`Plan: ${opts.plan} | Duration: ${opts.days} days\n`)

  for (const c of codes) {
    console.log(`  ${c.code}`)
  }

  if (opts.dryRun) {
    console.log('\n(dry run — not inserted)')
    return
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { error } = await supabase.from('premium_codes').insert(codes)

  if (error) {
    console.error('\nInsert failed:', error.message)
    process.exit(1)
  }

  console.log(`\nInserted ${codes.length} code(s) into premium_codes table.`)
}

main()
