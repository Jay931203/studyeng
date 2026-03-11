import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = 'C:/Users/hyunj/studyeng';
const TRANSCRIPTS_DIR = join(ROOT, 'public/transcripts');
const BATCH_FILE = join(ROOT, 'logs/fullcheck-batch1.json');
const REPORT_FILE = join(ROOT, 'logs/fullcheck-report-batch1.json');

const videoIds = JSON.parse(readFileSync(BATCH_FILE, 'utf-8'));

console.log(`Checking ${videoIds.length} transcript files...`);

// Helpers
function hasGarbledText(text) {
  // Check for high ratio of non-printable or unusual characters
  const nonAsciiPrintable = text.replace(/[\x20-\x7E]/g, '');
  // Allow Korean, CJK, common punctuation
  const trueGarbled = nonAsciiPrintable.replace(/[\uAC00-\uD7AF\u3000-\u303F\u2000-\u206F\u00A0-\u00FF\u2018-\u201F\u2026\u2013\u2014\u2122\u00E9\u00E8\u00E0\u00E2\u00F1\u00FC\u00F6\u00E4\u00EB\u00EF\u2019\u00C0-\u00FF\u0100-\u024F]/g, '');
  if (text.length > 5 && trueGarbled.length / text.length > 0.3) return true;
  // Check for patterns like repeated random chars
  if (/[^\x20-\x7E\uAC00-\uD7AF]{5,}/.test(text)) {
    // Could be legitimate non-latin, check if it's Korean
    const koreanChars = text.match(/[\uAC00-\uD7AF]/g);
    if (!koreanChars || koreanChars.length < 3) return true;
  }
  return false;
}

function hasHtmlEntities(text) {
  return /&(amp|quot|lt|gt|nbsp|apos|#\d+|#x[0-9a-fA-F]+);/.test(text);
}

function hasHtmlTags(text) {
  return /<\/?[a-zA-Z][^>]*>/.test(text);
}

function isKoreanText(text) {
  const koreanChars = (text.match(/[\uAC00-\uD7AF\u3131-\u3163\u1100-\u11FF]/g) || []).length;
  return koreanChars / Math.max(text.length, 1);
}

function latinRatio(text) {
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  return latinChars / Math.max(text.length, 1);
}

function koEnLengthRatio(ko, en) {
  // Korean chars are denser than English, so normalize
  // A Korean character conveys roughly 2-3 English characters worth
  return ko.length / Math.max(en.length, 1);
}

const results = {
  totalChecked: 0,
  clean: 0,
  missing: 0,
  parseError: 0,
  issues: [],
};

// Severity tracking for summary
const issueCounts = {};

for (const videoId of videoIds) {
  const filePath = join(TRANSCRIPTS_DIR, `${videoId}.json`);
  results.totalChecked++;

  if (!existsSync(filePath)) {
    results.missing++;
    results.issues.push({
      videoId,
      problems: [{ type: 'file_missing', subtitle_index: -1, detail: 'Transcript file not found' }],
    });
    continue;
  }

  let subtitles;
  try {
    const raw = readFileSync(filePath, 'utf-8');
    subtitles = JSON.parse(raw);
  } catch (e) {
    results.parseError++;
    results.issues.push({
      videoId,
      problems: [{ type: 'parse_error', subtitle_index: -1, detail: e.message }],
    });
    continue;
  }

  if (!Array.isArray(subtitles)) {
    results.issues.push({
      videoId,
      problems: [{ type: 'invalid_format', subtitle_index: -1, detail: 'Root is not an array' }],
    });
    continue;
  }

  const problems = [];

  // Content coherence: too few subtitles
  if (subtitles.length < 3) {
    problems.push({
      type: 'too_few_subtitles',
      subtitle_index: -1,
      detail: `Only ${subtitles.length} subtitle(s)`,
    });
  }

  // Check if all en text is identical
  if (subtitles.length > 2) {
    const uniqueEn = new Set(subtitles.map((s) => s.en));
    if (uniqueEn.size === 1) {
      problems.push({
        type: 'all_identical_en',
        subtitle_index: -1,
        detail: `All ${subtitles.length} subtitles have identical en: "${[...uniqueEn][0]?.substring(0, 50)}"`,
      });
    }
  }

  for (let i = 0; i < subtitles.length; i++) {
    const sub = subtitles[i];
    const en = sub.en || '';
    const ko = sub.ko || '';
    const start = sub.start;
    const end = sub.end;

    // === TIMING CHECKS ===

    // Negative duration
    if (end < start) {
      problems.push({
        type: 'timing_negative_duration',
        subtitle_index: i,
        detail: `end (${end}) < start (${start})`,
      });
    }

    const duration = end - start;

    // Too short duration
    if (duration > 0 && duration < 0.3) {
      problems.push({
        type: 'timing_too_short',
        subtitle_index: i,
        detail: `Duration ${duration.toFixed(2)}s`,
      });
    }

    // Too long duration
    if (duration > 30) {
      problems.push({
        type: 'timing_too_long',
        subtitle_index: i,
        detail: `Duration ${duration.toFixed(2)}s (${start}-${end})`,
      });
    }

    // Overlap with next subtitle
    if (i < subtitles.length - 1) {
      const nextStart = subtitles[i + 1].start;
      const overlap = end - nextStart;
      if (overlap > 0.5) {
        problems.push({
          type: 'timing_overlap',
          subtitle_index: i,
          detail: `Overlaps next by ${overlap.toFixed(2)}s (end=${end}, next_start=${nextStart})`,
        });
      }

      // Large gap
      const gap = nextStart - end;
      if (gap > 60) {
        problems.push({
          type: 'timing_large_gap',
          subtitle_index: i,
          detail: `Gap of ${gap.toFixed(1)}s to next subtitle`,
        });
      }
    }

    // Chronological order
    if (i > 0 && start < subtitles[i - 1].start) {
      problems.push({
        type: 'timing_not_chronological',
        subtitle_index: i,
        detail: `Start ${start} < previous start ${subtitles[i - 1].start}`,
      });
    }

    // === ENGLISH TEXT CHECKS ===

    if (!en || en.trim().length === 0) {
      problems.push({
        type: 'en_empty',
        subtitle_index: i,
        detail: 'English text is empty',
      });
    } else {
      // Garbled text
      if (hasGarbledText(en)) {
        problems.push({
          type: 'en_garbled',
          subtitle_index: i,
          detail: `Garbled: "${en.substring(0, 80)}"`,
        });
      }

      // Very long run-on
      if (en.length > 300) {
        problems.push({
          type: 'en_too_long',
          subtitle_index: i,
          detail: `${en.length} chars: "${en.substring(0, 100)}..."`,
        });
      }

      // HTML tags
      if (hasHtmlTags(en)) {
        problems.push({
          type: 'en_html_tags',
          subtitle_index: i,
          detail: `Contains HTML tags: "${en.substring(0, 80)}"`,
        });
      }

      // HTML entities
      if (hasHtmlEntities(en)) {
        problems.push({
          type: 'en_html_entities',
          subtitle_index: i,
          detail: `Contains HTML entities: "${en.substring(0, 80)}"`,
        });
      }
    }

    // === KOREAN TRANSLATION CHECKS ===

    if (!ko || ko.trim().length === 0) {
      problems.push({
        type: 'ko_empty',
        subtitle_index: i,
        detail: `English: "${en.substring(0, 60)}"`,
      });
    } else {
      // ko is just en copied
      if (ko.trim() === en.trim() && en.length > 3) {
        problems.push({
          type: 'ko_is_en_copy',
          subtitle_index: i,
          detail: `ko == en: "${ko.substring(0, 60)}"`,
        });
      }

      // ko has too much Latin (>50% non-Korean)
      const koKoreanRatio = isKoreanText(ko);
      const koLatinRatio = latinRatio(ko);
      if (koLatinRatio > 0.5 && ko.length > 5) {
        problems.push({
          type: 'ko_mostly_latin',
          subtitle_index: i,
          detail: `${(koLatinRatio * 100).toFixed(0)}% Latin: "${ko.substring(0, 80)}"`,
        });
      }

      // Length ratio check (ko vs en)
      if (en.length > 5 && ko.length > 0) {
        const ratio = koEnLengthRatio(ko, en);
        if (ratio < 0.15) {
          problems.push({
            type: 'ko_suspiciously_short',
            subtitle_index: i,
            detail: `Ratio ${ratio.toFixed(2)}: en(${en.length})="${en.substring(0, 40)}" ko(${ko.length})="${ko}"`,
          });
        }
        if (ratio > 5.0) {
          problems.push({
            type: 'ko_suspiciously_long',
            subtitle_index: i,
            detail: `Ratio ${ratio.toFixed(2)}: en(${en.length})="${en.substring(0, 40)}" ko(${ko.length})="${ko.substring(0, 80)}"`,
          });
        }
      }
    }
  }

  // Count issues
  for (const p of problems) {
    issueCounts[p.type] = (issueCounts[p.type] || 0) + 1;
  }

  if (problems.length > 0) {
    results.issues.push({ videoId, problems });
  } else {
    results.clean++;
  }
}

// Sort issues by problem count (worst first)
results.issues.sort((a, b) => b.problems.length - a.problems.length);

// Write report
writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2), 'utf-8');

// Summary
console.log('\n=== FULLCHECK QA REPORT ===');
console.log(`Total checked: ${results.totalChecked}`);
console.log(`Clean files: ${results.clean}`);
console.log(`Files with issues: ${results.issues.length}`);
console.log(`Missing files: ${results.missing}`);
console.log(`Parse errors: ${results.parseError}`);
console.log('\n--- Issue breakdown ---');
const sortedIssues = Object.entries(issueCounts).sort((a, b) => b[1] - a[1]);
for (const [type, count] of sortedIssues) {
  console.log(`  ${type}: ${count}`);
}

// Show top 20 worst files
console.log('\n--- Top 20 worst files ---');
for (const item of results.issues.slice(0, 20)) {
  const types = [...new Set(item.problems.map((p) => p.type))].join(', ');
  console.log(`  ${item.videoId} (${item.problems.length} problems): ${types}`);
}
