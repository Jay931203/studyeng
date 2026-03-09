#!/usr/bin/env node

import { existsSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { loadEnv } from './lib/load-env.mjs'

loadEnv()

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const MANIFEST_PATH = join(ROOT, 'src', 'data', 'content-manifest.json')
const REVIEW_REGISTRY_PATH = join(ROOT, 'src', 'data', 'content-review-registry.json')
const TRANSCRIPTS_DIR = join(ROOT, 'public', 'transcripts')

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY environment variable required')
  process.exit(1)
}

const args = process.argv.slice(2)
const specificId = getArgValue('--id')
const idsFile = getArgValue('--ids-file')
const dryRun = args.includes('--dry')
const auditAll = args.includes('--all')
const finalPass = args.includes('--final-pass')
const model = getArgValue('--model') || 'gpt-4o-mini'
const batchSize = Number.parseInt(getArgValue('--batch') || '20', 10)
const concurrency = Number.parseInt(getArgValue('--concurrency') || '4', 10)
const reportPath = getArgValue('--report') || join(ROOT, 'logs', 'transcript-audit-openai-report.json')

async function main() {
  const manifest = await readJson(MANIFEST_PATH, null)
  if (!manifest) {
    console.error('Missing content manifest. Run `npm run content:sync` first.')
    process.exit(1)
  }

  const reviewRegistry = await readJson(REVIEW_REGISTRY_PATH, {
    archivedOrphanAssets: {},
  })
  const archivedIds = new Set(Object.keys(reviewRegistry.archivedOrphanAssets ?? {}))
  const targetIds = await resolveTargetIds(manifest, archivedIds)

  console.log(
    `Auditing ${targetIds.length} transcript assets with OpenAI (${model}, batch=${batchSize}, concurrency=${concurrency}, all=${auditAll}, finalPass=${finalPass})`,
  )

  const queue = [...targetIds]
  const summary = {
    model,
    batchSize,
    concurrency,
    dryRun,
    auditAll,
    finalPass,
    filesSelected: queue.length,
    filesChanged: 0,
    filesSkipped: 0,
    filesFailed: 0,
    entriesUpdated: 0,
    results: [],
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length > 0) {
      const youtubeId = queue.shift()
      if (!youtubeId) break
      const result = await auditFile(youtubeId)
      summary.results.push(result)
      if (result.status === 'changed') {
        summary.filesChanged += 1
        summary.entriesUpdated += result.entriesUpdated
      } else if (result.status === 'skipped') {
        summary.filesSkipped += 1
      } else {
        summary.filesFailed += 1
      }
    }
  })

  await Promise.all(workers)
  summary.results.sort((a, b) => a.youtubeId.localeCompare(b.youtubeId))
  await writeFile(reportPath, JSON.stringify(summary, null, 2) + '\n', 'utf-8')

  console.log(
    `Done: ${summary.filesChanged} changed, ${summary.filesSkipped} skipped, ${summary.filesFailed} failed, ${summary.entriesUpdated} entries updated`,
  )
  console.log(`Report saved to ${reportPath}`)
}

async function resolveTargetIds(manifest, archivedIds) {
  if (specificId) return [specificId]

  if (idsFile) {
    const idsData = await readJson(idsFile, [])
    return resolveIdsFromFile(idsData)
  }

  const results = []
  for (const asset of manifest.assets ?? []) {
    if (!asset.youtubeId || archivedIds.has(asset.youtubeId)) continue
    if (!asset.transcriptPath) continue

    const transcriptPath = join(ROOT, asset.transcriptPath)
    if (!existsSync(transcriptPath)) continue

    if (auditAll) {
      results.push(asset.youtubeId)
      continue
    }

    const entries = await readJson(transcriptPath, [])
    if (Array.isArray(entries) && entries.some((entry) => needsAuditEntry(entry) || needsEnglishAuditEntry(entry))) {
      results.push(asset.youtubeId)
    }
  }

  return results
}

async function auditFile(youtubeId) {
  const transcriptPath = join(TRANSCRIPTS_DIR, `${youtubeId}.json`)
  const entries = await readJson(transcriptPath, [])
  if (!Array.isArray(entries) || entries.length === 0) {
    console.log(`  ${youtubeId}... SKIP (empty transcript)`)
    return { youtubeId, status: 'skipped', entriesUpdated: 0, reason: 'empty-transcript' }
  }

  const originalEntries = structuredClone(entries)
  const targets = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => auditAll || needsAuditEntry(entry) || needsEnglishAuditEntry(entry))

  if (targets.length === 0) {
    return { youtubeId, status: 'skipped', entriesUpdated: 0, reason: 'no-targets' }
  }

  console.log(`  ${youtubeId}... ${entries.length} entries (${targets.length} targets)`)

  if (dryRun) {
    return { youtubeId, status: 'skipped', entriesUpdated: 0, reason: 'dry-run' }
  }

  try {
    for (let start = 0; start < targets.length; start += batchSize) {
      const batch = targets.slice(start, start + batchSize)
      const corrected = await auditBatch(
        batch.map(({ entry, index }) => ({
          index,
          en: entry.en ?? '',
          ko: entry.ko ?? '',
          prevEn: entries[index - 1]?.en ?? '',
          prevKo: entries[index - 1]?.ko ?? '',
          nextEn: entries[index + 1]?.en ?? '',
          nextKo: entries[index + 1]?.ko ?? '',
        })),
      )

      for (const item of corrected) {
        const target = entries[item.index]
        if (!target) continue
        target.en = sanitizeEnglishEdit(target.en ?? '', item.en)
        target.ko = normalizeKorean(item.ko, target.ko ?? '')
      }
    }

    const updated = JSON.stringify(entries, null, 2) + '\n'
    const original = JSON.stringify(originalEntries, null, 2) + '\n'
    if (updated !== original) {
      await writeFileWithRetry(transcriptPath, updated, 'utf-8')
      return {
        youtubeId,
        status: 'changed',
        entriesUpdated: countChangedEntries(originalEntries, entries),
      }
    }

    return { youtubeId, status: 'skipped', entriesUpdated: 0, reason: 'no-diff' }
  } catch (error) {
    console.log(`    FAILED: ${error.message}`)
    return { youtubeId, status: 'failed', entriesUpdated: 0, reason: error.message }
  }
}

async function auditBatch(items) {
  if (items.length === 0) return []

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content:
            finalPass
              ? 'You are doing a final subtitle cleanup pass for a Korean language-learning app. Preserve timing alignment and speaker intent. English must keep the original wording unless there is an obvious punctuation, spacing, or capitalization issue; do not paraphrase or rewrite wording. Only add or fix commas, periods, question marks, apostrophes, capitalization, or obvious spacing when clearly needed. Korean must be concise, natural spoken Korean, faithful to the line, and usually read like one clean subtitle line rather than multiple written sentences. Each item includes adjacent context fields (prevEn, prevKo, nextEn, nextKo). Use them to fix neighboring-line alignment problems: if one English sentence spills across two subtitle chunks, make each Korean line read naturally for its own chunk without copying the same Korean into both lines or leaving the meaning attached to the wrong chunk. During this final pass, aggressively fix these leftovers when present: repeated neighboring Korean lines that should differ, Korean lines with too many sentence-ending marks, stray Latin words left in Korean, overly long literal Korean, mistranslation caused by bad chunk boundaries, mojibake, hanja, and Japanese. For chant or lyric lines, keep the energy but avoid stacking many exclamation points or chopping into awkward mini-sentences. Do not mention the context fields in the output. Return strict JSON only as {"items":[{"index":0,"en":"...","ko":"..."}]}. Return every input item exactly once and in the same order.'
              : 'You are a subtitle QA editor for a Korean language-learning app. Preserve timing alignment and speaker intent. English must keep the original wording unless there is an obvious punctuation, spacing, or capitalization issue; do not paraphrase or upgrade the sentence. Only add or fix commas, periods, question marks, apostrophes, capitalization, or obvious spacing when clearly needed. Korean should be natural spoken Korean that matches the context, but must stay faithful and not become overly free. Each item includes adjacent context fields (prevEn, prevKo, nextEn, nextKo). Use them to avoid duplicated neighboring Korean lines and to correct mistranslation caused by arbitrary Whisper chunk boundaries. Fix mojibake, literal awkwardness, mistranslation, hanja, Japanese, and stray English unless a proper noun must remain. Do not mention the context fields in the output. Return strict JSON only as {"items":[{"index":0,"en":"...","ko":"..."}]}. Return every input item exactly once and in the same order.',
        },
        {
          role: 'user',
          content: JSON.stringify({ items }),
        },
      ],
      response_format: {
        type: 'json_object',
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI API ${response.status}: ${text.slice(0, 300)}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || '{}'
  const parsed = JSON.parse(content)
  const list = Array.isArray(parsed) ? parsed : parsed.items

  if (!Array.isArray(list) || list.length !== items.length) {
    if (items.length === 1) {
      throw new Error('Invalid response shape for batch of 1')
    }
    const mid = Math.ceil(items.length / 2)
    return [
      ...(await auditBatch(items.slice(0, mid))),
      ...(await auditBatch(items.slice(mid))),
    ]
  }

  for (let i = 0; i < list.length; i++) {
    if (list[i]?.index !== items[i].index) {
      if (items.length === 1) {
        throw new Error(`Response index mismatch at position ${i}`)
      }
      const mid = Math.ceil(items.length / 2)
      return [
        ...(await auditBatch(items.slice(0, mid))),
        ...(await auditBatch(items.slice(mid))),
      ]
    }
  }

  return list
}

function needsAuditEntry(entry) {
  const ko = typeof entry?.ko === 'string' ? entry.ko.trim() : ''
  if (!ko) return true
  if (containsLikelyMojibake(ko)) return true
  if (containsHanOrKana(ko)) return true
  if (looksLikeEnglishLeak(entry?.en, ko)) return true
  return false
}

function needsEnglishAuditEntry(entry) {
  const en = typeof entry?.en === 'string' ? entry.en.trim() : ''
  if (!en) return false
  if (/[.!?]["']?$/.test(en)) return false
  if (/[,;:]$/.test(en)) return false

  const words = en.split(/\s+/)
  if (words.length < 4) return false
  if (/^(oh|yeah|ooh|ah|la|na|mm|hmm)\b/i.test(en)) return false
  if (/\b(and|or|but|so|because|cause|to|of|for|with|in|on|at|if|when|that)\b$/i.test(en)) return false

  return /^(I|I'm|I've|I'll|I'd|You|You're|You'll|He|He's|She|She's|We|We're|They|They're|It|It's|What|Why|How|When|Where|Who|Is|Are|Do|Did|Can|Could|Should|Would|Will|Won't|Don't|Let's|No one|Somebody|Look|Baby)\b/i.test(
    en,
  )
}

function containsLikelyMojibake(value) {
  return /�|占|\?\?/.test(value) || /[\uF900-\uFAFF]/u.test(value)
}

function containsHanOrKana(value) {
  return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(value)
}

function looksLikeEnglishLeak(enValue, koValue) {
  const en = normalizeComparable(enValue)
  const ko = normalizeComparable(koValue)
  if (!ko) return false
  if (ko === en && ko.length >= 6) return true
  return /[A-Za-z]{5,}/.test(ko)
}

function normalizeEnglish(value, fallback) {
  if (typeof value !== 'string') return fallback
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized || fallback
}

function sanitizeEnglishEdit(originalValue, candidateValue) {
  const original = normalizeEnglish(originalValue, '')
  const candidate = normalizeEnglish(candidateValue, original)

  if (!candidate) return original
  if (!original) return candidate
  if (normalizeEnglishComparison(original) !== normalizeEnglishComparison(candidate)) {
    return original
  }

  return candidate
}

function normalizeKorean(value, fallback) {
  if (typeof value !== 'string') return fallback
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized || fallback
}

function normalizeComparable(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim()
}

function normalizeEnglishComparison(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/['".,!?;:()\-[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function writeFileWithRetry(filePath, contents, encoding, maxAttempts = 4) {
  let lastError = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await writeFile(filePath, contents, encoding)
      return
    } catch (error) {
      lastError = error
      if (!isRetryableFileOpenError(error) || attempt === maxAttempts) {
        throw error
      }
      await delay(150 * attempt)
    }
  }

  throw lastError
}

function isRetryableFileOpenError(error) {
  const message = String(error?.message || '')
  return (
    error?.code === 'EBUSY' ||
    error?.code === 'EPERM' ||
    error?.code === 'UNKNOWN' ||
    /unknown error, open/i.test(message) ||
    /resource busy/i.test(message)
  )
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function countChangedEntries(before, after) {
  let count = 0
  for (let i = 0; i < Math.min(before.length, after.length); i++) {
    if (before[i].en !== after[i].en || before[i].ko !== after[i].ko) {
      count += 1
    }
  }
  return count
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
  const match = args.find((arg) => arg.startsWith(`${name}=`))
  return match ? match.slice(name.length + 1) : null
}

function resolveIdsFromFile(data) {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []
  return data.ids ?? data.valid_ids ?? data.youtubeIds ?? []
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
