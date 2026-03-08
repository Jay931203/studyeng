#!/usr/bin/env node

import { existsSync } from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { execFileSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { loadSeedData } from './lib/load-seed-data.mjs'
import { getSubtitleCoverage } from './lib/transcript-quality.mjs'
import {
  getExternalPlaybackStatus,
  readValidationCache,
} from './lib/youtube-validation.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CONFIG_PATH = join(ROOT, 'src', 'data', 'content-pipeline-config.json')
const SEED_VIDEOS_PATH = join(ROOT, 'src', 'data', 'seed-videos.ts')
const CONTENT_MANIFEST_PATH = join(ROOT, 'src', 'data', 'content-manifest.json')
const DETECTED_BATCH_PATH = join(ROOT, 'src', 'data', 'content-new-video-batch.json')
const TRANSCRIPTS_DIR = join(ROOT, 'public', 'transcripts')
const WHISPER_MANIFEST_PATH = join(ROOT, 'scripts', 'whisper-manifest.json')
const YOUTUBE_VALIDATION_PATH = join(ROOT, 'src', 'data', 'youtube-validation-cache.json')

const args = process.argv.slice(2)
const shouldIngest = args.includes('--ingest')
const shouldWrite = !args.includes('--no-write')

async function main() {
  const config = await readJson(CONFIG_PATH, {
    autoDetectNewVideos: false,
    autoProcessNewVideos: false,
    strictWhisperForNewVideos: true,
    allowLegacyAcceptanceForExistingVideos: true,
  })

  let detection = await detectPendingVideos(config)
  if (shouldWrite) {
    await writeDetectionSnapshot(detection)
  }

  if (!config.autoDetectNewVideos && !shouldIngest) {
    console.log('Auto-detect is disabled in src/data/content-pipeline-config.json')
    printDetectionSummary(detection)
    return
  }

  printDetectionSummary(detection)

  if (!(shouldIngest || config.autoProcessNewVideos)) {
    return
  }

  if (detection.snapshot.ids.length === 0) {
    console.log('\nNo pending new-video pipeline work.')
    return
  }

  if (detection.snapshot.needs_validation.length > 0) {
    runNodeScript('scripts/content-validate-youtube.mjs', [
      `--ids-file=${relativeToRoot(DETECTED_BATCH_PATH)}`,
      '--queue=needs_validation',
      '--no-sync',
    ])
    runNodeScript('scripts/content-system.mjs')
  }

  detection = await refreshDetection(config, shouldWrite)

  if (detection.snapshot.needs_whisper.length > 0) {
    if (!process.env.OPENAI_API_KEY) {
      console.log('\nSkipping whisper ingest because OPENAI_API_KEY is not set.')
    } else {
      runNodeScript('scripts/whisper-regenerate.mjs', [
        `--ids-file=${relativeToRoot(DETECTED_BATCH_PATH)}`,
        '--queue=needs_whisper',
      ])
      runNodeScript('scripts/content-system.mjs')
    }
  }

  detection = await refreshDetection(config, shouldWrite)

  if (detection.snapshot.needs_translation.length > 0) {
    if (!process.env.OPENAI_API_KEY) {
      console.log('\nSkipping translation ingest because OPENAI_API_KEY is not set.')
    } else {
      runNodeScript('scripts/translate-transcripts-openai.mjs', [
        `--ids-file=${relativeToRoot(DETECTED_BATCH_PATH)}`,
        '--queue=needs_translation',
      ])
      runNodeScript('scripts/content-system.mjs')
    }
  }

  detection = await refreshDetection(config, shouldWrite)

  console.log('\n=== Ingest Result ===')
  printDetectionSummary(detection)
}

async function refreshDetection(config, shouldWrite) {
  const detection = await detectPendingVideos(config)
  if (shouldWrite) {
    await writeDetectionSnapshot(detection)
  }
  return detection
}

async function detectPendingVideos(config) {
  const manifest = await readJson(CONTENT_MANIFEST_PATH, null)
  const knownAssetIds = new Set((manifest?.assets ?? []).map((asset) => asset.youtubeId))
  const { seedVideos } = await loadSeedData(SEED_VIDEOS_PATH)
  const whisperManifest = await readJson(WHISPER_MANIFEST_PATH, {})
  const youtubeValidation = (await readValidationCache(YOUTUBE_VALIDATION_PATH)).videos

  const seen = new Set()
  const videos = seedVideos.filter((video) => {
    if (seen.has(video.youtubeId)) return false
    seen.add(video.youtubeId)
    return true
  })

  const detected = []

  for (const video of videos) {
    const transcriptPath = join(TRANSCRIPTS_DIR, `${video.youtubeId}.json`)
    const transcriptEntries = await readJson(transcriptPath, [])
    const coverage = getSubtitleCoverage(transcriptEntries)
    const hasTranscript = coverage.entryCount > 0
    const hasWhisper = Boolean(whisperManifest[video.youtubeId])
    const validation = youtubeValidation[video.youtubeId] ?? null
    const externalPlaybackStatus = getExternalPlaybackStatus(validation)
    const isKnownAsset = knownAssetIds.has(video.youtubeId)
    const legacyTranscriptAccepted =
      isKnownAsset && config.allowLegacyAcceptanceForExistingVideos && hasTranscript
    const transcriptReady =
      hasTranscript && (hasWhisper || legacyTranscriptAccepted || !config.strictWhisperForNewVideos)

    let nextAction = 'none'
    if (externalPlaybackStatus === 'blocked') {
      nextAction = 'delete_blocked'
    } else if (!validation) {
      nextAction = 'validate_external_access'
    } else if (!transcriptReady) {
      nextAction = 'run_whisper'
    } else if (coverage.koreanStatus !== 'complete') {
      nextAction = 'translate_and_review'
    }

    if (nextAction === 'none') {
      continue
    }

    detected.push({
      youtubeId: video.youtubeId,
      title: video.title,
      hasTranscript,
      hasWhisper,
      isKnownAsset,
      transcriptReady,
      externalPlaybackStatus,
      externalPlaybackReason: validation?.reason ?? null,
      englishStatus: coverage.englishStatus,
      koreanStatus: coverage.koreanStatus,
      nextAction,
    })
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    sourceManifestGeneratedAt: manifest?.generatedAt ?? null,
    ids: detected.map((item) => item.youtubeId),
    needs_validation: detected
      .filter((item) => item.nextAction === 'validate_external_access')
      .map((item) => item.youtubeId),
    blocked_external: detected
      .filter((item) => item.nextAction === 'delete_blocked')
      .map((item) => item.youtubeId),
    needs_whisper: detected
      .filter((item) => item.nextAction === 'run_whisper')
      .map((item) => item.youtubeId),
    needs_translation: detected
      .filter((item) => item.nextAction === 'translate_and_review')
      .map((item) => item.youtubeId),
    ready: detected
      .filter((item) => item.nextAction === 'none')
      .map((item) => item.youtubeId),
  }

  return { detected, snapshot }
}

async function writeDetectionSnapshot(detection) {
  await mkdir(dirname(DETECTED_BATCH_PATH), { recursive: true })
  await writeFile(DETECTED_BATCH_PATH, JSON.stringify(detection.snapshot, null, 2) + '\n', 'utf-8')
}

function printDetectionSummary(detection) {
  const { snapshot, detected } = detection
  console.log(`\nPending candidates: ${snapshot.ids.length}`)
  console.log(`  needs_validation: ${snapshot.needs_validation.length}`)
  console.log(`  blocked_external: ${snapshot.blocked_external.length}`)
  console.log(`  needs_whisper: ${snapshot.needs_whisper.length}`)
  console.log(`  needs_translation: ${snapshot.needs_translation.length}`)

  for (const item of detected.slice(0, 20)) {
    const external =
      item.externalPlaybackStatus === 'blocked'
        ? ` external=${item.externalPlaybackReason}`
        : item.externalPlaybackStatus === 'unchecked'
        ? ' external=unchecked'
        : ''
    console.log(
      `  ${item.youtubeId} | transcript=${item.hasTranscript} whisper=${item.hasWhisper}${external} | ${item.nextAction}`,
    )
  }
}

function runNodeScript(scriptPath, scriptArgs = []) {
  console.log(`\n> node ${scriptPath} ${scriptArgs.join(' ')}`.trim())
  execFileSync(process.execPath, [join(ROOT, scriptPath), ...scriptArgs], {
    cwd: ROOT,
    env: process.env,
    stdio: 'inherit',
  })
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

function relativeToRoot(filePath) {
  return filePath.replace(`${ROOT}\\`, '').replaceAll('\\', '/')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
