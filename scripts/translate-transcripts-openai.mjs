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
const TRANSCRIPTS_DIR = join(ROOT, 'public', 'transcripts')

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY environment variable required')
  process.exit(1)
}

const args = process.argv.slice(2)
const specificId = getArgValue('--id')
const overwriteKo = args.includes('--overwrite-ko')
const dryRun = args.includes('--dry')
const onlyQueue = getArgValue('--queue') || 'needs_translation'
const idsFile = getArgValue('--ids-file')
const queueSource = getArgValue('--queue-source') || 'snapshot'
const model = getArgValue('--model') || 'gpt-4o-mini'
const batchSize = Number.parseInt(getArgValue('--batch') || '40', 10)

async function main() {
  const manifest = await readJson(MANIFEST_PATH, null)
  if (!manifest) {
    console.error('Missing content manifest. Run `npm run content:sync` first.')
    process.exit(1)
  }

  let assetQueue = manifest.assets

  if (idsFile) {
    const manifestIds = await readJson(idsFile, null)
    const ids = new Set(resolveIdsFromFile(manifestIds, onlyQueue))
    assetQueue = assetQueue.filter(asset => ids.has(asset.youtubeId))
    if (queueSource === 'current') {
      assetQueue = assetQueue.filter(asset => asset.workflowStatus === onlyQueue)
    }
  } else if (specificId) {
    assetQueue = assetQueue.filter(asset => asset.youtubeId === specificId)
  } else {
    assetQueue = assetQueue.filter(asset => asset.workflowStatus === onlyQueue)
  }

  console.log(`Translating ${assetQueue.length} transcript assets with OpenAI (${model})\n`)

  let translatedAssets = 0
  let translatedEntries = 0
  let skippedAssets = 0
  let failedAssets = 0

  for (const asset of assetQueue) {
    const transcriptPath = join(ROOT, asset.transcriptPath || `public/transcripts/${asset.youtubeId}.json`)
    if (!existsSync(transcriptPath)) {
      console.log(`  ${asset.youtubeId}... SKIP (missing transcript file)`)
      skippedAssets++
      continue
    }

    const entries = await readJson(transcriptPath, [])
    if (!Array.isArray(entries) || entries.length === 0) {
      console.log(`  ${asset.youtubeId}... SKIP (empty transcript)`)
      skippedAssets++
      continue
    }

    const targets = entries
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => overwriteKo || !hasText(entry.ko))

    if (targets.length === 0) {
      console.log(`  ${asset.youtubeId}... SKIP (already translated)`)
      skippedAssets++
      continue
    }

    console.log(`  ${asset.youtubeId}... ${targets.length} entries`)

    if (dryRun) {
      continue
    }

    try {
      for (let offset = 0; offset < targets.length; offset += batchSize) {
        const batch = targets.slice(offset, offset + batchSize)
        const translations = await translateBatch(batch.map(({ entry, index }, localIndex) => ({
          localIndex,
          globalIndex: index,
          en: entry.en,
        })), model)

        for (const item of batch) {
          const translated = translations.get(item.index)
          if (translated) {
            item.entry.ko = translated
            translatedEntries++
          }
        }
      }

      await writeFile(transcriptPath, JSON.stringify(entries, null, 2) + '\n', 'utf-8')
      translatedAssets++
      await sleep(500)
    } catch (error) {
      console.log(`    FAILED: ${error.message}`)
      failedAssets++
    }
  }

  console.log(`\nDone: ${translatedAssets} assets translated, ${translatedEntries} entries filled, ${skippedAssets} skipped, ${failedAssets} failed`)
}

async function translateBatch(items, modelName) {
  const numbered = items.map(item => `${item.localIndex}: ${item.en}`).join('\n')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You translate English subtitles into natural Korean for a language-learning app. Return only numbered lines in the same format. Keep each translation concise, natural, and fully in Korean. Do not add explanations.',
        },
        {
          role: 'user',
          content: numbered,
        },
      ],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI API ${response.status}: ${text.slice(0, 200)}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean)
  const result = new Map()

  for (const item of items) {
    const line = lines.find(current => current.startsWith(`${item.localIndex}:`))
    if (line) {
      result.set(item.globalIndex, line.replace(/^\d+:\s*/, '').trim())
    }
  }

  return result
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
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
  const match = args.find(arg => arg.startsWith(`${name}=`))
  return match ? match.slice(name.length + 1) : null
}

function resolveIdsFromFile(manifestIds, queueName) {
  if (Array.isArray(manifestIds)) {
    return manifestIds
  }

  if (!manifestIds || typeof manifestIds !== 'object') {
    return []
  }

  return manifestIds[queueName] ?? manifestIds.valid_ids ?? manifestIds.ids ?? []
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
