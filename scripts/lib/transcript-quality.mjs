export const TRANSCRIPT_RULES = {
  maxDurationSec: 7,
  maxTextLength: 120,
  maxGapSec: 2,
  suspiciousKoLatinChars: 4,
  suspiciousKoSentenceMarks: 3,
  suspiciousKoRelativeLength: 1.55,
  suspiciousKoAbsoluteLength: 55,
}

export function checkTranscript(entries, rules = TRANSCRIPT_RULES) {
  const issues = []

  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index]
    const duration = entry.end - entry.start
    const en = entry.en || ''
    const ko = entry.ko || ''
    const enLen = en.length
    const koLen = ko.length
    const koLatinChars = countLatinChars(ko)
    const koSentenceMarks = countSentenceMarks(ko)

    if (duration > rules.maxDurationSec) {
      issues.push(makeIssue('DURATION_LONG', index, entry, duration, enLen, en))
    }

    if (enLen > rules.maxTextLength && duration <= rules.maxDurationSec) {
      issues.push(makeIssue('TEXT_LONG', index, entry, duration, enLen, en))
    }

    if (!hasText(en)) {
      issues.push(makeIssue('EMPTY_EN', index, entry, duration, 0, ''))
    }

    if (!hasText(ko)) {
      issues.push(makeIssue('EMPTY_KO', index, entry, duration, 0, ''))
    } else {
      if (koLatinChars >= rules.suspiciousKoLatinChars) {
        issues.push(
          makeIssue(
            'KO_LATIN_HEAVY',
            index,
            entry,
            duration,
            koLen,
            `latin chars: ${koLatinChars}`,
          ),
        )
      }

      if (koSentenceMarks >= rules.suspiciousKoSentenceMarks) {
        issues.push(
          makeIssue(
            'KO_MULTI_SENTENCE',
            index,
            entry,
            duration,
            koLen,
            `sentence marks: ${koSentenceMarks}`,
          ),
        )
      }

      if (
        enLen > 0 &&
        koLen >=
          Math.max(
            rules.suspiciousKoAbsoluteLength,
            Math.round(enLen * rules.suspiciousKoRelativeLength),
          )
      ) {
        issues.push(
          makeIssue(
            'KO_OVERLONG',
            index,
            entry,
            duration,
            koLen,
            `ko length ${koLen} vs en length ${enLen}`,
          ),
        )
      }
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
            `overlaps with prev (ends ${prev.end})`,
          ),
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
            `gap of ${(entry.start - prev.end).toFixed(1)}s after prev`,
          ),
        )
      }

      if (
        hasText(ko) &&
        hasText(prev.ko) &&
        normalizeText(ko) === normalizeText(prev.ko) &&
        normalizeText(ko).length >= 12
      ) {
        issues.push(
          makeIssue(
            'KO_DUPLICATE_NEIGHBOR',
            index,
            entry,
            duration,
            koLen,
            'same korean subtitle as previous entry',
          ),
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
  return issues.filter((issue) => !acceptedSignatures.has(makeIssueSignature(issue)))
}

export function makeIssueSignature(issue) {
  return [issue.type, issue.idx, round2(issue.start), round2(issue.end)].join(':')
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

  const englishFilledCount = entries.filter((entry) => hasText(entry.en)).length
  const koreanFilledCount = entries.filter((entry) => hasText(entry.ko)).length

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

function countLatinChars(value) {
  return (String(value || '').match(/[A-Za-z]/g) || []).length
}

function countSentenceMarks(value) {
  return (String(value || '').match(/[.!?。！？]/g) || []).length
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim()
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
