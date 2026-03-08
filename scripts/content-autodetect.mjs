#!/usr/bin/env node

import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { loadSeedData } from './lib/load-seed-data.mjs'
import {
  getExternalPlaybackStatus,
  readValidationCache,
} from './lib/youtube-validation.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CONFIG_PATH = join(ROOT, 'src', 'data', 'content-pipeline-config.json')
const SEED_VIDEOS_PATH = join(ROOT, 'src', 'data', 'seed-videos.ts')
const TRANSCRIPTS_DIR = join(ROOT, 'public', 'transcripts')
const WHISPER_MANIFEST_PATH = join(ROOT, 'scripts', 'whisper-manifest.json')
const YOUTUBE_VALIDATION_PATH = join(ROOT, 'src', 'data', 'youtube-validation-cache.json')

async function main() {
  const config = await readJson(CONFIG_PATH, {
    autoDetectNewVideos: false,
    autoProcessNewVideos: false,
  })

  const { seedVideos } = await loadSeedData(SEED_VIDEOS_PATH)
  const whisperManifest = await readJson(WHISPER_MANIFEST_PATH, {})
  const youtubeValidation = (await readValidationCache(YOUTUBE_VALIDATION_PATH)).videos

  const seen = new Set()
  const videos = seedVideos.filter(video => {
    if (seen.has(video.youtubeId)) return false
    seen.add(video.youtubeId)
    return true
  })

  const detected = []
  for (const video of videos) {
    const transcriptPath = join(TRANSCRIPTS_DIR, `${video.youtubeId}.json`)
    const hasTranscript = existsSync(transcriptPath)
    const hasWhisper = Boolean(whisperManifest[video.youtubeId])
    const validation = youtubeValidation[video.youtubeId] ?? null
    const externalPlaybackStatus = getExternalPlaybackStatus(validation)

    if (externalPlaybackStatus === 'blocked' || !validation || !hasTranscript || !hasWhisper) {
      detected.push({
        youtubeId: video.youtubeId,
        title: video.title,
        hasTranscript,
        hasWhisper,
        externalPlaybackStatus,
        externalPlaybackReason: validation?.reason ?? null,
        nextAction:
          externalPlaybackStatus === 'blocked'
            ? 'delete_blocked'
            : !validation
            ? 'validate_external_access'
            : !hasWhisper
            ? 'run_whisper'
            : 'translate_and_review',
      })
    }
  }

  if (!config.autoDetectNewVideos) {
    console.log('Auto-detect is disabled in src/data/content-pipeline-config.json')
    console.log(`Pending candidates: ${detected.length}`)
    for (const item of detected.slice(0, 20)) {
      const external = item.externalPlaybackStatus === 'blocked'
        ? ` external=${item.externalPlaybackReason}`
        : item.externalPlaybackStatus === 'unchecked'
        ? ' external=unchecked'
        : ''
      console.log(`  ${item.youtubeId} | transcript=${item.hasTranscript} whisper=${item.hasWhisper}${external} | ${item.nextAction}`)
    }
    return
  }

  console.log(`Auto-detect enabled. Pending candidates: ${detected.length}`)
  if (!config.autoProcessNewVideos) {
    console.log('Auto-process is disabled; detection only.')
    return
  }

  console.log('Auto-process is enabled, but processing is intentionally delegated to manual commands for now.')
}

async function readJson(filePath, fallback) {
  if (!existsSync(filePath)) return fallback
  try {
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw.replace(/^\uFEFF/, ''))
  } catch {
    return fallback
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
