#!/usr/bin/env node

import { existsSync } from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CONTENT_MANIFEST_PATH = join(ROOT, 'src', 'data', 'content-manifest.json')
const OUTPUT_JSON_PATH = join(ROOT, 'src', 'data', 'content-triage.json')
const OUTPUT_MD_PATH = join(ROOT, 'docs', 'reports', 'content-triage-report.md')

const args = process.argv.slice(2)
const reportArg = getArgValue('--report')

if (!reportArg) {
  console.error('Usage: node scripts/content-triage.mjs --report=PATH_TO_REPORT_BUNDLE.json')
  process.exit(1)
}

async function main() {
  const manifest = await readJson(CONTENT_MANIFEST_PATH, null)
  if (!manifest) {
    console.error('Missing content manifest. Run `npm run content:sync` first.')
    process.exit(1)
  }

  const reportPath = resolve(ROOT, reportArg)
  const report = await readJson(reportPath, null)
  if (!report) {
    console.error(`Could not read report bundle: ${reportPath}`)
    process.exit(1)
  }

  const assetMap = new Map(manifest.assets.map(asset => [asset.youtubeId, asset]))
  const videoMap = new Map(manifest.videos.map(video => [video.id, video]))

  const unresolvedIssues = Array.isArray(report.unresolvedIssues) ? report.unresolvedIssues : []
  const subtitleFlags = Array.isArray(report.subtitleFlags) ? report.subtitleFlags : []

  const triageItems = [
    ...subtitleFlags.map(flag => buildFlagTriage(flag, videoMap, assetMap)),
    ...unresolvedIssues.map(issue => buildIssueTriage(issue, videoMap, assetMap)),
  ].filter(Boolean)

  const output = {
    generatedAt: new Date().toISOString(),
    sourceReportPath: reportPath,
    summary: {
      unresolvedIssueCount: unresolvedIssues.length,
      subtitleFlagCount: subtitleFlags.length,
      triageItemCount: triageItems.length,
      causeCounts: countBy(triageItems, item => item.likelyCause),
      recommendedActionCounts: countBy(triageItems, item => item.repairActionKey),
    },
    items: triageItems,
  }

  await mkdir(dirname(OUTPUT_JSON_PATH), { recursive: true })
  await mkdir(dirname(OUTPUT_MD_PATH), { recursive: true })
  await writeFile(OUTPUT_JSON_PATH, JSON.stringify(output, null, 2) + '\n', 'utf-8')
  await writeFile(OUTPUT_MD_PATH, buildMarkdown(output), 'utf-8')

  console.log('\n=== Content Triage Summary ===\n')
  console.log(`Unresolved issues: ${output.summary.unresolvedIssueCount}`)
  console.log(`Subtitle flags: ${output.summary.subtitleFlagCount}`)
  console.log(`Triage items: ${output.summary.triageItemCount}\n`)

  for (const [cause, count] of Object.entries(output.summary.causeCounts)) {
    console.log(`  ${cause}: ${count}`)
  }
}

function buildFlagTriage(flag, videoMap, assetMap) {
  const video = videoMap.get(flag.videoId)
  if (!video) return null
  const asset = assetMap.get(video.youtubeId)
  const playbook = resolvePlaybook('subtitle', video, asset)

  return {
    source: 'subtitle_flag',
    videoId: video.id,
    youtubeId: video.youtubeId,
    issueType: 'subtitle',
    description: flag.en || 'Flagged subtitle entry',
    entryIndex: flag.entryIndex ?? null,
    videoWorkflowStatus: video.workflowStatus,
    assetWorkflowStatus: asset?.workflowStatus ?? 'unknown',
    likelyCause: playbook.likelyCause,
    preventionSignal: playbook.preventionSignal,
    repairActionKey: playbook.repairActionKey,
    repairAction: playbook.repairAction,
    recommendedCommand: playbook.recommendedCommand(video, asset),
  }
}

function buildIssueTriage(issue, videoMap, assetMap) {
  const video = videoMap.get(issue.videoId)
  if (!video) return null
  const asset = assetMap.get(video.youtubeId)
  const playbook = resolvePlaybook(issue.type, video, asset)

  return {
    source: 'admin_issue',
    videoId: video.id,
    youtubeId: video.youtubeId,
    issueType: issue.type,
    description: issue.description || 'Reported issue',
    entryIndex: null,
    videoWorkflowStatus: video.workflowStatus,
    assetWorkflowStatus: asset?.workflowStatus ?? 'unknown',
    likelyCause: playbook.likelyCause,
    preventionSignal: playbook.preventionSignal,
    repairActionKey: playbook.repairActionKey,
    repairAction: playbook.repairAction,
    recommendedCommand: playbook.recommendedCommand(video, asset),
  }
}

function resolvePlaybook(issueType, video, asset) {
  if (video.workflowStatus === 'needs_clip_review') {
    return {
      likelyCause: 'clip_range_out_of_policy',
      preventionSignal: 'clip duration left the 45-70s policy band before review',
      repairActionKey: 'adjust_clip_range',
      repairAction: 'Adjust clipStart/clipEnd in seed-videos.ts and re-run content sync.',
      recommendedCommand: () => 'npm run content:sync',
    }
  }

  if (asset?.qualityIssueTypes?.GAP || asset?.qualityIssueTypes?.OVERLAP) {
    return {
      likelyCause: 'subtitle_gap_from_segmentation',
      preventionSignal: 'check-transcripts reported GAP or OVERLAP for this asset',
      repairActionKey: 'fix_timing_gaps',
      repairAction: 'Regenerate or manually tighten subtitle timing, then verify with transcripts:check.',
      recommendedCommand: (_video, currentAsset) => `node scripts/fix-transcript-gaps.mjs --id=${currentAsset?.youtubeId ?? video.youtubeId}`,
    }
  }

  if (asset?.qualityIssueTypes?.DURATION_LONG || asset?.qualityIssueTypes?.TEXT_LONG) {
    return {
      likelyCause: 'subtitle_segments_too_long',
      preventionSignal: 'check-transcripts reported DURATION_LONG or TEXT_LONG',
      repairActionKey: 'split_long_segments',
      repairAction: 'Split long subtitle blocks or re-run auto-fix, then verify again.',
      recommendedCommand: () => 'node scripts/check-transcripts.mjs --fix',
    }
  }

  if (!asset || asset.workflowStatus === 'needs_whisper') {
    return {
      likelyCause: 'english_subtitles_not_whispered',
      preventionSignal: 'whisperStatus was missing in content-manifest.json',
      repairActionKey: 'run_whisper',
      repairAction: 'Run Whisper once for this youtubeId and let the manifest lock future reprocessing.',
      recommendedCommand: (_video, currentAsset) => `node scripts/whisper-regenerate.mjs --id=${currentAsset?.youtubeId ?? video.youtubeId}`,
    }
  }

  if (asset.workflowStatus === 'needs_translation') {
    return {
      likelyCause: 'korean_subtitles_incomplete',
      preventionSignal: 'koreanSubtitleStatus was not complete in content-manifest.json',
      repairActionKey: 'translate_korean',
      repairAction: 'Fill Korean subtitles for the static transcript and re-run content sync.',
      recommendedCommand: (_video, currentAsset) => `npm run content:sync -- --queue=needs_translation`,
    }
  }

  if (issueType === 'video') {
    return {
      likelyCause: 'clip_content_mismatch',
      preventionSignal: 'user-reported video issue without matching subtitle pipeline error',
      repairActionKey: 'manual_clip_review',
      repairAction: 'Review the clip content and timing manually, then update seed-videos.ts if needed.',
      recommendedCommand: () => 'npm run content:sync',
    }
  }

  return {
    likelyCause: 'manual_review_required',
    preventionSignal: 'report did not match an existing automated signal',
    repairActionKey: 'manual_review',
    repairAction: 'Inspect the transcript and clip manually, then sync the manifest again.',
    recommendedCommand: () => 'npm run content:sync',
  }
}

function buildMarkdown(output) {
  return [
    '# Content Triage Report',
    '',
    `Generated: ${output.generatedAt}`,
    `Source report: ${output.sourceReportPath}`,
    '',
    '## Summary',
    '',
    `- Unresolved issues: ${output.summary.unresolvedIssueCount}`,
    `- Subtitle flags: ${output.summary.subtitleFlagCount}`,
    `- Triage items: ${output.summary.triageItemCount}`,
    '',
    '## Root Causes',
    '',
    ...Object.entries(output.summary.causeCounts).map(([cause, count]) => `- ${cause}: ${count}`),
    '',
    '## Items',
    '',
    ...output.items.map(item => [
      `- ${item.videoId} (${item.issueType})`,
      `  cause: ${item.likelyCause}`,
      `  signal: ${item.preventionSignal}`,
      `  fix: ${item.repairAction}`,
      `  command: ${item.recommendedCommand}`,
    ].join('\n')),
    '',
  ].join('\n')
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

function countBy(items, selector) {
  const counts = {}
  for (const item of items) {
    const key = selector(item) ?? 'unknown'
    counts[key] = (counts[key] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])))
}

function getArgValue(name) {
  const arg = args.find(entry => entry.startsWith(`${name}=`))
  return arg ? arg.slice(name.length + 1) : null
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
