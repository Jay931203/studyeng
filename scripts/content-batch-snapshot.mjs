#!/usr/bin/env node

import { existsSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const MANIFEST_PATH = join(ROOT, 'src', 'data', 'content-manifest.json')
const SNAPSHOT_PATH = join(ROOT, 'src', 'data', 'content-existing-batch.json')

async function main() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error('Missing content manifest. Run `npm run content:sync` first.')
    process.exit(1)
  }

  const manifest = JSON.parse((await readFile(MANIFEST_PATH, 'utf-8')).replace(/^\uFEFF/, ''))
  const snapshot = {
    frozenAt: new Date().toISOString(),
    sourceManifestGeneratedAt: manifest.generatedAt,
    targetVideoCount: manifest.summary?.currentVideoCount ?? 0,
    needs_whisper: manifest.summary?.queues?.needsWhisper ?? [],
    needs_translation: manifest.summary?.queues?.needsTranslation ?? [],
    needs_timing_review: manifest.summary?.queues?.needsTimingReview ?? [],
    orphaned: manifest.summary?.queues?.orphanedAssets ?? [],
    needs_clip_review: manifest.summary?.queues?.needsClipReview ?? [],
  }

  await writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + '\n', 'utf-8')

  console.log(`Snapshot written: ${SNAPSHOT_PATH}`)
  console.log(`  needs_whisper: ${snapshot.needs_whisper.length}`)
  console.log(`  needs_translation: ${snapshot.needs_translation.length}`)
  console.log(`  needs_timing_review: ${snapshot.needs_timing_review.length}`)
  console.log(`  orphaned: ${snapshot.orphaned.length}`)
  console.log(`  needs_clip_review: ${snapshot.needs_clip_review.length}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
