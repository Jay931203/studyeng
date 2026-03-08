import dotenv from 'dotenv'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')

let loaded = false

export function loadEnv() {
  if (loaded) return

  const candidates = [
    join(ROOT, '.env'),
    join(ROOT, '.env.local'),
  ]

  for (const path of candidates) {
    if (existsSync(path)) {
      dotenv.config({ path, override: false, quiet: true })
    }
  }

  loaded = true
}
