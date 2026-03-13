import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const TRANSCRIPTS = join(ROOT, 'public', 'transcripts');
const RESULTS_DIR = join(ROOT, 'src', 'data', 'reseg-results');

const VIDEO_IDS = [
  'bp6hhq8DdgU', 'BPCjC543llU', 'bqsZzZ4kXbg', 'br-Dy3puDoc', '-BskysMshyI',
  'bSMxl1V8FSg', 'bt3X8MJgJWo', 'bTeYncx1xmI', 'BTff04cFsRw', 'BTivsHlVcGU',
  'BtK_y1n2ERk', 'BtN-goy9VOY', 'bV0RAcuG2Ao', 'bvjZSqRu41k', 'bx7l7X7qy2g',
  'bYOn3-PhA9c', 'bYXhA8VG8Lw', 'bzE-IMaegzQ', 'BzIHyF7UWY4', 'c0KYU2j0TM4',
  'C2vVmag1HRY', 'C3DlM19x4RQ', 'C6MFJwuTZII', '-c7kOHThKHY', 'cBd6B_xwQPE',
  'CbjxifMCNeg', 'cdVN4ZiJUTE', 'cdWHFPDUcSk', 'Ce_BXD_ONQ8', 'CECCNFXmv5c',
  'CevxZvSJLk8', 'Cf1hKtrA9lg', 'Cf2Gec_2fMY', 'cg1rtWXHSKU', 'cg2MY3F2iAk',
  'cgbz2VHWrpE'
];

// Abbreviation patterns that should NOT be treated as sentence boundaries
const ABBREV_RE = /\b(?:Dr|Mr|Mrs|Ms|U\.S|St|Jr|Sr|Prof|etc|vs|Inc|Ltd|Corp|Vol|No|Fig)\./g;

function maskAbbreviations(en) {
  return en.replace(ABBREV_RE, m => m.replace(/\./g, '\u0000'));
}

function unmaskAbbreviations(en) {
  return en.replace(/\u0000/g, '.');
}

// Detect multi-sentence: [.?!] (optional quote) followed by space and capital letter
function isMultiSentence(en) {
  const cleaned = maskAbbreviations(en);
  return /[.?!]["']?\s+[A-Z]/.test(cleaned);
}

// Split text into sentences at sentence boundaries
function splitSentences(en) {
  const cleaned = maskAbbreviations(en);
  const parts = cleaned.split(/(?<=[.?!]["']?)\s+(?=[A-Z])/);
  return parts.map(p => unmaskAbbreviations(p));
}

// Check for clause boundary with conjunction
function hasClauseBoundary(en) {
  return /, (?:and|but|because|which|so|or|when|if|although|where|while|though|since|before|after|as|that|yet|however|then)\b/i.test(en);
}

// Split at first clause boundary
function splitAtClause(en) {
  const match = en.match(/(.*?, )(and|but|because|which|so|or|when|if|although|where|while|though|since|before|after|as|that|yet|however|then)\b(.*)/i);
  if (match) {
    return [match[1].trim(), match[2] + match[3]];
  }
  return null;
}

// Check if segment is music/effects
function isMusicOrEffect(en) {
  const stripped = en.trim();
  if (/^[♪\s]+$/.test(stripped)) return true;
  if (/^\[music\]$/i.test(stripped)) return true;
  if (/^♪.*♪$/.test(stripped) && stripped.length < 10) return true;
  return false;
}

// Check if segment is a song lyric (contains ♪)
function isSongLyric(en) {
  return en.includes('♪');
}

// Check if segment is a tiny fragment
function isFragment(seg) {
  const wordCount = seg.en.trim().split(/\s+/).length;
  const duration = seg.end - seg.start;
  return wordCount <= 2 && duration < 1.5;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Split Korean text to match N parts
function splitKorean(ko, numParts) {
  if (numParts === 1) return [ko];

  // Try splitting at Korean sentence boundaries (. ? !)
  const koSentences = ko.split(/(?<=[.?!])\s+/).filter(s => s.trim());
  if (koSentences.length === numParts) {
    return koSentences;
  }

  // Try splitting at Korean sentence boundaries without requiring whitespace
  const koSentences2 = ko.split(/(?<=[.?!])/).filter(s => s.trim());
  if (koSentences2.length === numParts) {
    return koSentences2.map(s => s.trim());
  }

  // If more Korean sentences than needed, group them
  if (koSentences2.length > numParts) {
    const result = [];
    const perGroup = Math.ceil(koSentences2.length / numParts);
    for (let i = 0; i < numParts; i++) {
      const start = i * perGroup;
      const end = Math.min(start + perGroup, koSentences2.length);
      if (start < koSentences2.length) {
        result.push(koSentences2.slice(start, end).join(' ').trim());
      } else {
        result.push('');
      }
    }
    return result;
  }

  // Fallback: full ko in first, empty for rest
  const result = [ko];
  for (let i = 1; i < numParts; i++) result.push('');
  return result;
}

// Proportionally split a segment into parts based on character count
function splitSegment(seg, enParts) {
  const totalChars = enParts.reduce((s, p) => s + p.length, 0);
  if (totalChars === 0) return [seg];

  const duration = seg.end - seg.start;
  const koParts = splitKorean(seg.ko, enParts.length);
  const result = [];
  let currentStart = seg.start;

  for (let i = 0; i < enParts.length; i++) {
    const ratio = enParts[i].length / totalChars;
    const partDuration = duration * ratio;
    const partEnd = i === enParts.length - 1 ? seg.end : round2(currentStart + partDuration);

    result.push({
      start: round2(currentStart),
      end: partEnd,
      en: enParts[i].trim(),
      ko: koParts[i] || ''
    });
    currentStart = partEnd;
  }

  return result;
}

// Merge short sentences together so each resulting part >= 1.5s of estimated duration
function mergeShortSentences(sentences, totalDuration) {
  const totalChars = sentences.reduce((s, p) => s + p.length, 0);
  if (totalChars === 0) return sentences;

  const merged = [];
  let buffer = '';

  for (let i = 0; i < sentences.length; i++) {
    if (buffer) {
      buffer += ' ' + sentences[i];
    } else {
      buffer = sentences[i];
    }

    const bufRatio = buffer.length / totalChars;
    const bufDuration = totalDuration * bufRatio;

    // Flush if duration >= 1.5s, or if it's the last sentence
    if (bufDuration >= 1.5 || i === sentences.length - 1) {
      merged.push(buffer);
      buffer = '';
    }
  }

  return merged;
}

function processFile(videoId) {
  const filePath = join(TRANSCRIPTS, `${videoId}.json`);
  const segs = JSON.parse(readFileSync(filePath, 'utf-8'));
  const segsBefore = segs.length;
  let splits = 0;
  let merges = 0;
  let dupsRemoved = 0;

  // Step 1: Remove consecutive duplicate en segments
  let deduped = [];
  for (let i = 0; i < segs.length; i++) {
    if (i > 0 && segs[i].en.trim() === segs[i - 1].en.trim()) {
      dupsRemoved++;
      continue;
    }
    deduped.push({ ...segs[i] });
  }

  // Step 2: Split segments according to rules
  let processed = [];
  for (const seg of deduped) {
    const en = seg.en.trim();
    const duration = round2(seg.end - seg.start);

    // Case H: Music/effects -> SKIP
    if (isMusicOrEffect(en)) {
      processed.push(seg);
      continue;
    }

    // Case I: Song lyrics -> keep as verse lines
    if (isSongLyric(en)) {
      processed.push(seg);
      continue;
    }

    const multi = isMultiSentence(en);

    // Case A: Multi-sentence, duration > 3s -> SPLIT per sentence
    if (multi && duration > 3) {
      const rawSentences = splitSentences(en);
      if (rawSentences.length > 1) {
        // Merge consecutive short sentences so each part >= 1.5s
        const merged = mergeShortSentences(rawSentences, duration);
        if (merged.length > 1) {
          const splitSegs = splitSegment(seg, merged);
          processed.push(...splitSegs);
          splits += merged.length - 1;
          continue;
        }
      }
    }

    // Case B: Multi-sentence ≤ 3s -> KEEP (already handled by condition above)

    // Case C: Single sentence > 8s -> split at clause boundary if each part >= 3s
    if (!multi && duration > 8 && hasClauseBoundary(en)) {
      const parts = splitAtClause(en);
      if (parts) {
        const totalChars = parts[0].length + parts[1].length;
        const d1 = duration * (parts[0].length / totalChars);
        const d2 = duration * (parts[1].length / totalChars);
        if (d1 >= 3 && d2 >= 3) {
          const splitSegs = splitSegment(seg, parts);
          processed.push(...splitSegs);
          splits++;
          continue;
        }
      }
    }

    // Case D: Single sentence 5-8s -> split only if >= 6s AND clear clause boundary, each part >= 3s
    if (!multi && duration >= 6 && duration <= 8 && hasClauseBoundary(en)) {
      const parts = splitAtClause(en);
      if (parts) {
        const totalChars = parts[0].length + parts[1].length;
        const d1 = duration * (parts[0].length / totalChars);
        const d2 = duration * (parts[1].length / totalChars);
        if (d1 >= 3 && d2 >= 3) {
          const splitSegs = splitSegment(seg, parts);
          processed.push(...splitSegs);
          splits++;
          continue;
        }
      }
    }

    // Case E/F: single < 5s -> no change (default)
    processed.push(seg);
  }

  // Step 3: Merge fragments (Case G)
  let finalResult = [];
  for (let i = 0; i < processed.length; i++) {
    const seg = processed[i];

    // Skip music/effect segments for merge logic
    if (isMusicOrEffect(seg.en)) {
      finalResult.push(seg);
      continue;
    }

    if (isFragment(seg)) {
      // Try merge with previous if prev doesn't end with sentence-ending punctuation
      if (finalResult.length > 0) {
        const prev = finalResult[finalResult.length - 1];
        if (!isMusicOrEffect(prev.en) && !/[.?!]$/.test(prev.en.trim())) {
          prev.end = seg.end;
          prev.en = prev.en.trim() + ' ' + seg.en.trim();
          prev.ko = (prev.ko.trim() + ' ' + seg.ko.trim()).trim();
          merges++;
          continue;
        }
      }
      // Else merge with next
      if (i + 1 < processed.length && !isMusicOrEffect(processed[i + 1].en)) {
        const next = processed[i + 1];
        next.start = seg.start;
        next.en = seg.en.trim() + ' ' + next.en.trim();
        next.ko = (seg.ko.trim() + ' ' + next.ko.trim()).trim();
        merges++;
        continue;
      }
    }

    finalResult.push(seg);
  }

  const changed = splits > 0 || merges > 0 || dupsRemoved > 0;
  if (changed) {
    writeFileSync(filePath, JSON.stringify(finalResult, null, 2) + '\n');
  }

  return {
    changed,
    splits,
    merges,
    dupsRemoved,
    segsBefore,
    segsAfter: finalResult.length
  };
}

// Main execution
if (!existsSync(RESULTS_DIR)) {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

let totalSplits = 0;
let totalMerges = 0;
let totalDupsRemoved = 0;
let filesChanged = 0;
const details = {};

for (const id of VIDEO_IDS) {
  console.log(`Processing ${id}...`);
  try {
    const result = processFile(id);
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
      console.log(`  -> ${result.splits} splits, ${result.merges} merges, ${result.dupsRemoved} dups removed (${result.segsBefore} -> ${result.segsAfter})`);
    } else {
      console.log(`  -> no changes`);
    }
  } catch (e) {
    console.error(`  ERROR: ${e.message}`);
  }
}

const report = {
  batch: '11',
  filesProcessed: VIDEO_IDS.length,
  filesChanged,
  totalSplits,
  totalMerges,
  totalDupsRemoved,
  details
};

writeFileSync(join(RESULTS_DIR, 'batch-11.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`\nBatch 11 complete: ${filesChanged} files changed, ${totalSplits} splits, ${totalMerges} merges, ${totalDupsRemoved} dups removed`);
