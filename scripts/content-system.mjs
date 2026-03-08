#!/usr/bin/env node

import { existsSync } from 'fs'
import { mkdir, readdir, readFile, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { loadSeedData } from './lib/load-seed-data.mjs'
import {
  buildAssetRecommendationSignals,
  buildRecommendationManifest,
} from './lib/recommendation-manifest.mjs'
import {
  TRANSCRIPT_RULES,
  checkTranscript,
  filterIssuesByReview,
  getSubtitleCoverage,
  summarizeIssues,
} from './lib/transcript-quality.mjs'
import {
  getExternalPlaybackStatus,
  readValidationCache,
} from './lib/youtube-validation.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SEED_VIDEOS_PATH = join(ROOT, 'src', 'data', 'seed-videos.ts')
const TRANSCRIPTS_DIR = join(ROOT, 'public', 'transcripts')
const WHISPER_MANIFEST_PATH = join(__dirname, 'whisper-manifest.json')
const YOUTUBE_VALIDATION_PATH = join(ROOT, 'src', 'data', 'youtube-validation-cache.json')
const REVIEW_REGISTRY_PATH = join(ROOT, 'src', 'data', 'content-review-registry.json')
const CONTENT_MANIFEST_PATH = join(ROOT, 'src', 'data', 'content-manifest.json')
const RECOMMENDATION_MANIFEST_PATH = join(ROOT, 'src', 'data', 'recommendation-manifest.json')
const CONTENT_REPORT_PATH = join(ROOT, 'docs', 'reports', 'content-system-report.md')
const TARGET_VIDEO_COUNT = 1000

const args = process.argv.slice(2)
const queueName = getArgValue('--queue')
const scope = getArgValue('--scope') || 'assets'
const limit = Number.parseInt(getArgValue('--limit') || '20', 10)
const writeOutputs = !args.includes('--no-write')

async function main() {
  const { categories, seedVideos, series } = await loadSeedData(SEED_VIDEOS_PATH)
  const whisperManifest = await readJson(WHISPER_MANIFEST_PATH, {})
  const reviewRegistry = await readJson(REVIEW_REGISTRY_PATH, {
    acceptedIssueOverrides: {},
    archivedOrphanAssets: {},
  })
  const youtubeValidation = (await readValidationCache(YOUTUBE_VALIDATION_PATH)).videos
  const categoryIds = new Set(categories.map(category => category.id))
  const seriesMap = new Map(series.map(entry => [entry.id, entry]))
  const videosByYoutubeId = groupBy(seedVideos, video => video.youtubeId)
  const assetRecommendationSignals = new Map()
  const archivedOrphanIds = new Set(Object.keys(reviewRegistry.archivedOrphanAssets ?? {}))
  const transcriptYoutubeIds = existsSync(TRANSCRIPTS_DIR)
    ? (await readdir(TRANSCRIPTS_DIR))
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace(/\.json$/i, ''))
        .filter(youtubeId => !archivedOrphanIds.has(youtubeId))
    : []
  const allYoutubeIds = unique([
    ...videosByYoutubeId.keys(),
    ...transcriptYoutubeIds,
    ...Object.keys(whisperManifest),
  ]).sort((a, b) => a.localeCompare(b))

  const assets = []
  for (const youtubeId of allYoutubeIds) {
    const videos = videosByYoutubeId.get(youtubeId) ?? []
    const transcriptPath = join(TRANSCRIPTS_DIR, `${youtubeId}.json`)
    const transcript = await readJson(transcriptPath, null)
    const transcriptEntries = Array.isArray(transcript) ? transcript : []
    const coverage = getSubtitleCoverage(transcriptEntries)
    const rawIssues = checkTranscript(transcriptEntries)
    const issues = filterIssuesByReview(youtubeId, rawIssues, reviewRegistry)
    const issueCounts = summarizeIssues(issues)
    const whisperEntry = whisperManifest[youtubeId] ?? null
    const validationEntry = youtubeValidation[youtubeId] ?? null
    const whisperStatus = whisperEntry ? 'done' : 'missing'
    const transcriptSource = whisperEntry ? 'whisper' : transcriptEntries.length > 0 ? 'static' : 'missing'
    const timingStatus = transcriptEntries.length === 0 ? 'missing' : issues.length > 0 ? 'needs_review' : 'pass'
    const externalPlaybackStatus = getExternalPlaybackStatus(validationEntry)
    const workflowStatus = resolveAssetWorkflowStatus({
      externalPlaybackStatus,
      whisperStatus,
      koreanStatus: coverage.koreanStatus,
      timingStatus,
      linkedVideoCount: videos.length,
    })

    assetRecommendationSignals.set(
      youtubeId,
      buildAssetRecommendationSignals({
        coverage,
        transcriptEntries,
      })
    )

    assets.push({
      youtubeId,
      transcriptPath: transcriptEntries.length > 0 ? relativeToRoot(transcriptPath) : null,
      linkedVideoIds: videos.map(video => video.id),
      linkedSeriesIds: unique(videos.map(video => video.seriesId).filter(Boolean)),
      clipCount: videos.length,
      transcriptEntryCount: coverage.entryCount,
      transcriptSource,
      externalPlaybackStatus,
      externalPlaybackReason: validationEntry?.reason ?? null,
      externalValidationCheckedAt: validationEntry?.checkedAt ?? null,
      externalValidationStatus: validationEntry?.status ?? 'unchecked',
      englishSubtitleStatus: coverage.englishStatus,
      koreanSubtitleStatus: coverage.koreanStatus,
      timingStatus,
      whisperStatus,
      whisper: whisperEntry
        ? {
            provider: whisperEntry.provider,
            model: whisperEntry.model,
            processedAt: whisperEntry.processedAt,
            cost: whisperEntry.cost,
          }
        : null,
      qualityIssueCount: issues.length,
      acceptedQualityIssueCount: rawIssues.length - issues.length,
      qualityIssueTypes: issueCounts,
      qualityIssues: issues.map(issue => ({
        type: issue.type,
        idx: issue.idx,
        start: issue.start,
        end: issue.end,
      })),
      workflowStatus,
      nextAction: resolveNextAction(workflowStatus),
    })
  }

  const assetMap = new Map(assets.map(asset => [asset.youtubeId, asset]))
  const videos = seedVideos.map(video => {
    const asset = assetMap.get(video.youtubeId)
    const clipDurationSec = round2(video.clipEnd - video.clipStart)
    const clipDurationStatus = resolveClipDurationStatus(clipDurationSec)
    const metadataStatus = resolveMetadataStatus(video, categoryIds, seriesMap)
    const workflowStatus = resolveVideoWorkflowStatus({
      metadataStatus,
      clipDurationStatus,
      assetWorkflowStatus: asset?.workflowStatus ?? 'needs_whisper',
    })

    return {
      id: video.id,
      youtubeId: video.youtubeId,
      title: video.title,
      category: video.category,
      seriesId: video.seriesId ?? null,
      episodeNumber: video.episodeNumber ?? null,
      clipStart: video.clipStart,
      clipEnd: video.clipEnd,
      clipDurationSec,
      clipDurationStatus,
      metadataStatus,
      externalPlaybackStatus: asset?.externalPlaybackStatus ?? 'unchecked',
      assetWorkflowStatus: asset?.workflowStatus ?? 'needs_whisper',
      workflowStatus,
      nextAction: resolveNextAction(workflowStatus),
    }
  })

  const manifest = buildManifest({
    categories,
    series,
    videos,
    assets,
    reviewRegistry,
  })
  const recommendationManifest = buildRecommendationManifest({
    assets,
    assetSignals: assetRecommendationSignals,
    generatedAt: new Date().toISOString(),
    sourceManifestGeneratedAt: manifest.generatedAt,
    videos,
  })

  if (writeOutputs) {
    await mkdir(dirname(CONTENT_MANIFEST_PATH), { recursive: true })
    await mkdir(dirname(CONTENT_REPORT_PATH), { recursive: true })
    await writeFile(CONTENT_MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8')
    await writeFile(
      RECOMMENDATION_MANIFEST_PATH,
      JSON.stringify(recommendationManifest, null, 2) + '\n',
      'utf-8'
    )
    await writeFile(CONTENT_REPORT_PATH, buildMarkdownReport(manifest), 'utf-8')
  }

  printSummary(manifest, queueName, scope, limit)
}

function buildManifest({ categories, series, videos, assets, reviewRegistry }) {
  const summary = {
    targetVideoCount: TARGET_VIDEO_COUNT,
    currentVideoCount: videos.length,
    currentAssetCount: assets.length,
    remainingToTarget: Math.max(0, TARGET_VIDEO_COUNT - videos.length),
    currentSeriesCount: series.length,
    orphanAssetCount: assets.filter(asset => asset.workflowStatus === 'orphaned').length,
    archivedOrphanCount: Object.keys(reviewRegistry.archivedOrphanAssets ?? {}).length,
    acceptedTimingIssueCount: assets.reduce((sum, asset) => sum + (asset.acceptedQualityIssueCount ?? 0), 0),
    categoryCounts: countBy(videos, video => video.category),
    videoWorkflowCounts: countBy(videos, video => video.workflowStatus),
    assetWorkflowCounts: countBy(assets, asset => asset.workflowStatus),
    clipDurationCounts: countBy(videos, video => video.clipDurationStatus),
    whisperCounts: countBy(assets, asset => asset.whisperStatus),
    externalPlaybackCounts: countBy(assets, asset => asset.externalPlaybackStatus),
    koreanSubtitleCounts: countBy(assets, asset => asset.koreanSubtitleStatus),
    timingCounts: countBy(assets, asset => asset.timingStatus),
    seriesBalance: buildSeriesBalance(videos, series),
    queues: {
      blockedExternal: assets.filter(asset => asset.workflowStatus === 'blocked_external').map(asset => asset.youtubeId),
      needsWhisper: assets.filter(asset => asset.workflowStatus === 'needs_whisper').map(asset => asset.youtubeId),
      needsTranslation: assets.filter(asset => asset.workflowStatus === 'needs_translation').map(asset => asset.youtubeId),
      needsTimingReview: assets.filter(asset => asset.workflowStatus === 'needs_timing_review').map(asset => asset.youtubeId),
      orphanedAssets: assets.filter(asset => asset.workflowStatus === 'orphaned').map(asset => asset.youtubeId),
      readyAssets: assets.filter(asset => asset.workflowStatus === 'ready').map(asset => asset.youtubeId),
      needsClipReview: videos.filter(video => video.workflowStatus === 'needs_clip_review').map(video => video.id),
      needsMetadata: videos.filter(video => video.workflowStatus === 'needs_metadata').map(video => video.id),
    },
  }

  return {
    generatedAt: new Date().toISOString(),
    rules: {
      transcript: TRANSCRIPT_RULES,
      clipDurationSec: {
        acceptableMin: 45,
        acceptableMax: 70,
        optimalMin: 50,
        optimalMax: 65,
      },
    },
    summary,
    categories: categories.map(category => ({
      id: category.id,
      label: category.label,
      videoCount: summary.categoryCounts[category.id] ?? 0,
      targetFor1000: Math.ceil(TARGET_VIDEO_COUNT / categories.length),
      remainingToEqualTarget: Math.max(0, Math.ceil(TARGET_VIDEO_COUNT / categories.length) - (summary.categoryCounts[category.id] ?? 0)),
    })),
    series: summary.seriesBalance,
    assets,
    videos,
  }
}

function buildSeriesBalance(videos, series) {
  const counts = countBy(
    videos.filter(video => video.seriesId),
    video => video.seriesId
  )
  const seriesEntries = series.map(entry => ({
    id: entry.id,
    title: entry.title,
    category: entry.category,
    videoCount: counts[entry.id] ?? 0,
  }))
  const total = seriesEntries.reduce((sum, entry) => sum + entry.videoCount, 0)
  const average = seriesEntries.length > 0 ? total / seriesEntries.length : 0

  return seriesEntries
    .map(entry => ({
      ...entry,
      deltaFromAverage: round2(entry.videoCount - average),
      balanceStatus:
        entry.videoCount < average * 0.8
          ? 'underfilled'
          : entry.videoCount > average * 1.2
          ? 'overfilled'
          : 'balanced',
    }))
    .sort((a, b) => a.videoCount - b.videoCount || a.id.localeCompare(b.id))
}

function buildMarkdownReport(manifest) {
  const { summary } = manifest
  const underfilled = manifest.series.filter(series => series.balanceStatus === 'underfilled').slice(0, 10)
  const overfilled = manifest.series.filter(series => series.balanceStatus === 'overfilled').slice(-10).reverse()
  const blockedExternal = manifest.assets
    .filter(asset => asset.workflowStatus === 'blocked_external')
    .sort((a, b) => a.youtubeId.localeCompare(b.youtubeId))
    .slice(0, 20)
  const topTimingReview = manifest.assets
    .filter(asset => asset.workflowStatus === 'needs_timing_review')
    .sort((a, b) => b.qualityIssueCount - a.qualityIssueCount || a.youtubeId.localeCompare(b.youtubeId))
    .slice(0, 15)

  return [
    '# Content System Report',
    '',
    `Generated: ${manifest.generatedAt}`,
    '',
    '## Snapshot',
    '',
    `- Videos: ${summary.currentVideoCount} / ${summary.targetVideoCount}`,
    `- Assets: ${summary.currentAssetCount}`,
    `- Orphan assets: ${summary.orphanAssetCount}`,
    `- Archived orphan assets: ${summary.archivedOrphanCount}`,
    `- Series: ${summary.currentSeriesCount}`,
    `- Remaining to target: ${summary.remainingToTarget}`,
    '',
    '## Workflow Counts',
    '',
    ...Object.entries(summary.assetWorkflowCounts).map(([status, count]) => `- Assets ${status}: ${count}`),
    ...Object.entries(summary.videoWorkflowCounts).map(([status, count]) => `- Videos ${status}: ${count}`),
    '',
    '## Category Counts',
    '',
    ...manifest.categories.map(category => `- ${category.id}: ${category.videoCount}`),
    '',
    '## Underfilled Series',
    '',
    ...(underfilled.length > 0
      ? underfilled.map(entry => `- ${entry.id}: ${entry.videoCount} videos (${entry.deltaFromAverage} vs avg)`)
      : ['- none']),
    '',
    '## Overfilled Series',
    '',
    ...(overfilled.length > 0
      ? overfilled.map(entry => `- ${entry.id}: ${entry.videoCount} videos (${entry.deltaFromAverage} vs avg)`)
      : ['- none']),
    '',
    '## Blocked External Videos',
    '',
    ...(blockedExternal.length > 0
      ? blockedExternal.map(asset => `- ${asset.youtubeId}: ${asset.externalPlaybackReason ?? 'external_restricted'}`)
      : ['- none']),
    '',
    '## Timing Review Queue',
    '',
    ...(topTimingReview.length > 0
      ? topTimingReview.map(asset => `- ${asset.youtubeId}: ${asset.qualityIssueCount} issues`)
      : ['- none']),
    '',
    '## Reviewed Exceptions',
    '',
    `- Accepted timing issues: ${summary.acceptedTimingIssueCount}`,
    `- Archived orphan assets: ${summary.archivedOrphanCount}`,
    '',
  ].join('\n')
}

function printSummary(manifest, queueName, scope, limit) {
  const { summary } = manifest

  console.log('\n=== Content System Summary ===\n')
  console.log(`Videos: ${summary.currentVideoCount} / ${summary.targetVideoCount}`)
  console.log(`Assets: ${summary.currentAssetCount}`)
  console.log(`Series: ${summary.currentSeriesCount}`)
  console.log(`Remaining to target: ${summary.remainingToTarget}\n`)

  console.log('Asset workflow:')
  for (const [status, count] of Object.entries(summary.assetWorkflowCounts)) {
    console.log(`  ${status}: ${count}`)
  }

  console.log('\nVideo workflow:')
  for (const [status, count] of Object.entries(summary.videoWorkflowCounts)) {
    console.log(`  ${status}: ${count}`)
  }

  if (!queueName) {
    console.log('\nQueues:')
    console.log(`  blockedExternal: ${summary.queues.blockedExternal.length}`)
    console.log(`  needsWhisper: ${summary.queues.needsWhisper.length}`)
    console.log(`  needsTranslation: ${summary.queues.needsTranslation.length}`)
    console.log(`  needsTimingReview: ${summary.queues.needsTimingReview.length}`)
    console.log(`  needsClipReview: ${summary.queues.needsClipReview.length}`)
    console.log(`  needsMetadata: ${summary.queues.needsMetadata.length}`)
    console.log(`  orphanedAssets: ${summary.queues.orphanedAssets.length}`)
    console.log(`  archivedOrphanAssets: ${summary.archivedOrphanCount}`)
    console.log(`  readyAssets: ${summary.queues.readyAssets.length}`)
    return
  }

  const queueItems = readQueue(manifest, queueName, scope)
  console.log(`\nQueue ${queueName} (${scope})`)
  for (const item of queueItems.slice(0, limit)) {
    console.log(`  ${formatQueueItem(item, scope)}`)
  }
  if (queueItems.length > limit) {
    console.log(`  ... ${queueItems.length - limit} more`)
  }
}

function readQueue(manifest, queueName, scope) {
  if (scope === 'videos') {
    return manifest.videos.filter(video => video.workflowStatus === queueName)
  }
  return manifest.assets.filter(asset => asset.workflowStatus === queueName)
}

function formatQueueItem(item, scope) {
  if (scope === 'videos') {
    return `${item.id} | ${item.seriesId ?? 'standalone'} | ${item.clipDurationSec}s | ${item.nextAction}`
  }
  return `${item.youtubeId} | ${item.transcriptEntryCount} entries | ${item.nextAction}`
}

function resolveAssetWorkflowStatus({ externalPlaybackStatus, whisperStatus, koreanStatus, timingStatus, linkedVideoCount }) {
  if (linkedVideoCount === 0) return 'orphaned'
  if (externalPlaybackStatus === 'blocked') return 'blocked_external'
  if (whisperStatus !== 'done') return 'needs_whisper'
  if (koreanStatus !== 'complete') return 'needs_translation'
  if (timingStatus !== 'pass') return 'needs_timing_review'
  return 'ready'
}

function resolveVideoWorkflowStatus({ metadataStatus, clipDurationStatus, assetWorkflowStatus }) {
  if (assetWorkflowStatus === 'blocked_external') return 'blocked_external'
  if (metadataStatus !== 'complete') return 'needs_metadata'
  if (clipDurationStatus === 'too_short' || clipDurationStatus === 'too_long') return 'needs_clip_review'
  return assetWorkflowStatus
}

function resolveMetadataStatus(video, categoryIds, seriesMap) {
  if (!categoryIds.has(video.category)) return 'missing_category'
  if (video.seriesId && !seriesMap.has(video.seriesId)) return 'missing_series'
  return 'complete'
}

function resolveClipDurationStatus(durationSec) {
  if (durationSec < 45) return 'too_short'
  if (durationSec > 70) return 'too_long'
  if (durationSec >= 50 && durationSec <= 65) return 'optimal'
  return 'acceptable'
}

function resolveNextAction(workflowStatus) {
  switch (workflowStatus) {
    case 'needs_whisper':
      return 'run_whisper'
    case 'needs_translation':
      return 'translate_korean'
    case 'needs_timing_review':
      return 'review_timing'
    case 'blocked_external':
      return 'delete_from_seed'
    case 'orphaned':
      return 'link_seed_video'
    case 'needs_clip_review':
      return 'adjust_clip_range'
    case 'needs_metadata':
      return 'fix_metadata'
    default:
      return 'none'
  }
}

function relativeToRoot(filePath) {
  return filePath.replace(`${ROOT}\\`, '').replaceAll('\\', '/')
}

function groupBy(items, selector) {
  const map = new Map()
  for (const item of items) {
    const key = selector(item)
    const bucket = map.get(key)
    if (bucket) {
      bucket.push(item)
    } else {
      map.set(key, [item])
    }
  }
  return map
}

function countBy(items, selector) {
  const counts = {}
  for (const item of items) {
    const key = selector(item) ?? 'unknown'
    counts[key] = (counts[key] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])))
}

function unique(values) {
  return [...new Set(values)]
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

function getArgValue(name) {
  const arg = args.find(entry => entry.startsWith(`${name}=`))
  return arg ? arg.slice(name.length + 1) : null
}

function round2(value) {
  return Math.round(value * 100) / 100
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
