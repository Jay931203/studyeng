import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT = 'C:/Users/hyunj/studyeng';
const TRANSCRIPTS = join(ROOT, 'public/transcripts');
const RESULTS_DIR = join(ROOT, 'src/data/reseg-results');

const VIDEO_IDS = [
  'Cx0xzO73Amo','CX11yw6YL1w','Cy9KkuPmQ_s','cYGuWN1OhD8','CyOmCdtRrgo',
  'cZAw8qxn0ZE','D1JZBseDjfU','D3tYM5zVvJU','d4ftmOI5NnI','d7ONQzygvB0',
  'd8RIS5GJqAg','d8uTB5XorBw','D9MS2y2YU_o','D9tAKLTktY0','DA2ukcfd9Vo',
  'DAhFW_auT20','DAYXlC59yWs','DbCM6WvB57c','dC1yHLp9bWA','DdjWGbPUmrg',
  'ddXUQu9RC4U','DeITUPgQiyY','desJKYvdq9A','DGbIzSq4eWA','dGIGG6QLjLg',
  'dgMKzky9S4I','Di8Z7rJ9vnI','DIIIDF6bkqI','dJbntFepz0o','djV11Xbc914',
  'DkSMrI86NWk','DLzxrzFCyOs','dMbnfxwus0s','dmIFhpQe9Zk','dnRxQ3dcaQk',
  'DNXGUn0Yrb8'
];

// Abbreviation patterns that look like sentence boundaries but aren't
const ABBREVS = /(?:Dr|Mr|Mrs|Ms|U\.S|St|Jr|Sr|Prof|Gen|Gov|Sgt|Cpl|Pvt|Lt|Capt|Col|Maj|Rev|Vol|vs|etc|Inc|Corp|Ltd|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\./gi;

// Placeholder to protect abbreviations
function protectAbbrevs(text) {
  const replacements = [];
  let idx = 0;
  const protected_ = text.replace(ABBREVS, (m) => {
    const placeholder = `__ABBR${idx}__`;
    replacements.push({ placeholder, original: m });
    idx++;
    return placeholder;
  });
  return { text: protected_, replacements };
}

function restoreAbbrevs(text, replacements) {
  let result = text;
  for (const { placeholder, original } of replacements) {
    result = result.replace(placeholder, original);
  }
  return result;
}

// Check if segment is music/effects
function isMusic(en) {
  if (!en) return true;
  const t = en.trim();
  if (t.startsWith('♪') || t.startsWith('[music') || t.startsWith('[Music')
    || /^\[.*\]$/.test(t) || /^♪.*♪$/.test(t)) return true;
  return false;
}

// Detect multi-sentence: [.?!] followed by space and uppercase letter
function findSentenceBoundaries(en) {
  const { text, replacements } = protectAbbrevs(en);
  const boundaries = [];
  // Match sentence-ending punctuation followed by space and uppercase
  const re = /([.?!])\s+(?=[A-Z])/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    // Position right after the punctuation+space (the split point in original text)
    // We need to map back to original positions
    boundaries.push(m.index + m[0].length);
  }
  // Also handle "..." followed by space+uppercase
  // Already handled by the [.] in regex

  if (boundaries.length === 0) return null;

  // Split text at boundaries
  const parts = [];
  let lastIdx = 0;
  for (const b of boundaries) {
    parts.push(text.substring(lastIdx, b).trim());
    lastIdx = b;
  }
  parts.push(text.substring(lastIdx).trim());

  // Restore abbreviations in each part
  return parts.map(p => restoreAbbrevs(p, replacements)).filter(p => p.length > 0);
}

// Find clause boundary for long single-sentence splitting
function findClauseBoundary(en) {
  // Look for ", and/but/because/which/so/or/when/if/although/that/where/while"
  const re = /,\s+(?:and|but|because|which|so|or|when|if|although|that|where|while|though|since|as|before|after|until|unless)\s+/gi;
  const boundaries = [];
  let m;
  while ((m = re.exec(en)) !== null) {
    // Include the comma in the first part, split after ", word "
    boundaries.push({ idx: m.index + 1, fullMatch: m[0], splitAfter: m.index + m[0].length });
  }
  return boundaries;
}

// Proportionally split timing by character count
function splitTiming(start, end, parts) {
  const totalChars = parts.reduce((s, p) => s + p.length, 0);
  if (totalChars === 0) return parts.map(() => ({ start, end }));

  const duration = end - start;
  const result = [];
  let currentStart = start;

  for (let i = 0; i < parts.length; i++) {
    const partDuration = (parts[i].length / totalChars) * duration;
    const partEnd = i === parts.length - 1 ? end : Math.round((currentStart + partDuration) * 100) / 100;
    result.push({
      start: Math.round(currentStart * 100) / 100,
      end: Math.round(partEnd * 100) / 100
    });
    currentStart = partEnd;
  }
  return result;
}

// Try to split Korean at matching sentence boundary
function splitKorean(ko, enParts) {
  if (!ko || enParts.length <= 1) return enParts.map((_, i) => i === 0 ? ko : '');

  // Try splitting Korean by sentence-ending punctuation
  const koSentences = ko.split(/(?<=[.?!。？！])\s+/).filter(s => s.trim());

  if (koSentences.length === enParts.length) {
    return koSentences;
  }

  // Try splitting by comma for clause-split cases
  if (enParts.length === 2) {
    // Look for natural Korean split points
    const commaIdx = ko.indexOf(',');
    if (commaIdx > 0 && commaIdx < ko.length - 2) {
      return [ko.substring(0, commaIdx + 1).trim(), ko.substring(commaIdx + 1).trim()];
    }
  }

  // Can't split cleanly: full ko in first, empty for rest
  return enParts.map((_, i) => i === 0 ? ko : '');
}

function processTranscript(videoId) {
  const filePath = join(TRANSCRIPTS, `${videoId}.json`);
  let segments;
  try {
    segments = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`Failed to read ${videoId}: ${e.message}`);
    return null;
  }

  if (!Array.isArray(segments) || segments.length === 0) return null;

  const segsBefore = segments.length;
  let splits = 0;
  let merges = 0;
  let dupsRemoved = 0;

  // Step 1: Remove consecutive duplicate en segments
  let deduped = [];
  for (let i = 0; i < segments.length; i++) {
    if (i > 0 && segments[i].en === segments[i-1].en && segments[i].en) {
      dupsRemoved++;
      continue;
    }
    deduped.push({ ...segments[i] });
  }

  // Step 2: Process each segment for splitting
  let processed = [];
  for (const seg of deduped) {
    const en = (seg.en || '').trim();
    const ko = (seg.ko || '').trim();
    const duration = seg.end - seg.start;

    // Case H: Music/effects - skip processing, keep as-is
    if (isMusic(en)) {
      processed.push(seg);
      continue;
    }

    // Case A: Multi-sentence segment, duration > 3s
    const sentences = findSentenceBoundaries(en);
    if (sentences && sentences.length > 1 && duration > 3) {
      // Check if any resulting segment would be too short (<1.5s)
      const timings = splitTiming(seg.start, seg.end, sentences);

      // Group short segments together
      const groups = [];
      let currentGroup = { sentences: [sentences[0]], timing: timings[0] };

      for (let i = 1; i < sentences.length; i++) {
        const segDuration = timings[i].end - timings[i].start;
        const currentDuration = currentGroup.timing.end - currentGroup.timing.start;

        if (segDuration < 1.5 || currentDuration < 1.5) {
          // Merge with current group
          currentGroup.sentences.push(sentences[i]);
          currentGroup.timing.end = timings[i].end;
        } else {
          groups.push(currentGroup);
          currentGroup = { sentences: [sentences[i]], timing: timings[i] };
        }
      }
      groups.push(currentGroup);

      if (groups.length > 1) {
        const enParts = groups.map(g => g.sentences.join(' '));
        const koParts = splitKorean(ko, enParts);

        for (let i = 0; i < groups.length; i++) {
          processed.push({
            start: groups[i].timing.start,
            end: groups[i].timing.end,
            en: enParts[i],
            ko: koParts[i]
          });
        }
        splits += groups.length - 1;
        continue;
      }
    }

    // Case B: Multi-sentence <=3s -> KEEP (already handled above by duration check)

    // Case C: Single sentence > 8s -> SPLIT at clause boundary
    if (duration > 8 && (!sentences || sentences.length <= 1)) {
      const clauses = findClauseBoundary(en);
      if (clauses.length > 0) {
        // Find the best split point (closest to middle)
        const mid = en.length / 2;
        let bestClause = clauses[0];
        let bestDist = Math.abs(clauses[0].splitAfter - mid);
        for (const c of clauses) {
          const dist = Math.abs(c.splitAfter - mid);
          if (dist < bestDist) {
            bestDist = dist;
            bestClause = c;
          }
        }

        const part1 = en.substring(0, bestClause.idx).trim();
        const part2 = en.substring(bestClause.idx).trim();
        // Remove leading comma from part2
        const part2Clean = part2.replace(/^,\s*/, '').trim();
        const part1Final = part1 + ',';

        const timings = splitTiming(seg.start, seg.end, [part1Final, part2Clean]);

        // Only split if each part >= 3s
        const dur1 = timings[0].end - timings[0].start;
        const dur2 = timings[1].end - timings[1].start;

        if (dur1 >= 3 && dur2 >= 3) {
          const koParts = splitKorean(ko, [part1Final, part2Clean]);
          processed.push({ start: timings[0].start, end: timings[0].end, en: part1Final, ko: koParts[0] });
          processed.push({ start: timings[1].start, end: timings[1].end, en: part2Clean, ko: koParts[1] });
          splits++;
          continue;
        }
      }
    }

    // Case D: Single sentence 5-8s -> split only if >= 6s AND clear clause boundary
    if (duration >= 6 && duration <= 8 && (!sentences || sentences.length <= 1)) {
      const clauses = findClauseBoundary(en);
      if (clauses.length > 0) {
        const mid = en.length / 2;
        let bestClause = clauses[0];
        let bestDist = Math.abs(clauses[0].splitAfter - mid);
        for (const c of clauses) {
          const dist = Math.abs(c.splitAfter - mid);
          if (dist < bestDist) {
            bestDist = dist;
            bestClause = c;
          }
        }

        const part1 = en.substring(0, bestClause.idx).trim() + ',';
        const part2 = en.substring(bestClause.idx).replace(/^,\s*/, '').trim();

        const timings = splitTiming(seg.start, seg.end, [part1, part2]);
        const dur1 = timings[0].end - timings[0].start;
        const dur2 = timings[1].end - timings[1].start;

        if (dur1 >= 3 && dur2 >= 3) {
          const koParts = splitKorean(ko, [part1, part2]);
          processed.push({ start: timings[0].start, end: timings[0].end, en: part1, ko: koParts[0] });
          processed.push({ start: timings[1].start, end: timings[1].end, en: part2, ko: koParts[1] });
          splits++;
          continue;
        }
      }
    }

    // Case E/F: Keep as is
    processed.push(seg);
  }

  // Step 3: Merge fragments (<=2 words, <1.5s) with adjacent
  let merged = [];
  for (let i = 0; i < processed.length; i++) {
    const seg = processed[i];
    const en = (seg.en || '').trim();
    const duration = seg.end - seg.start;
    const wordCount = en.split(/\s+/).filter(w => w).length;

    if (isMusic(en)) {
      merged.push(seg);
      continue;
    }

    if (wordCount <= 2 && duration < 1.5 && en.length > 0) {
      // Try merge with previous
      if (merged.length > 0) {
        const prev = merged[merged.length - 1];
        const prevEn = (prev.en || '').trim();
        // Merge with prev if prev doesn't end with sentence-ending punct
        if (prevEn && !/[.?!]$/.test(prevEn)) {
          prev.end = seg.end;
          prev.en = prevEn + ' ' + en;
          prev.ko = ((prev.ko || '') + ' ' + (seg.ko || '')).trim();
          merges++;
          continue;
        }
      }
      // Try merge with next
      if (i + 1 < processed.length) {
        const next = processed[i + 1];
        next.start = seg.start;
        next.en = en + ' ' + (next.en || '').trim();
        next.ko = ((seg.ko || '') + ' ' + (next.ko || '')).trim();
        merges++;
        continue;
      }
    }

    merged.push(seg);
  }

  const segsAfter = merged.length;
  const changed = splits > 0 || merges > 0 || dupsRemoved > 0;

  if (changed) {
    writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf8');
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
console.log('=== Batch 13 Re-segmentation ===');
console.log(`Processing ${VIDEO_IDS.length} files...\n`);

let filesProcessed = 0;
let filesChanged = 0;
let totalSplits = 0;
let totalMerges = 0;
let totalDupsRemoved = 0;
const details = {};

for (const id of VIDEO_IDS) {
  const result = processTranscript(id);
  filesProcessed++;

  if (!result) {
    console.log(`  ${id}: SKIP (empty/error)`);
    continue;
  }

  if (result.changed) {
    filesChanged++;
    totalSplits += result.splits;
    totalMerges += result.merges;
    totalDupsRemoved += result.dupsRemoved;
    details[id] = {
      splits: result.splits,
      merges: result.merges,
      dupsRemoved: result.dupsRemoved,
      segsBefore: result.segsBefore,
      segsAfter: result.segsAfter
    };
    console.log(`  ${id}: ${result.segsBefore} -> ${result.segsAfter} segs (splits:${result.splits}, merges:${result.merges}, dups:${result.dupsRemoved})`);
  } else {
    console.log(`  ${id}: no changes (${result.segsBefore} segs)`);
  }
}

const report = {
  batch: '13',
  filesProcessed,
  filesChanged,
  totalSplits,
  totalMerges,
  totalDupsRemoved,
  details
};

mkdirSync(RESULTS_DIR, { recursive: true });
writeFileSync(join(RESULTS_DIR, 'batch-13.json'), JSON.stringify(report, null, 2), 'utf8');

console.log(`\n=== Summary ===`);
console.log(`Files processed: ${filesProcessed}`);
console.log(`Files changed: ${filesChanged}`);
console.log(`Total splits: ${totalSplits}`);
console.log(`Total merges: ${totalMerges}`);
console.log(`Total dups removed: ${totalDupsRemoved}`);
console.log(`Report written to src/data/reseg-results/batch-13.json`);
