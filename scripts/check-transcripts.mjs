#!/usr/bin/env node
/**
 * Transcript Quality Checker
 *
 * Checks all transcript JSON files for common issues:
 * - Entries longer than 7 seconds
 * - English text longer than 120 characters
 * - Timing gaps > 2 seconds
 * - Timing overlaps
 * - Empty text
 *
 * Usage: node scripts/check-transcripts.mjs [--fix]
 *   --fix: Auto-fix by splitting long entries (splits at sentence boundaries)
 */

import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { TRANSCRIPT_RULES, checkTranscript as runTranscriptCheck } from './lib/transcript-quality.mjs'

const TRANSCRIPTS_DIR = join(import.meta.dirname, '..', 'public', 'transcripts')

const args = process.argv.slice(2)
const shouldFix = args.includes('--fix')

async function main() {
  const files = (await readdir(TRANSCRIPTS_DIR)).filter(f => f.endsWith('.json'))

  let totalIssues = 0
  let cleanFiles = 0
  const results = []

  for (const file of files.sort()) {
    const filePath = join(TRANSCRIPTS_DIR, file)
    const data = JSON.parse(await readFile(filePath, 'utf-8'))
    const issues = runTranscriptCheck(data)

    if (issues.length === 0) {
      cleanFiles++
    } else {
      totalIssues += issues.length
      results.push({ file, issues, data })
    }
  }

  // Print report
  console.log('\n=== Transcript Quality Report ===\n')
  console.log(`Files checked: ${files.length}`)
  console.log(`Clean files: ${cleanFiles}`)
  console.log(`Files with issues: ${results.length}`)
  console.log(`Total issues: ${totalIssues}\n`)

  if (results.length === 0) {
    console.log('All transcripts pass quality checks!')
    return
  }

  for (const { file, issues } of results) {
    console.log(`\n--- ${file} (${issues.length} issues) ---`)
    for (const issue of issues) {
      const tag = `[${issue.type}]`
      console.log(`  ${tag.padEnd(16)} idx=${issue.idx} (${issue.start.toFixed(1)}-${issue.end.toFixed(1)}, ${issue.duration.toFixed(1)}s) ${issue.chars}ch: "${issue.text.slice(0, 60)}${issue.text.length > 60 ? '...' : ''}"`)
    }
  }

  if (shouldFix) {
    console.log('\n\n=== Auto-fixing... ===\n')
    for (const { file, data } of results) {
      const fixed = autoFix(data)
      const remaining = runTranscriptCheck(fixed)
      const filePath = join(TRANSCRIPTS_DIR, file)
      await writeFile(filePath, JSON.stringify(fixed, null, 2) + '\n', 'utf-8')
      console.log(`  ${file}: ${data.length} -> ${fixed.length} entries (${remaining.length} remaining issues)`)
    }
    console.log('\nDone! Re-run without --fix to verify.')
  }
}

function autoFix(entries) {
  const result = []

  for (const entry of entries) {
    const duration = entry.end - entry.start
    const enLen = (entry.en || '').length

    // Short text with very long duration -> tighten end time
    if (duration > TRANSCRIPT_RULES.maxDurationSec && enLen < 40) {
      result.push({
        ...entry,
        end: Math.min(entry.end, entry.start + Math.max(3, duration * 0.4)),
      })
      continue
    }

    // Long duration or long text -> try to split
    if (duration > TRANSCRIPT_RULES.maxDurationSec || enLen > TRANSCRIPT_RULES.maxTextLength) {
      const splits = splitEntry(entry)
      result.push(...splits)
      continue
    }

    result.push(entry)
  }

  return result
}

function splitEntry(entry) {
  const en = entry.en
  const ko = entry.ko || ''
  const duration = entry.end - entry.start

  // Find split points in English text
  const enParts = splitText(en)
  const koParts = splitText(ko, enParts.length)

  // Distribute time proportionally by text length
  const totalLen = enParts.reduce((sum, p) => sum + p.length, 0)
  const results = []
  let currentStart = entry.start

  for (let i = 0; i < enParts.length; i++) {
    const ratio = enParts[i].length / totalLen
    const partDuration = duration * ratio
    const currentEnd = i === enParts.length - 1
      ? entry.end
      : Math.round((currentStart + partDuration) * 100) / 100

    results.push({
      start: Math.round(currentStart * 100) / 100,
      end: currentEnd,
      en: enParts[i].trim(),
      ko: (koParts[i] || '').trim(),
    })

    currentStart = currentEnd
  }

  return results
}

function splitText(text, targetParts) {
  if (!text) return ['']

  // Try splitting at sentence boundaries first (. ! ?)
  const sentenceSplits = text.split(/(?<=[.!?])\s+/)
  if (sentenceSplits.length >= 2) {
    // If we have a target, try to match it
    if (targetParts && targetParts > sentenceSplits.length) {
      // Further split at commas
      return splitAtCommas(text, targetParts)
    }
    // Merge small parts back together if too many
    return mergeParts(sentenceSplits, targetParts || Math.ceil(text.length / TRANSCRIPT_RULES.maxTextLength) + 1)
  }

  // Try splitting at commas
  const commaSplits = text.split(/,\s*/)
  if (commaSplits.length >= 2) {
    return mergeParts(commaSplits, targetParts || 2)
  }

  // Last resort: split roughly in half at a space
  const mid = Math.floor(text.length / 2)
  const spaceIdx = text.indexOf(' ', mid)
  if (spaceIdx > 0) {
    return [text.slice(0, spaceIdx), text.slice(spaceIdx + 1)]
  }

  return [text]
}

function splitAtCommas(text, targetParts) {
  const parts = text.split(/,\s*/)
  return mergeParts(parts, targetParts)
}

function mergeParts(parts, targetCount) {
  if (parts.length <= targetCount) return parts

  // Merge smallest adjacent pairs until we reach target
  const result = [...parts]
  while (result.length > targetCount) {
    let minLen = Infinity
    let minIdx = 0
    for (let i = 0; i < result.length - 1; i++) {
      const combined = result[i].length + result[i + 1].length
      if (combined < minLen) {
        minLen = combined
        minIdx = i
      }
    }
    result[minIdx] = result[minIdx] + ', ' + result[minIdx + 1]
    result.splice(minIdx + 1, 1)
  }
  return result
}

main().catch(console.error)
