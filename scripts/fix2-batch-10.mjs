import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TRANSCRIPTS_DIR = join(process.cwd(), 'public', 'transcripts');
const OUTPUT_FILE = join(process.cwd(), 'src', 'data', 'reseg-results', 'fix2-batch-10.json');

const FILE_IDS = [
  'ISJpKRTkvpc','it-jZnbmRzI','ITGEGE9v0d0','IUddr60dDXw','IUjf1lVOGOo',
  'iVwXw7gaEzo','IxiEeCKIX5E','ixQbCXLUUj8','j2OCBBqfDqo','j4Axr6_RAnw',
  'J6gNJ49IKCA','j9QsnPaKnkY','JAEnv1PvBvw','JaNckDLiu3I','JcHICoySTZM',
  'JCMPTvty5nQ','JcP-yeailEM','Jd3r_Id78ck','jDnX_WnPMWM','JexO-N39Nzg',
  'jH6JcaCClrE','jHPOzQzk9Qo','jjYXNonafzo','JNctAdr7jy4','jpj7rqTgy1k',
  'jQoNILVFFvs','JQVBfcjx6d4','Jr7bRw0NxQ4','jsZkkqLDFmg','JWtnJjn6ng0',
  'jyAp2Q_mUvE','J_lEs4FYkhs','k5DGopYRik0','k5fJmkv02is','k61kx5L6ZNM',
  'k70xBg8en-4','kb60HrggbeQ','Kb_AHBGF5i8','kCobcQr3TKQ','kD3-DKkiVeA'
];

// Detect sentence boundaries: [.!?] + space + uppercase
function findSentenceBoundaries(text) {
  const boundaries = [];

  // Collect abbreviation positions to exclude
  const abbrPositions = [];
  let m;
  const abbrRegex = /\b(?:Dr|Mr|Mrs|Ms|St|Jr|Sr)\.\s/g;
  while ((m = abbrRegex.exec(text)) !== null) {
    abbrPositions.push({ start: m.index, end: m.index + m[0].length });
  }
  // Handle U.S., P.G. style abbreviations
  const initialRegex = /\b[A-Z]\.[A-Z]\.\s/g;
  while ((m = initialRegex.exec(text)) !== null) {
    abbrPositions.push({ start: m.index, end: m.index + m[0].length });
  }

  const boundaryRegex = /[.!?]\s+[A-Z]/g;
  while ((m = boundaryRegex.exec(text)) !== null) {
    const inAbbrev = abbrPositions.some(a => m.index >= a.start && m.index < a.end);
    if (!inAbbrev) {
      const afterPunc = text.substring(m.index + 1);
      const spaceMatch = afterPunc.match(/^\s+/);
      const splitPos = m.index + 1 + (spaceMatch ? spaceMatch[0].length : 0);
      boundaries.push(splitPos);
    }
  }
  return boundaries;
}

function splitIntoSentences(text) {
  const boundaries = findSentenceBoundaries(text);
  if (boundaries.length === 0) return [text];
  const sentences = [];
  let lastPos = 0;
  for (const pos of boundaries) {
    const s = text.substring(lastPos, pos).trim();
    if (s) sentences.push(s);
    lastPos = pos;
  }
  const last = text.substring(lastPos).trim();
  if (last) sentences.push(last);
  return sentences;
}

function splitKorean(ko, enParts) {
  if (!ko || enParts.length <= 1) return [ko];

  // Try splitting Korean by sentence-ending punctuation
  const koSplitPositions = [];
  const koRegex = /[.!?]\s+/g;
  let km;
  while ((km = koRegex.exec(ko)) !== null) {
    koSplitPositions.push(km.index + km[0].length);
  }

  if (koSplitPositions.length >= enParts.length - 1) {
    const positions = koSplitPositions.slice(0, enParts.length - 1);
    const parts = [];
    let lastPos = 0;
    for (const pos of positions) {
      parts.push(ko.substring(lastPos, pos).trim());
      lastPos = pos;
    }
    parts.push(ko.substring(lastPos).trim());
    return parts;
  }

  // Fallback: full ko in first, "" for rest
  const result = [ko];
  for (let i = 1; i < enParts.length; i++) {
    result.push('');
  }
  return result;
}

/**
 * Group sentences so each group >= 1.5s
 * RULE: NEVER leave 3+ sentences in one group if grouping into >=1.5s parts is possible
 * For 2 sentences: always split (total >3s guarantees each part >= 1.0s after min enforcement)
 */
function groupSentences(sentences, totalDuration) {
  if (sentences.length <= 1) return [[0]];

  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
  const durations = sentences.map(s => Math.max((s.length / totalChars) * totalDuration, 0.1));

  // For exactly 2 sentences: ALWAYS split them
  // The min 1.0s enforcement in timing will handle short parts
  if (sentences.length === 2) {
    return [[0], [1]];
  }

  // For 3+ sentences: we MUST produce at least 2 groups
  // Strategy: greedily build groups of >= 1.5s duration
  // Each group can have 1-2 sentences. Never 3+ unless unavoidable.

  // First try: each sentence individually (if all >= 1.5s)
  if (durations.every(d => d >= 1.5)) {
    return sentences.map((_, i) => [i]);
  }

  // Build groups: pair short sentences with the next one
  const groups = [];
  let i = 0;
  while (i < sentences.length) {
    if (durations[i] >= 1.5) {
      groups.push([i]);
      i++;
    } else {
      // This sentence is short, pair with next
      if (i + 1 < sentences.length) {
        const pairDur = durations[i] + durations[i + 1];
        if (pairDur >= 1.5 || i + 1 === sentences.length - 1) {
          groups.push([i, i + 1]);
          i += 2;
        } else {
          // Even pair is short, try triple
          if (i + 2 < sentences.length) {
            groups.push([i, i + 1, i + 2]);
            i += 3;
          } else {
            groups.push([i, i + 1]);
            i += 2;
          }
        }
      } else {
        // Last sentence, merge with previous group
        if (groups.length > 0) {
          groups[groups.length - 1].push(i);
        } else {
          groups.push([i]);
        }
        i++;
      }
    }
  }

  // If we only got 1 group, try harder to split
  if (groups.length === 1 && sentences.length >= 2) {
    // Force split: first half and second half
    const mid = Math.ceil(sentences.length / 2);
    return [
      Array.from({ length: mid }, (_, i) => i),
      Array.from({ length: sentences.length - mid }, (_, i) => i + mid)
    ];
  }

  // Check no group has 3+ sentences if we can split further
  const refined = [];
  for (const group of groups) {
    if (group.length >= 3) {
      const groupDur = group.reduce((sum, idx) => sum + durations[idx], 0);
      if (groupDur >= 3.0) {
        // Split at midpoint
        const mid = Math.ceil(group.length / 2);
        refined.push(group.slice(0, mid));
        refined.push(group.slice(mid));
      } else {
        refined.push(group);
      }
    } else {
      refined.push(group);
    }
  }

  return refined;
}

function isMusic(text) {
  return text.includes('♪') || text.includes('[music]') || text.includes('[Music]');
}

// Check if text is predominantly exclamations/interjections that shouldn't be split
function isExclamationSpam(text) {
  // Count words that are just short exclamations
  const words = text.split(/\s+/);
  const exclamations = words.filter(w => /^(Ah|Oh|Uh|Eh|Hmm|Aah|Ooh|Ha|Hah|No|Hey|Wow|Whoa)[!.,]?$/i.test(w));
  return exclamations.length / words.length > 0.6;
}

function processSegment(seg) {
  const duration = seg.end - seg.start;

  // Skip: <= 3s, music, exclamation spam
  if (duration <= 3) return [seg];
  if (isMusic(seg.en)) return [seg];
  if (isExclamationSpam(seg.en)) return [seg];

  const sentences = splitIntoSentences(seg.en);
  if (sentences.length < 2) return [seg];

  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);

  // Group sentences
  const groups = groupSentences(sentences, duration);

  // If only one group, no split
  if (groups.length <= 1) return [seg];

  // Build group texts
  const groupTexts = groups.map(g => g.map(i => sentences[i]).join(' '));

  // Split Korean
  const koTexts = splitKorean(seg.ko, groupTexts);

  // Calculate timing proportionally by char count
  const groupCharCounts = groups.map(g => g.reduce((sum, i) => sum + sentences[i].length, 0));
  const totalGroupChars = groupCharCounts.reduce((a, b) => a + b, 0);

  const result = [];
  let currentStart = seg.start;

  for (let i = 0; i < groups.length; i++) {
    let end;
    if (i === groups.length - 1) {
      end = seg.end;
    } else {
      let dur = (groupCharCounts[i] / totalGroupChars) * duration;
      dur = Math.max(dur, 1.0); // min 1.0s
      end = Math.round((currentStart + dur) * 10) / 10;
      if (end >= seg.end) {
        end = Math.round((seg.end - 1.0) * 10) / 10;
      }
    }

    result.push({
      start: Math.round(currentStart * 10) / 10,
      end: end,
      en: groupTexts[i],
      ko: koTexts[i] !== undefined ? koTexts[i] : ''
    });

    currentStart = end;
  }

  // Enforce min 1.0s for each segment
  for (let i = 0; i < result.length - 1; i++) {
    const d = result[i].end - result[i].start;
    if (d < 1.0) {
      result[i].end = Math.round((result[i].start + 1.0) * 10) / 10;
      if (i + 1 < result.length) {
        result[i + 1].start = result[i].end;
      }
    }
  }
  // Check last segment
  const lastIdx = result.length - 1;
  const lastDur = result[lastIdx].end - result[lastIdx].start;
  if (lastDur < 1.0 && result.length > 1) {
    result[lastIdx].start = Math.round((result[lastIdx].end - 1.0) * 10) / 10;
    result[lastIdx - 1].end = result[lastIdx].start;
  }

  // Final validation: all starts < ends, no negative durations
  for (let i = 0; i < result.length; i++) {
    if (result[i].start >= result[i].end) return [seg]; // bail
    if (i > 0 && result[i].start < result[i - 1].end) return [seg]; // bail
  }

  return result;
}

function processFile(fileId) {
  const filePath = join(TRANSCRIPTS_DIR, `${fileId}.json`);
  if (!existsSync(filePath)) {
    console.log(`  SKIP: ${fileId} - file not found`);
    return { skipped: true };
  }

  let data = JSON.parse(readFileSync(filePath, 'utf-8'));
  const segsBefore = data.length;
  let totalSplitsForFile = 0;

  // Iterative: keep splitting until no more changes (handles recursive splits)
  for (let pass = 0; pass < 5; pass++) {
    let splits = 0;
    const newData = [];

    for (const seg of data) {
      const result = processSegment(seg);
      if (result.length > 1) {
        splits += result.length - 1;
      }
      newData.push(...result);
    }

    totalSplitsForFile += splits;
    data = newData;

    if (splits === 0) break; // no more changes needed
  }

  if (totalSplitsForFile > 0) {
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`  ${fileId}: ${totalSplitsForFile} splits (${segsBefore} -> ${data.length})`);
  } else {
    console.log(`  ${fileId}: no changes needed`);
  }

  return {
    splits: totalSplitsForFile,
    segsBefore,
    segsAfter: data.length
  };
}

// Main
console.log(`Processing ${FILE_IDS.length} files...`);
const details = {};
let totalSplits = 0;
let filesChanged = 0;

for (const fileId of FILE_IDS) {
  const result = processFile(fileId);
  if (!result.skipped) {
    details[fileId] = {
      splits: result.splits,
      segsBefore: result.segsBefore,
      segsAfter: result.segsAfter
    };
    totalSplits += result.splits;
    if (result.splits > 0) filesChanged++;
  }
}

const report = {
  batch: '10',
  filesProcessed: FILE_IDS.length,
  filesChanged,
  totalSplits,
  details
};

writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
console.log(`\nDone. Total splits: ${totalSplits}, Files changed: ${filesChanged}/${FILE_IDS.length}`);
console.log(`Report: ${OUTPUT_FILE}`);
