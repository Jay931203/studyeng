import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const TRANSCRIPTS_DIR = join(ROOT, 'public', 'transcripts');
const RESULTS_DIR = join(ROOT, 'src', 'data', 'reseg-results');

const VIDEO_IDS = [
  '__E9smvuAis', '_-0J49_9lwc', '_1nSBXORzdM', '_21fDo5s0BU', '_35vuv4htIw',
  '_3C69Qeyyq8', '_4B63QRIO5Q', '_8w9rOpV3gc', '_BMYVDOOQ0E', '_GdEsdEfZvc',
  '_gg4Eb5Lve8', '_gV2qfRJY94', '_hkoMopfRJU', '_-jXE-VvZqw', '_JZom_gVfuw',
  '_kS7F4VpJa0', '_LWW1ervB2Q', '_mAycORmun8', '_MOavH-Eivw', '_nbVTUYVKxg',
  '_nTpsv9PNqo', '_OmdF290gOg', '_oygxA1aaRU', '_qTZRD1_ybQ', '_qu4ZBCU6Fc',
  '_R8GtrKtrZ4', '_RchONkTtQ0', '_royauacHzU', '_rW-RHdqy9E', '_WvgGdivQzE',
  '_Y2CLPWTV1o', '-_zYn-HHcyA', '010KyIQjkTk', '01PzN8KPQOo', '09R8_2nJtjg',
  '0A20vfx-sO0'
];

// Abbreviations that should NOT be treated as sentence boundaries
const ABBREVIATIONS = /(?:Dr|Mr|Mrs|Ms|St|U\.S|Jr|Sr|Prof|vs|etc|Inc|Ltd|Corp|Gen|Gov|Sgt|Capt|Lt|Cmdr|Adm|Pvt|Cpl|Ave|Blvd|Dept|Est|Vol|No|Fig|i\.e|e\.g)\./gi;

// Detect if segment is music/effects
function isMusicOrEffects(en) {
  const trimmed = en.trim();
  return (
    trimmed.startsWith('♪') ||
    trimmed.startsWith('[music') ||
    trimmed.startsWith('[applause') ||
    trimmed.startsWith('[Music') ||
    trimmed.startsWith('[Applause') ||
    /^-?♪/.test(trimmed) ||
    trimmed === '♪' ||
    trimmed === 'applause' ||
    /^\[.*\]$/.test(trimmed)
  );
}

// Replace abbreviations with placeholders to avoid false sentence detection
function maskAbbreviations(text) {
  const masks = [];
  let masked = text;
  // Also handle "U.S." specifically
  const abbrPattern = /\b(?:Dr|Mr|Mrs|Ms|St|Jr|Sr|Prof|vs|etc|Inc|Ltd|Corp|Gen|Gov|Sgt|Capt|Lt|Cmdr|Adm|Pvt|Cpl|Ave|Blvd|Dept|Est|Vol|No|Fig)\./gi;
  masked = masked.replace(abbrPattern, (match) => {
    const placeholder = `__ABBR${masks.length}__`;
    masks.push({ placeholder, original: match });
    return placeholder;
  });
  // Handle U.S.
  masked = masked.replace(/U\.S\./g, (match) => {
    const placeholder = `__ABBR${masks.length}__`;
    masks.push({ placeholder, original: match });
    return placeholder;
  });
  // Handle i.e. and e.g.
  masked = masked.replace(/\b(?:i\.e|e\.g)\./gi, (match) => {
    const placeholder = `__ABBR${masks.length}__`;
    masks.push({ placeholder, original: match });
    return placeholder;
  });
  return { masked, masks };
}

function unmask(text, masks) {
  let result = text;
  for (const { placeholder, original } of masks) {
    result = result.replace(placeholder, original);
  }
  return result;
}

// Split text into sentences at sentence boundaries
// A sentence boundary = [.!?] followed by space and uppercase letter (or end of string)
function splitIntoSentences(text) {
  const { masked, masks } = maskAbbreviations(text);

  // Split at sentence boundaries: period/question/exclamation followed by space + capital
  const sentences = [];
  let current = '';

  for (let i = 0; i < masked.length; i++) {
    current += masked[i];

    // Check if we're at a sentence boundary
    if (/[.!?]/.test(masked[i])) {
      // Check what follows
      const next = masked[i + 1];
      const nextNext = masked[i + 2];

      // End of string
      if (i === masked.length - 1) {
        sentences.push(unmask(current.trim(), masks));
        current = '';
        continue;
      }

      // Followed by space + uppercase letter = sentence boundary
      if (next === ' ' && nextNext && /[A-Z]/.test(nextNext)) {
        sentences.push(unmask(current.trim(), masks));
        current = '';
        continue;
      }

      // Followed by " + space or similar quote patterns
      if (next === '"' || next === "'") {
        const afterQuote = masked[i + 2];
        if (afterQuote === ' ' || afterQuote === undefined) {
          current += next;
          i++;
          if (afterQuote === ' ') {
            const afterSpace = masked[i + 2];
            if (afterSpace && /[A-Z]/.test(afterSpace)) {
              sentences.push(unmask(current.trim(), masks));
              current = '';
              continue;
            }
          }
        }
      }
    }
  }

  if (current.trim()) {
    sentences.push(unmask(current.trim(), masks));
  }

  return sentences.filter(s => s.length > 0);
}

// Split Korean text to match English sentence count
function splitKorean(ko, enSentenceCount) {
  if (!ko || enSentenceCount <= 1) return [ko];

  // Try splitting Korean at sentence boundaries (. ! ? 다. 요. etc.)
  const koSentences = [];
  let remaining = ko;

  // Korean sentence endings patterns
  const koPattern = /([^.!?]*?[.!?])\s*/g;
  let match;
  const parts = [];

  // Simple approach: split by sentence-ending punctuation
  const koSplits = ko.split(/(?<=[.!?])\s+/);
  if (koSplits.length >= enSentenceCount) {
    // Distribute Korean sentences among English sentences
    const result = [];
    const perEn = Math.floor(koSplits.length / enSentenceCount);
    const remainder = koSplits.length % enSentenceCount;
    let idx = 0;
    for (let i = 0; i < enSentenceCount; i++) {
      const count = perEn + (i < remainder ? 1 : 0);
      result.push(koSplits.slice(idx, idx + count).join(' '));
      idx += count;
    }
    return result;
  }

  // Can't cleanly split - put all in first, empty for rest
  const result = [ko];
  for (let i = 1; i < enSentenceCount; i++) {
    result.push('');
  }
  return result;
}

// Find clause boundary for splitting long single sentences (Case C/D)
function findClauseBoundary(text) {
  // Look for ", conjunction" patterns
  const clausePatterns = [
    ', and ', ', but ', ', because ', ', which ', ', so ',
    ', or ', ', when ', ', if ', ', although ', ', while ',
    ', where ', ', since ', ', though ', ', until ', ', unless ',
    ', yet ', ', nor ', ', after ', ', before ', ', that '
  ];

  const candidates = [];
  for (const pattern of clausePatterns) {
    const idx = text.indexOf(pattern);
    if (idx > -1) {
      candidates.push({ idx, len: pattern.length, splitAt: idx + 2 }); // split after ", "
    }
  }

  if (candidates.length === 0) return null;

  // Prefer the boundary closest to the middle
  const mid = text.length / 2;
  candidates.sort((a, b) => Math.abs(a.idx - mid) - Math.abs(b.idx - mid));
  return candidates[0].idx + 2; // position after ", " where second part starts
}

// Find Korean clause boundary to match English split position
function findKoClauseBoundary(ko, enRatio) {
  // Try to find a boundary near the proportional position
  const targetIdx = Math.floor(ko.length * enRatio);

  // Look for Korean clause markers near the target
  const markers = [', ', '고 ', '지만 ', '는데 ', '면서 ', '니까 ', '어서 '];
  let best = null;
  let bestDist = Infinity;

  for (const marker of markers) {
    let searchStart = Math.max(0, targetIdx - 20);
    let searchEnd = Math.min(ko.length, targetIdx + 20);
    let idx = ko.indexOf(marker, searchStart);
    while (idx !== -1 && idx < searchEnd) {
      const dist = Math.abs(idx - targetIdx);
      if (dist < bestDist) {
        bestDist = dist;
        best = idx + marker.length;
      }
      idx = ko.indexOf(marker, idx + 1);
    }
  }

  return best;
}

// Round to 2 decimal places
function round2(n) {
  return Math.round(n * 100) / 100;
}

// Count word count
function wordCount(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

// Process a single transcript
function processTranscript(videoId) {
  const filePath = join(TRANSCRIPTS_DIR, `${videoId}.json`);
  let segments;
  try {
    segments = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`  ERROR reading ${videoId}: ${e.message}`);
    return null;
  }

  const segsBefore = segments.length;
  let splits = 0;
  let merges = 0;
  let dupsRemoved = 0;

  // Phase 1: Remove consecutive duplicates
  let deduped = [];
  for (let i = 0; i < segments.length; i++) {
    if (i > 0 && segments[i].en === segments[i - 1].en) {
      dupsRemoved++;
      continue;
    }
    deduped.push({ ...segments[i] });
  }

  // Phase 2: Process splits (Cases A, C, D)
  let processed = [];
  for (const seg of deduped) {
    const duration = seg.end - seg.start;
    const en = seg.en.trim();
    const ko = (seg.ko || '').trim();

    // Case H: Music/effects - skip
    if (isMusicOrEffects(en)) {
      processed.push(seg);
      continue;
    }

    // Detect multi-sentence
    const sentences = splitIntoSentences(en);

    if (sentences.length >= 2) {
      // Case A or B: Multi-sentence
      if (duration > 3) {
        // Case A: Split
        const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
        const koSentences = splitKorean(ko, sentences.length);

        // Check if any split segment would be < 1.5s
        let canSplit = true;
        for (const s of sentences) {
          const sDur = duration * (s.length / totalChars);
          if (sDur < 1.5) {
            canSplit = false;
            break;
          }
        }

        if (canSplit) {
          let currentStart = seg.start;
          for (let i = 0; i < sentences.length; i++) {
            const ratio = sentences[i].length / totalChars;
            const sDur = duration * ratio;
            const newEnd = round2(currentStart + sDur);
            processed.push({
              start: round2(currentStart),
              end: i === sentences.length - 1 ? seg.end : newEnd,
              en: sentences[i],
              ko: koSentences[i] || ''
            });
            currentStart = newEnd;
          }
          splits += sentences.length - 1;
        } else {
          // Some segments too short - try grouping short ones
          // Group consecutive short sentences together
          const groups = [];
          let currentGroup = [0];

          for (let i = 1; i < sentences.length; i++) {
            const prevDur = duration * (sentences[i - 1].length / totalChars);
            const curDur = duration * (sentences[i].length / totalChars);

            if (curDur < 1.5) {
              // Merge with current group
              currentGroup.push(i);
            } else if (prevDur < 1.5 && currentGroup.length > 0) {
              // Previous was short, already in group
              currentGroup.push(i);
            } else {
              groups.push(currentGroup);
              currentGroup = [i];
            }
          }
          groups.push(currentGroup);

          if (groups.length > 1) {
            const koSents = splitKorean(ko, groups.length);
            let currentStart = seg.start;
            for (let g = 0; g < groups.length; g++) {
              const groupSentences = groups[g].map(i => sentences[i]);
              const groupChars = groupSentences.reduce((s, t) => s + t.length, 0);
              const ratio = groupChars / totalChars;
              const gDur = duration * ratio;
              const newEnd = round2(currentStart + gDur);
              processed.push({
                start: round2(currentStart),
                end: g === groups.length - 1 ? seg.end : newEnd,
                en: groupSentences.join(' '),
                ko: koSents[g] || ''
              });
              currentStart = newEnd;
            }
            splits += groups.length - 1;
          } else {
            processed.push(seg);
          }
        }
      } else {
        // Case B: duration <= 3s, keep as is
        processed.push(seg);
      }
    } else {
      // Single sentence
      if (duration > 8) {
        // Case C: Try to split at clause boundary
        const boundary = findClauseBoundary(en);
        if (boundary !== null) {
          const part1 = en.substring(0, boundary).trim();
          const part2 = en.substring(boundary).trim();
          const part1Chars = part1.length;
          const totalChars = en.length;
          const part1Duration = duration * (part1Chars / totalChars);
          const part2Duration = duration - part1Duration;

          if (part1Duration >= 3 && part2Duration >= 3) {
            const splitTime = round2(seg.start + part1Duration);
            const enRatio = part1Chars / totalChars;
            const koBoundary = findKoClauseBoundary(ko, enRatio);
            let ko1 = ko, ko2 = '';
            if (koBoundary) {
              ko1 = ko.substring(0, koBoundary).trim();
              ko2 = ko.substring(koBoundary).trim();
            }
            processed.push({
              start: seg.start,
              end: splitTime,
              en: part1,
              ko: ko1
            });
            processed.push({
              start: splitTime,
              end: seg.end,
              en: part2,
              ko: ko2
            });
            splits++;
          } else {
            processed.push(seg);
          }
        } else {
          processed.push(seg);
        }
      } else if (duration >= 6 && duration <= 8) {
        // Case D: Only split if >= 6s and clear clause boundary
        const boundary = findClauseBoundary(en);
        if (boundary !== null) {
          const part1 = en.substring(0, boundary).trim();
          const part2 = en.substring(boundary).trim();
          const part1Chars = part1.length;
          const totalChars = en.length;
          const part1Duration = duration * (part1Chars / totalChars);
          const part2Duration = duration - part1Duration;

          if (part1Duration >= 3 && part2Duration >= 3) {
            const splitTime = round2(seg.start + part1Duration);
            const enRatio = part1Chars / totalChars;
            const koBoundary = findKoClauseBoundary(ko, enRatio);
            let ko1 = ko, ko2 = '';
            if (koBoundary) {
              ko1 = ko.substring(0, koBoundary).trim();
              ko2 = ko.substring(koBoundary).trim();
            }
            processed.push({
              start: seg.start,
              end: splitTime,
              en: part1,
              ko: ko1
            });
            processed.push({
              start: splitTime,
              end: seg.end,
              en: part2,
              ko: ko2
            });
            splits++;
          } else {
            processed.push(seg);
          }
        } else {
          processed.push(seg);
        }
      } else {
        // Case E/F: < 5s single sentence, no change
        processed.push(seg);
      }
    }
  }

  // Phase 3: Merge fragments (Case G)
  let merged = [];
  let i = 0;
  while (i < processed.length) {
    const seg = processed[i];
    const en = seg.en.trim();
    const duration = seg.end - seg.start;
    const words = wordCount(en);

    // Case G: Fragment detection
    if (words <= 2 && duration < 1.5 && !isMusicOrEffects(en)) {
      // Try merging with adjacent
      const prev = merged.length > 0 ? merged[merged.length - 1] : null;
      const next = i + 1 < processed.length ? processed[i + 1] : null;

      if (prev && !isMusicOrEffects(prev.en)) {
        // Check if previous doesn't end with sentence punctuation
        const prevEnds = /[.!?]$/.test(prev.en.trim());
        if (!prevEnds) {
          // Merge with previous
          prev.end = seg.end;
          prev.en = prev.en.trim() + ' ' + en;
          prev.ko = (prev.ko || '').trim() + ' ' + (seg.ko || '').trim();
          prev.ko = prev.ko.trim();
          merges++;
          i++;
          continue;
        } else if (next && !isMusicOrEffects(next.en)) {
          // Merge with next
          next.start = seg.start;
          next.en = en + ' ' + next.en.trim();
          next.ko = ((seg.ko || '').trim() + ' ' + (next.ko || '').trim()).trim();
          merges++;
          i++;
          continue;
        }
      } else if (next && !isMusicOrEffects(next.en)) {
        // No previous, merge with next
        next.start = seg.start;
        next.en = en + ' ' + next.en.trim();
        next.ko = ((seg.ko || '').trim() + ' ' + (next.ko || '').trim()).trim();
        merges++;
        i++;
        continue;
      }
    }

    merged.push(seg);
    i++;
  }

  const segsAfter = merged.length;
  const changed = splits > 0 || merges > 0 || dupsRemoved > 0;

  if (changed) {
    writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf-8');
  }

  return {
    changed,
    splits,
    merges,
    dupsRemoved,
    segsBefore,
    segsAfter
  };
}

// Main
function main() {
  console.log(`Processing ${VIDEO_IDS.length} transcript files...\n`);

  let filesProcessed = 0;
  let filesChanged = 0;
  let totalSplits = 0;
  let totalMerges = 0;
  let totalDupsRemoved = 0;
  const details = {};

  for (const videoId of VIDEO_IDS) {
    process.stdout.write(`  ${videoId}: `);
    const result = processTranscript(videoId);

    if (!result) {
      console.log('SKIPPED (read error)');
      continue;
    }

    filesProcessed++;

    if (result.changed) {
      filesChanged++;
      totalSplits += result.splits;
      totalMerges += result.merges;
      totalDupsRemoved += result.dupsRemoved;
      details[videoId] = {
        splits: result.splits,
        merges: result.merges,
        dupsRemoved: result.dupsRemoved,
        segsBefore: result.segsBefore,
        segsAfter: result.segsAfter
      };
      console.log(`CHANGED (splits: ${result.splits}, merges: ${result.merges}, dups: ${result.dupsRemoved}, ${result.segsBefore} -> ${result.segsAfter} segs)`);
    } else {
      console.log(`no changes (${result.segsBefore} segs)`);
    }
  }

  const report = {
    batch: '00',
    filesProcessed,
    filesChanged,
    totalSplits,
    totalMerges,
    totalDupsRemoved,
    details
  };

  mkdirSync(RESULTS_DIR, { recursive: true });
  writeFileSync(join(RESULTS_DIR, 'batch-00.json'), JSON.stringify(report, null, 2), 'utf-8');

  console.log('\n=== SUMMARY ===');
  console.log(`Files processed: ${filesProcessed}`);
  console.log(`Files changed: ${filesChanged}`);
  console.log(`Total splits: ${totalSplits}`);
  console.log(`Total merges: ${totalMerges}`);
  console.log(`Total dups removed: ${totalDupsRemoved}`);
  console.log(`\nReport saved to src/data/reseg-results/batch-00.json`);
}

main();
