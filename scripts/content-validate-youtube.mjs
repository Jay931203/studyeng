#!/usr/bin/env node

import { execFileSync } from 'child_process'
import { readFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { loadSeedData } from './lib/load-seed-data.mjs'
import {
  readValidationCache,
  validateYoutubeId,
  writeValidationCache,
} from './lib/youtube-validation.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SEED_VIDEOS_PATH = join(ROOT, 'src', 'data', 'seed-videos.ts')
const SNAPSHOT_PATH = join(ROOT, 'src', 'data', 'content-existing-batch.json')
const VALIDATION_PATH = join(ROOT, 'src', 'data', 'youtube-validation-cache.json')

const args = process.argv.slice(2)
const specificId = getArgValue('--id')
const idsFile = getArgValue('--ids-file')
const queueName = getArgValue('--queue')
const force = args.includes('--force')
const shouldSyncManifest = !args.includes('--no-sync')
const limit = Number.parseInt(getArgValue('--limit') || '0', 10)
const concurrency = Math.max(1, Number.parseInt(getArgValue('--concurrency') || '8', 10))

async function main() {
  const { seedVideos } = await loadSeedData(SEED_VIDEOS_PATH)
  const cache = await readValidationCache(VALIDATION_PATH)
  const seedIds = dedupe(seedVideos.map(video => video.youtubeId))
  const targetIds = await resolveTargetIds(seedIds)
  const idsToCheck = targetIds.filter(youtubeId => force || !cache.videos[youtubeId])

  console.log(`Validating ${idsToCheck.length} YouTube videos for external playback\n`)

  let ok = 0
  let blocked = 0
  let errored = 0
  let completed = 0
  let persistQueue = Promise.resolve()

  let nextIndex = 0
  async function worker() {
    while (true) {
      const currentIndex = nextIndex++
      if (currentIndex >= idsToCheck.length) {
        return
      }

      const youtubeId = idsToCheck[currentIndex]
      const result = await validateYoutubeId(youtubeId)
      cache.videos[youtubeId] = result
      persistQueue = persistQueue.then(() => writeValidationCache(VALIDATION_PATH, cache))
      await persistQueue

      completed++
      if (result.blocked) {
        console.log(`  [${completed}/${idsToCheck.length}] ${youtubeId}... BLOCKED (${result.reason})`)
        blocked++
      } else if (result.status === 'ok') {
        console.log(`  [${completed}/${idsToCheck.length}] ${youtubeId}... OK`)
        ok++
      } else {
        console.log(`  [${completed}/${idsToCheck.length}] ${youtubeId}... ERROR (${result.reason})`)
        errored++
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(idsToCheck.length, 1)) }, () => worker())
  )

  const blockedIds = Object.values(cache.videos)
    .filter(entry => entry?.blocked)
    .map(entry => entry.youtubeId)
    .sort((a, b) => a.localeCompare(b))

  console.log(`\nDone: ${ok} ok, ${blocked} blocked, ${errored} error`)
  console.log(`Cache: ${VALIDATION_PATH}`)
  console.log(`Blocked total in cache: ${blockedIds.length}`)

  if (blockedIds.length > 0) {
    console.log('Blocked IDs:')
    for (const youtubeId of blockedIds.slice(0, 50)) {
      const entry = cache.videos[youtubeId]
      console.log(`  ${youtubeId} | ${entry.reason}`)
    }
    if (blockedIds.length > 50) {
      console.log(`  ... ${blockedIds.length - 50} more`)
    }
  }

  if (shouldSyncManifest) {
    console.log('\nRefreshing content and recommendation manifests\n')
    execFileSync(process.execPath, [join(ROOT, 'scripts', 'content-system.mjs')], {
      cwd: ROOT,
      env: process.env,
      stdio: 'inherit',
    })
  }
}

async function resolveTargetIds(seedIds) {
  let ids = seedIds

  if (idsFile || queueName) {
    const filePath = idsFile || SNAPSHOT_PATH
    const raw = await readFile(filePath, 'utf-8')
    const snapshot = JSON.parse(raw.replace(/^\uFEFF/, ''))
    if (queueName) {
      ids = dedupe(snapshot[queueName] ?? [])
    } else if (Array.isArray(snapshot)) {
      ids = dedupe(snapshot)
    } else {
      ids = dedupe(snapshot.ids ?? [])
    }
  }

  if (specificId) {
    ids = ids.filter(youtubeId => youtubeId === specificId)
  }

  if (limit > 0) {
    ids = ids.slice(0, limit)
  }

  return ids
}

function dedupe(values) {
  return [...new Set(values)]
}

function getArgValue(name) {
  const arg = args.find(entry => entry.startsWith(`${name}=`))
  return arg ? arg.slice(name.length + 1) : null
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
