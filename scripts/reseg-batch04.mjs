import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE = 'C:/Users/hyunj/studyeng';
const TRANSCRIPTS_DIR = join(BASE, 'public/transcripts');
const OUTPUT_DIR = join(BASE, 'src/data/reseg-results');

const VIDEO_IDS = [
  '3quvRb-vca8', '3S16b-x5mRA', '3S517s7E4wk', '3uwrL9unVek',
  '3VavIcYEQZs', '3vijLre760w', '3zgdZZmX7r8', '403jzB62dAs',
  '41O_MydqxTU', '436h_1wuAd4', '450p7goxZqg', '46GwJbrMghQ',
  '46p-IxAVJ74', '47NpZE1Skj0', '4ADCmY6lJ_8', '4aeETEoNfOg',
  '4ATqJc2MjDY', '4bg2SrTDV08', '4CbYj4K-S2U', '4DMUy20QfdM',
  '4GSC9wajj8I', '4H6qwPJT9W0', '4hX9o6ghEGI', '4iUtZvRoQOI',
  '4Jg_1qn5YiI', '4JK_Lg8P7PU', '4KBAXMpklDU', '4m1EFMoRFvY',
  '4m4xYcLoOgg', '4MRU8QBdipg', '4NRXx6U8ABQ', '4PKr_BVo4hg',
  '4PwDFddpo4c', '4QIZE708gJ4', '4R_SNYsdIvw', '4RaWAQIBZ2I'
];

// Abbreviations that should NOT be treated as sentence boundaries
const ABBREVIATIONS = /(?:Dr|Mr|Mrs|Ms|U\.S|St|Jr|Sr|Prof|vs|etc|Inc|Ltd|Corp|Vol|Gen|Gov|Sgt|Capt|Lt|Col|Maj|Rev|Pvt|Cpl|Cmdr)\./g;

// Placeholder to protect abbreviations during sentence splitting
const ABBR_PLACEHOLDER = '\x00ABBR_DOT\x00';

function isMusic(en) {
  const trimmed = en.trim();
  return trimmed.startsWith('\u266a') || trimmed.startsWith('[music') ||
         trimmed.startsWith('[Music') || trimmed.startsWith('[applause') ||
         trimmed.startsWith('[Applause') || trimmed.startsWith('[laughter') ||
         trimmed.startsWith('[Laughter') || /^\u266a/.test(trimmed);
}

function isSongLyrics(segments, idx) {
  // Heuristic: if many segments in a row have no sentence-ending punctuation
  // and are short rhythmic lines, treat as lyrics
  // For now, only skip explicit music markers
  return false;
}

function protectAbbreviations(text) {
  // Replace known abbreviations' dots with placeholder
  return text.replace(/\b(Dr|Mr|Mrs|Ms|Jr|Sr|Prof|vs|etc|Inc|Ltd|Corp|Vol|Gen|Gov|Sgt|Capt|Lt|Col|Maj|Rev|Pvt|Cpl|Cmdr)\./g, '$1' + ABBR_PLACEHOLDER)
             .replace(/U\.S\./g, 'U' + ABBR_PLACEHOLDER + 'S' + ABBR_PLACEHOLDER)
             .replace(/\bSt\./g, 'St' + ABBR_PLACEHOLDER);
}

function restoreAbbreviations(text) {
  return text.replaceAll(ABBR_PLACEHOLDER, '.');
}

/**
 * Split English text into sentences.
 * Returns array of sentence strings.
 */
function splitSentences(en) {
  const protected_ = protectAbbreviations(en);

  // Split at sentence-ending punctuation followed by space and uppercase letter (or end)
  // Pattern: .!? followed by space + capital letter OR end of string
  const parts = [];
  let current = '';

  for (let i = 0; i < protected_.length; i++) {
    current += protected_[i];
    const ch = protected_[i];

    if (ch === '.' || ch === '!' || ch === '?') {
      // Check if next non-space char is uppercase or if we're at end
      let j = i + 1;
      // Skip spaces
      while (j < protected_.length && protected_[j] === ' ') j++;

      if (j >= protected_.length) {
        // End of string - this is definitely a sentence end
        parts.push(restoreAbbreviations(current.trim()));
        current = '';
      } else if (protected_[j] >= 'A' && protected_[j] <= 'Z') {
        // Next word starts with capital - sentence boundary
        parts.push(restoreAbbreviations(current.trim()));
        current = '';
      } else if (protected_[j] === '"' || protected_[j] === "'") {
        // Might be a quote starting - check char after
        let k = j + 1;
        while (k < protected_.length && protected_[k] === ' ') k++;
        if (k < protected_.length && protected_[k] >= 'A' && protected_[k] <= 'Z') {
          parts.push(restoreAbbreviations(current.trim()));
          current = '';
        }
      }
    }
  }

  if (current.trim()) {
    parts.push(restoreAbbreviations(current.trim()));
  }

  return parts.filter(p => p.length > 0);
}

/**
 * Split Korean text to match English sentence splits.
 * Returns array of Korean strings.
 */
function splitKorean(ko, enParts) {
  if (!ko || enParts.length <= 1) return [ko];

  // Try splitting Korean at sentence boundaries (. ! ? followed by space)
  const koParts = [];
  let current = '';
  const koChars = [...ko];

  for (let i = 0; i < koChars.length; i++) {
    current += koChars[i];
    const ch = koChars[i];

    if (ch === '.' || ch === '!' || ch === '?') {
      let j = i + 1;
      while (j < koChars.length && koChars[j] === ' ') j++;

      if (j >= koChars.length) {
        koParts.push(current.trim());
        current = '';
      } else if (j < koChars.length) {
        koParts.push(current.trim());
        current = '';
      }
    }
  }

  if (current.trim()) {
    koParts.push(current.trim());
  }

  // If Korean parts match English parts count, great
  if (koParts.length === enParts.length) {
    return koParts;
  }

  // If we can combine some Korean parts to match
  if (koParts.length > enParts.length) {
    // Combine extra Korean parts into groups matching English count
    const result = [];
    const ratio = koParts.length / enParts.length;
    let koIdx = 0;
    for (let i = 0; i < enParts.length; i++) {
      const endIdx = i === enParts.length - 1 ? koParts.length : Math.round((i + 1) * ratio);
      const group = koParts.slice(koIdx, endIdx).join(' ');
      result.push(group);
      koIdx = endIdx;
    }
    return result;
  }

  // Korean has fewer parts than English - put all in first, empty for rest
  const result = [ko];
  for (let i = 1; i < enParts.length; i++) {
    result.push('');
  }
  return result;
}

/**
 * Distribute time proportionally by character count
 */
function distributeTime(start, end, parts) {
  const totalDuration = end - start;
  const totalChars = parts.reduce((sum, p) => sum + p.length, 0);

  if (totalChars === 0) {
    // Equal distribution
    const segDur = totalDuration / parts.length;
    return parts.map((_, i) => ({
      start: round2(start + i * segDur),
      end: round2(start + (i + 1) * segDur)
    }));
  }

  const times = [];
  let currentStart = start;

  for (let i = 0; i < parts.length; i++) {
    const charRatio = parts[i].length / totalChars;
    const segDuration = totalDuration * charRatio;
    const segEnd = i === parts.length - 1 ? end : round2(currentStart + segDuration);
    times.push({ start: round2(currentStart), end: segEnd });
    currentStart = segEnd;
  }

  return times;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Find clause boundaries for Case C/D splitting
 */
function findClauseBoundary(en) {
  // Look for ", conjunction" patterns
  const conjunctions = [', and ', ', but ', ', because ', ', which ', ', so ', ', or ', ', when ', ', if ', ', although ', ', while ', ', since ', ', though ', ', where ', ', after ', ', before ', ', until ', ', unless '];

  let bestIdx = -1;
  let bestConj = '';
  const mid = en.length / 2;
  let bestDist = Infinity;

  for (const conj of conjunctions) {
    let searchFrom = 0;
    while (true) {
      const idx = en.indexOf(conj, searchFrom);
      if (idx === -1) break;

      // Prefer split closest to middle
      const dist = Math.abs(idx + conj.length / 2 - mid);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
        bestConj = conj;
      }
      searchFrom = idx + 1;
    }
  }

  if (bestIdx === -1) return null;

  // Split point is after the comma (keep conjunction with second part)
  // Actually, more natural: "text, and more" -> "text," | "and more"
  // Let's split: first part includes up to comma, second part starts with conjunction word
  const splitAt = bestIdx + 1; // after the comma
  const first = en.substring(0, splitAt).trim();
  const second = en.substring(splitAt).trim();

  return { first, second, splitIdx: bestIdx };
}

/**
 * Split Korean for clause splits (by comma if possible)
 */
function splitKoreanAtClause(ko, enFirst, enSecond) {
  if (!ko) return [ko, ''];

  // Try to find a natural split point in Korean
  // Look for comma or conjunction markers
  const commaIdx = ko.indexOf(', ');
  if (commaIdx > 0 && commaIdx < ko.length - 3) {
    const ratioEn = enFirst.length / (enFirst.length + enSecond.length);
    const ratioKo = commaIdx / ko.length;
    // If the comma position roughly matches the English split ratio
    if (Math.abs(ratioEn - ratioKo) < 0.35) {
      return [ko.substring(0, commaIdx + 1).trim(), ko.substring(commaIdx + 1).trim()];
    }
  }

  // Look for Korean conjunctive endings
  const koSplitMarkers = [', 그리고 ', ', 하지만 ', ', 왜냐하면 ', ', 그래서 ', ' 그리고 ', ' 하지만 ', ' 그래서 '];
  for (const marker of koSplitMarkers) {
    const idx = ko.indexOf(marker);
    if (idx > 0) {
      return [ko.substring(0, idx + 1).trim(), ko.substring(idx + 1).trim()];
    }
  }

  // Can't split cleanly - keep all in first
  return [ko, ''];
}

function processFile(videoId) {
  const filePath = join(TRANSCRIPTS_DIR, `${videoId}.json`);
  const raw = readFileSync(filePath, 'utf-8');
  const segments = JSON.parse(raw);

  const stats = { splits: 0, merges: 0, dupsRemoved: 0, segsBefore: segments.length, segsAfter: 0 };
  let result = [];
  let changed = false;

  // Pass 1: Process splits and keep/skip decisions
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const en = (seg.en || '').trim();
    const ko = (seg.ko || '').trim();
    const duration = round2(seg.end - seg.start);

    // Case H: Music/effects
    if (isMusic(en)) {
      result.push({ ...seg });
      continue;
    }

    // Count sentences
    const sentences = splitSentences(en);
    const sentenceCount = sentences.length;

    if (sentenceCount >= 2) {
      // Multi-sentence segment
      if (duration > 3) {
        // Case A: Split into separate segments per sentence
        // But check: if any split segment would be < 1.5s, keep short ones together
        const times = distributeTime(seg.start, seg.end, sentences);
        const koParts = splitKorean(ko, sentences);

        // Group segments that would be too short
        const groups = [];
        let groupSentences = [sentences[0]];
        let groupKo = [koParts[0]];
        let groupStart = times[0].start;
        let groupEnd = times[0].end;

        for (let j = 1; j < sentences.length; j++) {
          const thisDur = round2(times[j].end - times[j].start);
          const prevGroupDur = round2(groupEnd - groupStart);

          if (thisDur < 1.5 || prevGroupDur < 1.5) {
            // Merge with current group
            groupSentences.push(sentences[j]);
            groupKo.push(koParts[j]);
            groupEnd = times[j].end;
          } else {
            // Finalize current group and start new one
            groups.push({
              start: groupStart,
              end: groupEnd,
              en: groupSentences.join(' '),
              ko: groupKo.filter(k => k).join(' ')
            });
            groupSentences = [sentences[j]];
            groupKo = [koParts[j]];
            groupStart = times[j].start;
            groupEnd = times[j].end;
          }
        }
        // Finalize last group
        groups.push({
          start: groupStart,
          end: groupEnd,
          en: groupSentences.join(' '),
          ko: groupKo.filter(k => k).join(' ')
        });

        if (groups.length > 1) {
          // Actually split
          for (const g of groups) {
            result.push(g);
          }
          stats.splits += groups.length - 1;
          changed = true;
        } else {
          // All merged back into one (all too short)
          result.push({ ...seg });
        }
      } else {
        // Case B: Duration <= 3s, keep as is
        result.push({ ...seg });
      }
    } else {
      // Single sentence
      if (duration > 8) {
        // Case C: Try to split at clause boundary
        const boundary = findClauseBoundary(en);
        if (boundary) {
          const times = distributeTime(seg.start, seg.end, [boundary.first, boundary.second]);
          const firstDur = round2(times[0].end - times[0].start);
          const secondDur = round2(times[1].end - times[1].start);

          if (firstDur >= 3 && secondDur >= 3) {
            const [koFirst, koSecond] = splitKoreanAtClause(ko, boundary.first, boundary.second);
            result.push({ start: times[0].start, end: times[0].end, en: boundary.first, ko: koFirst });
            result.push({ start: times[1].start, end: times[1].end, en: boundary.second, ko: koSecond });
            stats.splits += 1;
            changed = true;
          } else {
            result.push({ ...seg });
          }
        } else {
          result.push({ ...seg });
        }
      } else if (duration >= 6 && duration <= 8) {
        // Case D: Only split if >= 6s AND clear clause boundary
        const boundary = findClauseBoundary(en);
        if (boundary) {
          const times = distributeTime(seg.start, seg.end, [boundary.first, boundary.second]);
          const firstDur = round2(times[0].end - times[0].start);
          const secondDur = round2(times[1].end - times[1].start);

          if (firstDur >= 3 && secondDur >= 3) {
            const [koFirst, koSecond] = splitKoreanAtClause(ko, boundary.first, boundary.second);
            result.push({ start: times[0].start, end: times[0].end, en: boundary.first, ko: koFirst });
            result.push({ start: times[1].start, end: times[1].end, en: boundary.second, ko: koSecond });
            stats.splits += 1;
            changed = true;
          } else {
            result.push({ ...seg });
          }
        } else {
          result.push({ ...seg });
        }
      } else {
        // Case E/F: < 5-6s, no change
        result.push({ ...seg });
      }
    }
  }

  // Pass 2: Merge fragments (Case G)
  const merged = [];
  let skipNext = false;

  for (let i = 0; i < result.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }

    const seg = result[i];
    const en = (seg.en || '').trim();
    const wordCount = en.split(/\s+/).filter(w => w.length > 0).length;
    const duration = round2(seg.end - seg.start);

    // Skip music segments from fragment merging
    if (isMusic(en)) {
      merged.push(seg);
      continue;
    }

    if (wordCount <= 2 && duration < 1.5) {
      // Case G: Fragment - merge with adjacent
      const prev = merged.length > 0 ? merged[merged.length - 1] : null;
      const next = i + 1 < result.length ? result[i + 1] : null;

      // Check if previous doesn't end with sentence punctuation
      if (prev && !isMusic(prev.en || '')) {
        const prevEn = (prev.en || '').trim();
        const lastChar = prevEn[prevEn.length - 1];
        if (lastChar !== '.' && lastChar !== '!' && lastChar !== '?') {
          // Merge with previous
          prev.end = seg.end;
          prev.en = (prev.en + ' ' + en).trim();
          if (seg.ko) {
            prev.ko = ((prev.ko || '') + ' ' + seg.ko).trim();
          }
          stats.merges += 1;
          changed = true;
          continue;
        }
      }

      // Otherwise try to merge with next
      if (next && !isMusic(next.en || '')) {
        const mergedSeg = {
          start: seg.start,
          end: next.end,
          en: (en + ' ' + (next.en || '')).trim(),
          ko: ((seg.ko || '') + ' ' + (next.ko || '')).trim()
        };
        merged.push(mergedSeg);
        skipNext = true;
        stats.merges += 1;
        changed = true;
        continue;
      }

      // Can't merge - keep as is
      merged.push(seg);
    } else {
      merged.push(seg);
    }
  }

  // Pass 3: Remove consecutive duplicates
  const deduped = [];
  for (let i = 0; i < merged.length; i++) {
    if (i > 0 && merged[i].en === merged[i - 1].en) {
      stats.dupsRemoved += 1;
      changed = true;
      continue;
    }
    deduped.push(merged[i]);
  }

  stats.segsAfter = deduped.length;

  // Write back if changed
  if (changed) {
    writeFileSync(filePath, JSON.stringify(deduped, null, 2) + '\n', 'utf-8');
  }

  return { changed, stats };
}

// Main
mkdirSync(OUTPUT_DIR, { recursive: true });

const report = {
  batch: '04',
  filesProcessed: VIDEO_IDS.length,
  filesChanged: 0,
  totalSplits: 0,
  totalMerges: 0,
  totalDupsRemoved: 0,
  details: {}
};

for (const id of VIDEO_IDS) {
  try {
    const { changed, stats } = processFile(id);

    if (changed) {
      report.filesChanged++;
      report.totalSplits += stats.splits;
      report.totalMerges += stats.merges;
      report.totalDupsRemoved += stats.dupsRemoved;
      report.details[id] = stats;
      console.log(`CHANGED: ${id} - splits:${stats.splits} merges:${stats.merges} dups:${stats.dupsRemoved} (${stats.segsBefore} -> ${stats.segsAfter})`);
    } else {
      console.log(`OK: ${id} - no changes needed`);
    }
  } catch (err) {
    console.error(`ERROR: ${id} - ${err.message}`);
  }
}

// Write report
const reportPath = join(OUTPUT_DIR, 'batch-04.json');
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf-8');
console.log(`\nReport written to ${reportPath}`);
console.log(`Summary: ${report.filesProcessed} processed, ${report.filesChanged} changed, ${report.totalSplits} splits, ${report.totalMerges} merges, ${report.totalDupsRemoved} dups removed`);
