export const TRANSCRIPT_RULES = {
  maxDurationSec: 7,
  maxTextLength: 120,
  maxGapSec: 2,
}

export function checkTranscript(entries, rules = TRANSCRIPT_RULES) {
  const issues = []

  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index]
    const duration = entry.end - entry.start
    const enLen = (entry.en || '').length

    if (duration > rules.maxDurationSec) {
      issues.push(makeIssue('DURATION_LONG', index, entry, duration, enLen, entry.en || ''))
    }

    if (enLen > rules.maxTextLength && duration <= rules.maxDurationSec) {
      issues.push(makeIssue('TEXT_LONG', index, entry, duration, enLen, entry.en || ''))
    }

    if (!entry.en || entry.en.trim().length === 0) {
      issues.push(makeIssue('EMPTY_EN', index, entry, duration, 0, ''))
    }

    if (index > 0) {
      const prev = entries[index - 1]
      if (entry.start < prev.end - 0.01) {
        issues.push(
          makeIssue(
            'OVERLAP',
            index,
            entry,
            duration,
            enLen,
            `overlaps with prev (ends ${prev.end})`
          )
        )
      }

      if (entry.start - prev.end > rules.maxGapSec) {
        issues.push(
          makeIssue(
            'GAP',
            index,
            entry,
            duration,
            enLen,
            `gap of ${(entry.start - prev.end).toFixed(1)}s after prev`
          )
        )
      }
    }
  }

  return issues
}

export function summarizeIssues(issues) {
  const counts = {}
  for (const issue of issues) {
    counts[issue.type] = (counts[issue.type] ?? 0) + 1
  }
  return counts
}

export function filterIssuesByReview(youtubeId, issues, reviewRegistry = {}) {
  const accepted = reviewRegistry.acceptedIssueOverrides?.[youtubeId] ?? []
  if (!Array.isArray(accepted) || accepted.length === 0) {
    return issues
  }

  const acceptedSignatures = new Set(accepted.map(makeIssueSignature))
  return issues.filter(issue => !acceptedSignatures.has(makeIssueSignature(issue)))
}

export function makeIssueSignature(issue) {
  return [
    issue.type,
    issue.idx,
    round2(issue.start),
    round2(issue.end),
  ].join(':')
}

export function getSubtitleCoverage(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return {
      entryCount: 0,
      englishFilledCount: 0,
      koreanFilledCount: 0,
      englishStatus: 'missing',
      koreanStatus: 'missing',
    }
  }

  const englishFilledCount = entries.filter(entry => hasText(entry.en)).length
  const koreanFilledCount = entries.filter(entry => hasText(entry.ko)).length

  return {
    entryCount: entries.length,
    englishFilledCount,
    koreanFilledCount,
    englishStatus: resolveFillStatus(englishFilledCount, entries.length),
    koreanStatus: resolveFillStatus(koreanFilledCount, entries.length),
  }
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function resolveFillStatus(filledCount, total) {
  if (total === 0 || filledCount === 0) return 'missing'
  if (filledCount === total) return 'complete'
  return 'partial'
}

function makeIssue(type, idx, entry, duration, chars, text) {
  return {
    type,
    idx,
    start: entry.start,
    end: entry.end,
    duration,
    chars,
    text,
  }
}

function round2(value) {
  return Math.round(value * 100) / 100
}
