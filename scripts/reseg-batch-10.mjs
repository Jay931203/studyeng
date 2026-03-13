import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = 'C:/Users/hyunj/studyeng';
const TRANSCRIPTS_DIR = join(ROOT, 'public/transcripts');
const RESULTS_DIR = join(ROOT, 'src/data/reseg-results');

const VIDEO_IDS = [
  'b2f2Kqt_KcE','b-2fnZfK9Lg','B3JXNzZGSJw','b48AN_8wokU','B5gzsdPe5rs',
  'b65C_muXajk','b8GpG-7q0WU','b8nT5qx_Rbo','b8o1ZkWBxMk','B9G71qT5eu4',
  'b9gQ-gqVWp4','bat8-rxEpdo','bbet0m_dg8w','-bBHT158E0s','bbQh_S2g6CI',
  'bBSvlTYfUrs','BbXJ3_AQE_o','Bcn-rzACIHU','bCQNOdflWbQ','BDuZqYeNiOA',
  'bEFfgO0bjtw','BEG66-Lro7U','BgfB4SjXuys','BHbksPYwdf8','bhKCGlubXa4',
  'bHVQXMCux78','bIQgJKJiQRQ','Bjqmg_7J53s','blMgda_uIok','BmFbczWrVUw',
  'Bml8KwCmob8','bmz9lMP6aQU','bnVUHWCynig','BOK22sQ_PTI','BOt5SmHf2aE',
  'bP_FsFnDnzM'
];

// Abbreviations that should NOT be treated as sentence boundaries
const ABBREVIATIONS = /(?:Dr|Mr|Mrs|Ms|U\.S|St|Jr|Sr|Prof|Inc|Ltd|vs|etc|e\.g|i\.e|No|Mt)\./g;

// Placeholder to protect abbreviations during splitting
const ABBR_PLACEHOLDER = '\x00ABBR_DOT\x00';

function protectAbbreviations(text) {
  return text.replace(/\b(Dr|Mr|Mrs|Ms|Jr|Sr|Prof|Inc|Ltd|vs|etc|No|Mt)\./gi, '$1' + ABBR_PLACEHOLDER)
             .replace(/U\.S\./g, 'U' + ABBR_PLACEHOLDER + 'S' + ABBR_PLACEHOLDER)
             .replace(/e\.g\./g, 'e' + ABBR_PLACEHOLDER + 'g' + ABBR_PLACEHOLDER)
             .replace(/i\.e\./g, 'i' + ABBR_PLACEHOLDER + 'e' + ABBR_PLACEHOLDER)
             .replace(/St\./g, 'St' + ABBR_PLACEHOLDER);
}

function restoreAbbreviations(text) {
  return text.replaceAll(ABBR_PLACEHOLDER, '.');
}

// Check if segment is music/effects
function isMusicOrEffect(en) {
  if (!en) return false;
  const t = en.trim();
  return t.includes('♪') || /^\[.*\]$/.test(t) || /^[A-Z ]+$/.test(t) && t.includes(' ') && !t.match(/[a-z]/);
}

// Check for sound effects in all-caps (like "DOORBELL RINGS")
function isSoundEffect(en) {
  if (!en) return false;
  const t = en.trim();
  return /^[A-Z][A-Z\s]+$/.test(t) && t.length > 3;
}

// Detect sentence boundaries in text
// Returns array of sentence strings
function splitSentences(text) {
  const protected_ = protectAbbreviations(text);

  // Split on sentence-ending punctuation followed by space and capital letter
  // Also handles ?! followed by space+capital
  const parts = [];
  let current = '';

  for (let i = 0; i < protected_.length; i++) {
    current += protected_[i];

    if ((protected_[i] === '.' || protected_[i] === '?' || protected_[i] === '!') &&
        i + 1 < protected_.length && protected_[i + 1] === ' ') {
      // Check if next non-space char is uppercase
      let nextCharIdx = i + 2;
      while (nextCharIdx < protected_.length && protected_[nextCharIdx] === ' ') nextCharIdx++;
      if (nextCharIdx < protected_.length && /[A-Z"']/.test(protected_[nextCharIdx])) {
        parts.push(restoreAbbreviations(current.trim()));
        current = '';
        i++; // skip the space
        continue;
      }
    }
  }
  if (current.trim()) {
    parts.push(restoreAbbreviations(current.trim()));
  }

  return parts.filter(p => p.length > 0);
}

// Split Korean text proportionally to English sentence splits
function splitKorean(ko, enSentences, originalEn) {
  if (!ko || enSentences.length <= 1) return [ko];

  // Try to split Korean at sentence boundaries too
  // Korean sentence enders: 요, 다, 야, 어, 지, 까 + period/question/exclamation
  const koParts = ko.split(/(?<=[.?!])\s+/).filter(p => p.trim());

  if (koParts.length === enSentences.length) {
    return koParts;
  }

  // If can't split cleanly, put full ko in first segment, "" for rest
  const result = [ko];
  for (let i = 1; i < enSentences.length; i++) {
    result.push('');
  }
  return result;
}

// Split timing proportionally by character count
function splitTiming(start, end, enSentences) {
  const totalChars = enSentences.reduce((s, e) => s + e.length, 0);
  const totalDuration = end - start;

  const timings = [];
  let currentStart = start;

  for (let i = 0; i < enSentences.length; i++) {
    const proportion = enSentences[i].length / totalChars;
    const duration = totalDuration * proportion;
    const segEnd = i === enSentences.length - 1 ? end : Math.round((currentStart + duration) * 100) / 100;
    timings.push({ start: Math.round(currentStart * 100) / 100, end: segEnd });
    currentStart = segEnd;
  }

  return timings;
}

// Find clause boundary for long single-sentence splits
const CLAUSE_CONJUNCTIONS = /,\s+(and|but|because|which|so|or|when|if|although|where|while|since|that|then|before|after)\s+/i;

function findClauseBoundary(text) {
  const match = CLAUSE_CONJUNCTIONS.exec(text);
  if (!match) return -1;
  return match.index + 1; // position after the comma
}

function splitAtClause(text) {
  const idx = findClauseBoundary(text);
  if (idx === -1) return null;

  const part1 = text.substring(0, idx).trim();
  const part2 = text.substring(idx).trim();

  if (part1.length < 10 || part2.length < 10) return null;

  return [part1, part2];
}

function processFile(videoId) {
  const filePath = join(TRANSCRIPTS_DIR, `${videoId}.json`);

  if (!existsSync(filePath)) {
    console.log(`SKIP: ${videoId} - file not found`);
    return null;
  }

  let segments;
  try {
    segments = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.log(`SKIP: ${videoId} - parse error: ${e.message}`);
    return null;
  }

  if (!Array.isArray(segments) || segments.length === 0) {
    console.log(`SKIP: ${videoId} - empty or invalid`);
    return null;
  }

  const segsBefore = segments.length;
  let splits = 0;
  let merges = 0;
  let dupsRemoved = 0;

  let result = [];

  // Phase 1: Process splits (Case A, C, D)
  for (const seg of segments) {
    const en = (seg.en || '').trim();
    const ko = (seg.ko || '').trim();
    const duration = seg.end - seg.start;

    // Case H: Skip music/effects - keep as-is
    if (isMusicOrEffect(en)) {
      result.push({ ...seg });
      continue;
    }

    // Case A: Multi-sentence, duration > 3s -> SPLIT
    const sentences = splitSentences(en);

    if (sentences.length >= 2 && duration > 3) {
      // Check if any resulting segment would be < 1.5s
      const timings = splitTiming(seg.start, seg.end, sentences);
      const koParts = splitKorean(ko, sentences, en);

      // Check minimum duration for each part
      let allOk = true;
      for (const t of timings) {
        if (t.end - t.start < 1.0) { // very short
          allOk = false;
          break;
        }
      }

      if (allOk) {
        // Group segments that would be < 1.5s with neighbors
        let grouped = [];
        let groupEn = [];
        let groupKo = [];
        let groupStart = timings[0].start;

        for (let i = 0; i < sentences.length; i++) {
          groupEn.push(sentences[i]);
          groupKo.push(koParts[i]);

          const segDur = timings[i].end - timings[i].start;
          const nextSegDur = i + 1 < sentences.length ? timings[i + 1].end - timings[i + 1].start : 999;

          if (segDur >= 1.5 || i === sentences.length - 1) {
            grouped.push({
              start: groupStart,
              end: timings[i].end,
              en: groupEn.join(' '),
              ko: groupKo.filter(k => k).join(' ')
            });
            groupEn = [];
            groupKo = [];
            groupStart = i + 1 < timings.length ? timings[i + 1].start : 0;
          }
        }

        if (grouped.length > 1) {
          splits += grouped.length - 1;
          result.push(...grouped);
          continue;
        }
      }

      // If grouping collapsed everything, fall through to single-segment handling
    }

    // Case B: Multi-sentence <= 3s -> KEEP (already handled by condition above)

    // Case C: Single sentence > 8s -> try clause split
    if (sentences.length <= 1 && duration > 8) {
      const clauseParts = splitAtClause(en);
      if (clauseParts) {
        const timings = splitTiming(seg.start, seg.end, clauseParts);
        // Only split if each part >= 3s
        if (timings.every(t => (t.end - t.start) >= 3)) {
          const koParts = splitKorean(ko, clauseParts, en);
          for (let i = 0; i < clauseParts.length; i++) {
            result.push({
              start: timings[i].start,
              end: timings[i].end,
              en: clauseParts[i],
              ko: koParts[i] || ''
            });
          }
          splits += clauseParts.length - 1;
          continue;
        }
      }
    }

    // Case D: Single sentence 5-8s -> split only if >= 6s AND clear clause boundary
    if (sentences.length <= 1 && duration >= 6 && duration <= 8) {
      const clauseParts = splitAtClause(en);
      if (clauseParts) {
        const timings = splitTiming(seg.start, seg.end, clauseParts);
        if (timings.every(t => (t.end - t.start) >= 2.5)) {
          const koParts = splitKorean(ko, clauseParts, en);
          for (let i = 0; i < clauseParts.length; i++) {
            result.push({
              start: timings[i].start,
              end: timings[i].end,
              en: clauseParts[i],
              ko: koParts[i] || ''
            });
          }
          splits += clauseParts.length - 1;
          continue;
        }
      }
    }

    // Case E/F: No change needed
    result.push({ ...seg });
  }

  // Phase 2: Remove consecutive duplicates
  let deduped = [];
  for (let i = 0; i < result.length; i++) {
    if (i > 0 && result[i].en.trim() === result[i - 1].en.trim()) {
      dupsRemoved++;
      continue;
    }
    deduped.push(result[i]);
  }
  result = deduped;

  // Phase 3: Merge fragments (Case G)
  // Fragment: <=2 words AND <1.5s
  let merged = [];
  let i = 0;
  while (i < result.length) {
    const seg = result[i];
    const en = (seg.en || '').trim();
    const wordCount = en.split(/\s+/).filter(w => w.length > 0).length;
    const duration = seg.end - seg.start;

    const isFragment = wordCount <= 2 && duration < 1.5 && !isMusicOrEffect(en) && !isSoundEffect(en);

    if (isFragment && merged.length > 0) {
      // Check if previous segment doesn't end with sentence-ending punctuation
      const prevEn = (merged[merged.length - 1].en || '').trim();
      const prevEndsWithPunct = /[.?!]$/.test(prevEn);

      if (!prevEndsWithPunct) {
        // Merge with previous
        const prev = merged[merged.length - 1];
        prev.end = seg.end;
        prev.en = prev.en.trim() + ' ' + en;
        prev.ko = prev.ko ? (prev.ko.trim() + ' ' + (seg.ko || '').trim()).trim() : (seg.ko || '').trim();
        merges++;
        i++;
        continue;
      } else if (i + 1 < result.length) {
        // Merge with next
        const next = result[i + 1];
        next.start = seg.start;
        next.en = en + ' ' + (next.en || '').trim();
        next.ko = ((seg.ko || '').trim() + ' ' + (next.ko || '').trim()).trim();
        merges++;
        i++;
        continue;
      }
    }

    merged.push({ ...seg });
    i++;
  }
  result = merged;

  const segsAfter = result.length;
  const changed = splits > 0 || merges > 0 || dupsRemoved > 0;

  if (changed) {
    writeFileSync(filePath, JSON.stringify(result, null, 2) + '\n', 'utf-8');
    console.log(`CHANGED: ${videoId} - splits:${splits} merges:${merges} dups:${dupsRemoved} (${segsBefore}->${segsAfter})`);
  } else {
    console.log(`OK: ${videoId} - no changes needed (${segsBefore} segs)`);
  }

  return changed ? { splits, merges, dupsRemoved, segsBefore, segsAfter } : null;
}

// Main
console.log(`Processing ${VIDEO_IDS.length} files...\n`);

let filesProcessed = 0;
let filesChanged = 0;
let totalSplits = 0;
let totalMerges = 0;
let totalDupsRemoved = 0;
const details = {};

for (const videoId of VIDEO_IDS) {
  const result = processFile(videoId);
  filesProcessed++;

  if (result) {
    filesChanged++;
    totalSplits += result.splits;
    totalMerges += result.merges;
    totalDupsRemoved += result.dupsRemoved;
    details[videoId] = result;
  }
}

// Write report
if (!existsSync(RESULTS_DIR)) {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

const report = {
  batch: '10',
  filesProcessed,
  filesChanged,
  totalSplits,
  totalMerges,
  totalDupsRemoved,
  details
};

writeFileSync(join(RESULTS_DIR, 'batch-10.json'), JSON.stringify(report, null, 2) + '\n', 'utf-8');

console.log(`\n=== BATCH 10 SUMMARY ===`);
console.log(`Files processed: ${filesProcessed}`);
console.log(`Files changed: ${filesChanged}`);
console.log(`Total splits: ${totalSplits}`);
console.log(`Total merges: ${totalMerges}`);
console.log(`Total dups removed: ${totalDupsRemoved}`);
console.log(`Report written to: src/data/reseg-results/batch-10.json`);
