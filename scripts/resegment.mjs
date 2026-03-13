import fs from 'fs';
import path from 'path';

const TRANSCRIPT_DIR = path.resolve('public/transcripts');

const FILES = [
  '4ZK8Z8hulFg.json',
  'ImmaMjeQAqI.json',
  'yH6C3JbCXxo.json',
  'sdgvyJ7R23Y.json',
  'QPig73PjDF0.json',
  'pYAnIBWl8z0.json',
  'ZfaK6ncKynE.json',
];

// Abbreviations to exclude from sentence boundary detection
const ABBREVIATIONS = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'St.', 'U.S.', 'Jr.', 'Sr.'];

function isMusic(en) {
  return /[♪]|\[music\]|\[applause\]/i.test(en);
}

function isSongLyric(segments, idx) {
  // Heuristic: if many segments in sequence look like verse lines
  return false; // We'll handle MmfmCR4Kta4 specially
}

// Detect sentence boundaries (period/question/exclamation + space + uppercase)
// Exclude abbreviations
function findSentenceBoundaries(text) {
  const boundaries = [];
  const regex = /([.!?])\s+([A-Z])/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const beforeMatch = text.substring(0, match.index + 1);
    // Check if this is an abbreviation
    let isAbbrev = false;
    for (const abbr of ABBREVIATIONS) {
      if (beforeMatch.endsWith(abbr)) {
        isAbbrev = true;
        break;
      }
    }
    if (!isAbbrev) {
      // boundary is after the punctuation + space
      boundaries.push(match.index + match[1].length);
    }
  }
  return boundaries;
}

// Split text at boundary positions (each boundary is index after punctuation)
function splitAtBoundaries(text, boundaries) {
  const parts = [];
  let prev = 0;
  for (const b of boundaries) {
    // b is the position after the punctuation char, before the space
    const splitPos = b + 1; // after the space
    parts.push(text.substring(prev, splitPos).trim());
    prev = splitPos;
  }
  parts.push(text.substring(prev).trim());
  return parts.filter(p => p.length > 0);
}

// Split Korean text trying to match English sentence splits
function splitKorean(ko, enParts) {
  if (!ko || ko.trim() === '') return enParts.map(() => '');

  // Try to split Korean at sentence boundaries too
  const koBoundaries = [];
  const koRegex = /([.!?。])\s+/g;
  let match;
  while ((match = koRegex.exec(ko)) !== null) {
    koBoundaries.push(match.index + match[1].length);
  }

  if (koBoundaries.length >= enParts.length - 1) {
    // We have enough Korean boundaries
    const koParts = splitAtBoundaries(ko, koBoundaries.slice(0, enParts.length - 1));
    if (koParts.length === enParts.length) return koParts;
  }

  // Fallback: full ko in first, empty for rest
  const result = [ko];
  for (let i = 1; i < enParts.length; i++) result.push('');
  return result;
}

// Distribute time by character count ratio
function distributeTime(start, end, parts) {
  const totalDuration = end - start;
  const totalChars = parts.reduce((s, p) => s + p.length, 0);
  const times = [];
  let currentStart = start;

  for (let i = 0; i < parts.length; i++) {
    const ratio = parts[i].length / totalChars;
    let duration = totalDuration * ratio;
    if (duration < 1 && i < parts.length - 1) duration = 1; // minimum 1s
    const segEnd = i === parts.length - 1 ? end : Math.round((currentStart + duration) * 100) / 100;
    times.push({ start: Math.round(currentStart * 100) / 100, end: Math.round(segEnd * 100) / 100 });
    currentStart = segEnd;
  }
  return times;
}

// Find clause boundaries for long sentences
function findClauseBoundary(text) {
  const patterns = [', and ', ', but ', ', because ', ', which ', ', so ', ', when ', ', where ', ', if ', ', though ', ', although '];
  let bestIdx = -1;
  let bestKeyword = '';
  const mid = text.length / 2;

  for (const pat of patterns) {
    let idx = text.indexOf(pat);
    while (idx !== -1) {
      if (bestIdx === -1 || Math.abs(idx - mid) < Math.abs(bestIdx - mid)) {
        bestIdx = idx;
        bestKeyword = pat;
      }
      idx = text.indexOf(pat, idx + 1);
    }
  }

  if (bestIdx !== -1) {
    return bestIdx + 2; // split after the comma+space (keep conjunction with second part)
  }
  return -1;
}

// Check if punctuation fix needed
function needsPunctuationFix(en) {
  if (en.length <= 10) return false;
  const trimmed = en.trim();
  const lastChar = trimmed[trimmed.length - 1];
  if (['.', '!', '?', '"', "'", '-', ')'].includes(lastChar)) return false;
  return true;
}

function addPunctuation(en) {
  const trimmed = en.trim();
  // If it's a question
  if (/^(what|who|where|when|why|how|is|are|do|does|did|can|could|would|will|shall|should|have|has|had)/i.test(trimmed)) {
    return trimmed + '?';
  }
  return trimmed + '.';
}

function processFile(filename) {
  const filepath = path.join(TRANSCRIPT_DIR, filename);
  const segments = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  const result = [];
  let splits = 0;
  let merges = 0;
  let punctuationFixes = 0;

  // First pass: identify fragments to merge (Case G)
  const toMerge = new Set();
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const duration = seg.end - seg.start;
    const wordCount = seg.en.trim().split(/\s+/).length;
    if (wordCount <= 2 && duration < 1.5 && !isMusic(seg.en)) {
      toMerge.add(i);
    }
  }

  // Build merged segments
  const merged = [];
  let i = 0;
  while (i < segments.length) {
    if (toMerge.has(i)) {
      // Merge with previous if possible
      if (merged.length > 0) {
        const prev = merged[merged.length - 1];
        prev.end = segments[i].end;
        prev.en = prev.en + ' ' + segments[i].en;
        prev.ko = prev.ko ? (prev.ko + ' ' + (segments[i].ko || '')).trim() : (segments[i].ko || '');
        merges++;
      } else {
        // No previous, merge with next
        if (i + 1 < segments.length) {
          merged.push({
            start: segments[i].start,
            end: segments[i + 1].end,
            en: segments[i].en + ' ' + segments[i + 1].en,
            ko: ((segments[i].ko || '') + ' ' + (segments[i + 1].ko || '')).trim(),
          });
          merges++;
          i += 2;
          continue;
        } else {
          merged.push({ ...segments[i] });
        }
      }
    } else {
      merged.push({ ...segments[i] });
    }
    i++;
  }

  // Second pass: apply splitting rules
  for (const seg of merged) {
    if (isMusic(seg.en)) {
      result.push(seg);
      continue;
    }

    const duration = seg.end - seg.start;
    const boundaries = findSentenceBoundaries(seg.en);
    const sentenceCount = boundaries.length + 1;

    // Case A: Multi-sentence, >3 seconds
    if (sentenceCount >= 2 && duration > 3) {
      const enParts = splitAtBoundaries(seg.en, boundaries);

      // Check if individual sentences would be too short (<1.5s each)
      const avgDuration = duration / enParts.length;

      let finalParts;
      if (avgDuration < 1.5 && enParts.length > 2) {
        // Group sentences so each group >= 1.5s
        finalParts = [];
        let group = enParts[0];
        let groupChars = enParts[0].length;
        const totalChars = enParts.reduce((s, p) => s + p.length, 0);

        for (let j = 1; j < enParts.length; j++) {
          const groupRatio = (groupChars + enParts[j].length) / totalChars;
          const groupDur = duration * groupRatio;

          if (groupDur < 1.5 && j < enParts.length - 1) {
            group += ' ' + enParts[j];
            groupChars += enParts[j].length;
          } else {
            group += ' ' + enParts[j];
            groupChars += enParts[j].length;
            finalParts.push(group);
            group = '';
            groupChars = 0;
          }
        }
        if (group) finalParts.push(group);
      } else {
        finalParts = enParts;
      }

      if (finalParts.length >= 2) {
        const koParts = splitKorean(seg.ko, finalParts);
        const times = distributeTime(seg.start, seg.end, finalParts);

        for (let j = 0; j < finalParts.length; j++) {
          result.push({
            start: times[j].start,
            end: times[j].end,
            en: finalParts[j].trim(),
            ko: (koParts[j] || '').trim(),
          });
        }
        splits += finalParts.length - 1;
        continue;
      }
    }

    // Case B: Multi-sentence, <=3 seconds - keep as is
    if (sentenceCount >= 2 && duration <= 3) {
      result.push(seg);
      continue;
    }

    // Case C: Single very long sentence, >8 seconds
    if (sentenceCount === 1 && duration > 8) {
      const clausePos = findClauseBoundary(seg.en);
      if (clausePos !== -1) {
        const part1 = seg.en.substring(0, clausePos).trim();
        const part2 = seg.en.substring(clausePos).trim();
        const totalChars = part1.length + part2.length;
        const ratio1 = part1.length / totalChars;
        const dur1 = duration * ratio1;
        const dur2 = duration - dur1;

        if (dur1 >= 3 && dur2 >= 3) {
          const mid = Math.round((seg.start + dur1) * 100) / 100;
          const koParts = splitKorean(seg.ko, [part1, part2]);
          result.push({ start: seg.start, end: mid, en: part1, ko: koParts[0] });
          result.push({ start: mid, end: seg.end, en: part2, ko: koParts[1] });
          splits++;
          continue;
        }
      }
    }

    // Case D: Single long sentence, 5-8 seconds
    if (sentenceCount === 1 && duration >= 6 && duration <= 8) {
      const clausePos = findClauseBoundary(seg.en);
      if (clausePos !== -1) {
        const part1 = seg.en.substring(0, clausePos).trim();
        const part2 = seg.en.substring(clausePos).trim();
        const totalChars = part1.length + part2.length;
        const ratio1 = part1.length / totalChars;
        const dur1 = duration * ratio1;
        const dur2 = duration - dur1;

        if (dur1 >= 2 && dur2 >= 2) {
          const mid = Math.round((seg.start + dur1) * 100) / 100;
          const koParts = splitKorean(seg.ko, [part1, part2]);
          result.push({ start: seg.start, end: mid, en: part1, ko: koParts[0] });
          result.push({ start: mid, end: seg.end, en: part2, ko: koParts[1] });
          splits++;
          continue;
        }
      }
    }

    // Case E/F: Normal segments - keep
    result.push(seg);
  }

  // Third pass: punctuation fixes
  for (const seg of result) {
    if (isMusic(seg.en)) continue;
    if (needsPunctuationFix(seg.en)) {
      seg.en = addPunctuation(seg.en);
      punctuationFixes++;
    }
  }

  return { result, splits, merges, punctuationFixes };
}

// Process all files
console.log('=== Subtitle Re-segmentation Report ===\n');
let totalSplits = 0, totalMerges = 0, totalPuncFixes = 0;
let filesModified = 0;

for (const file of FILES) {
  const { result, splits, merges, punctuationFixes } = processFile(file);
  const totalChanges = splits + merges + punctuationFixes;

  console.log(`${file}:`);
  console.log(`  Splits: ${splits}, Merges: ${merges}, Punctuation fixes: ${punctuationFixes}`);

  if (totalChanges > 0) {
    const filepath = path.join(TRANSCRIPT_DIR, file);
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2) + '\n');
    console.log(`  -> Written (${result.length} segments)`);
    filesModified++;
  } else {
    console.log(`  -> No changes needed`);
  }

  totalSplits += splits;
  totalMerges += merges;
  totalPuncFixes += punctuationFixes;
}

console.log(`\n=== Summary ===`);
console.log(`Files modified: ${filesModified}/${FILES.length}`);
console.log(`Total splits: ${totalSplits}`);
console.log(`Total merges: ${totalMerges}`);
console.log(`Total punctuation fixes: ${totalPuncFixes}`);
