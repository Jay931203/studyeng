import fs from 'fs';
import path from 'path';

const TRANSCRIPTS_DIR = 'C:/Users/hyunj/studyeng/public/transcripts';
const OUTPUT_DIR = 'C:/Users/hyunj/studyeng/src/data/reseg-results';

const VIDEO_IDS = [
  'imW392e6XR0','I-oEuBGgTl0','IpwSXWq1wwU','iQE-eKTrUko','iqhTTufTsU4',
  'irUxaJeJRm0','ISBJyhughBo','ISJpKRTkvpc','itcSAT_SX9s','ITGEGE9v0d0',
  'it-jZnbmRzI','IUddr60dDXw','IUjf1lVOGOo','iVwXw7gaEzo','IwREUYN4UtQ',
  'iwS3Q6B7HJo','IxiEeCKIX5E','ixQbCXLUUj8','IXXxciRUMzE','Iz-8CSa9xj8',
  'J_lEs4FYkhs','j2OCBBqfDqo','j4Axr6_RAnw','j5-yKhDd64s','J6gNJ49IKCA',
  'j9QsnPaKnkY','JAEnv1PvBvw','jAgGqQDv32k','JaNckDLiu3I','jane6C4rIwc',
  'JcHICoySTZM','JCMPTvty5nQ','JcP-yeailEM','Jd3r_Id78ck','jDnX_WnPMWM',
  'jDuGCJN3394'
];

// Abbreviations that should NOT be treated as sentence endings
const ABBREVIATIONS = /(?:Dr|Mr|Mrs|Ms|U\.S|St|Jr|Sr|vs|etc|Prof|Gen|Gov|Sgt|Corp|Inc|Ltd|Ave|Blvd|Dept|Est|Fig|Vol|No)\./gi;

// Check if text is music/sound effect notation
function isMusic(text) {
  const t = text.trim();
  return /^\[.*\]$/.test(t) || /^♪/.test(t) || /♪$/.test(t) || /^\(.*\)$/.test(t) ||
    /^🎵/.test(t) || /🎵$/.test(t) || /^\[Music\]$/i.test(t) || /^\[Applause\]$/i.test(t);
}

// Check if text looks like lyrics (heuristic: short, no punctuation at end, possibly repeated)
function isLyrics(text) {
  const t = text.trim();
  return /♪/.test(t) || /🎵/.test(t);
}

// Protect abbreviations by replacing periods with a placeholder
function protectAbbreviations(text) {
  return text.replace(/\b(Dr|Mr|Mrs|Ms|Jr|Sr|vs|etc|Prof|Gen|Gov|Sgt|Corp|Inc|Ltd|Ave|Blvd|Dept|Est|Fig|Vol|No)\./gi, '$1\x00');
}

// Restore abbreviation periods
function restoreAbbreviations(text) {
  return text.replace(/\x00/g, '.');
}

// Protect "U.S." specifically
function protectUS(text) {
  return text.replace(/U\.S\./g, 'U\x00S\x00');
}
function restoreUS(text) {
  return text.replace(/U\x00S\x00/g, 'U.S.');
}

// Count sentences in text (after protecting abbreviations)
function countSentences(text) {
  let t = protectUS(text);
  t = protectAbbreviations(t);
  // Split on sentence-ending punctuation
  const sentences = t.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  return Math.max(1, sentences.length);
}

// Split text into sentences
function splitIntoSentences(text) {
  let t = protectUS(text);
  t = protectAbbreviations(t);

  // Split on sentence-ending punctuation followed by space or end
  const parts = [];
  let current = '';

  for (let i = 0; i < t.length; i++) {
    current += t[i];
    if ((t[i] === '.' || t[i] === '!' || t[i] === '?') &&
        (i === t.length - 1 || t[i+1] === ' ' || t[i+1] === '"' || t[i+1] === "'")) {
      // Check if next char after optional quote+space starts a new sentence (uppercase)
      let lookAhead = i + 1;
      if (lookAhead < t.length && (t[lookAhead] === '"' || t[lookAhead] === "'")) lookAhead++;
      if (lookAhead < t.length && t[lookAhead] === ' ') lookAhead++;

      if (i === t.length - 1 || (lookAhead < t.length && /[A-Z"'(]/.test(t[lookAhead]))) {
        parts.push(restoreUS(restoreAbbreviations(current.trim())));
        current = '';
        // Skip the space
        if (i + 1 < t.length && t[i+1] === ' ') i++;
      }
    }
  }
  if (current.trim()) {
    parts.push(restoreUS(restoreAbbreviations(current.trim())));
  }

  return parts.filter(p => p.length > 0);
}

// Split text at clause boundaries (for long single-sentence segments)
function splitAtClause(text) {
  // Try splitting at comma + space, semicolons, " and ", " but ", " so ", " because ", " when ", " while ", " if ", " that ", " which "
  const clausePatterns = [
    /,\s+(?=\w)/,
    /;\s+/,
    /\s+(?:and|but|so|because|when|while|if|then|or|yet|although|though|since|unless|before|after|until)\s+/i,
  ];

  for (const pattern of clausePatterns) {
    const match = text.match(pattern);
    if (match && match.index) {
      const splitPoint = match.index + (match[0].startsWith(',') || match[0].startsWith(';') ? 1 : 0);
      const part1 = text.substring(0, match.index + (match[0].startsWith(',') || match[0].startsWith(';') ? 1 : 0)).trim();
      const part2 = text.substring(match.index + match[0].length).trim();
      // Only valid split if conjunction included with second part
      if (match[0].startsWith(',') || match[0].startsWith(';')) {
        if (part1.length >= 5 && part2.length >= 5) {
          return [part1, part2];
        }
      } else {
        // Put conjunction word with second part
        const conjMatch = match[0].match(/\s+(and|but|so|because|when|while|if|then|or|yet|although|though|since|unless|before|after|until)\s+/i);
        if (conjMatch) {
          const p1 = text.substring(0, match.index).trim();
          const p2 = text.substring(match.index).trim();
          if (p1.length >= 5 && p2.length >= 5) {
            return [p1, p2];
          }
        }
      }
    }
  }
  return null;
}

// Split Korean text to match English splits
function splitKorean(ko, enParts, originalEn) {
  if (!ko || ko.trim() === '') return enParts.map(() => '');

  // Try splitting Korean at sentence-ending punctuation
  const koSentences = ko.split(/(?<=[.!?])\s*/).filter(s => s.trim().length > 0);

  if (koSentences.length >= enParts.length) {
    // Distribute Korean sentences among English parts
    const result = [];
    const perPart = Math.floor(koSentences.length / enParts.length);
    let idx = 0;
    for (let i = 0; i < enParts.length; i++) {
      const count = (i < enParts.length - 1) ? perPart : koSentences.length - idx;
      result.push(koSentences.slice(idx, idx + count).join(' '));
      idx += count;
    }
    return result;
  }

  // If we can't split Korean well, put full Korean on first part, "" on rest
  const result = [ko];
  for (let i = 1; i < enParts.length; i++) {
    result.push('');
  }
  return result;
}

// Proportionally allocate time based on character lengths
function allocateTime(start, end, parts) {
  const totalChars = parts.reduce((sum, p) => sum + p.length, 0);
  const totalDuration = end - start;

  const result = [];
  let currentStart = start;

  for (let i = 0; i < parts.length; i++) {
    const proportion = parts[i].length / totalChars;
    const duration = totalDuration * proportion;
    const segEnd = (i === parts.length - 1) ? end : currentStart + duration;
    result.push({
      start: Math.round(currentStart * 100) / 100,
      end: Math.round(segEnd * 100) / 100
    });
    currentStart = segEnd;
  }

  return result;
}

// Word count
function wordCount(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function processFile(videoId) {
  const filePath = path.join(TRANSCRIPTS_DIR, `${videoId}.json`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const segments = JSON.parse(raw);

  const segsBefore = segments.length;
  let splits = 0;
  let merges = 0;
  let dupsRemoved = 0;

  let result = [];

  // === PASS 1: Split long multi-sentence segments ===
  for (const seg of segments) {
    const duration = seg.end - seg.start;
    const en = (seg.en || '').trim();
    const ko = (seg.ko || '').trim();

    // Rule H: Skip music/sound effect markers
    if (isMusic(en)) {
      result.push(seg);
      continue;
    }

    // Rule I: Keep lyrics as-is
    if (isLyrics(en)) {
      result.push(seg);
      continue;
    }

    const sentCount = countSentences(en);

    // Rule A: Multi-sentence (>1 sentence) and duration > 3s -> split
    if (sentCount > 1 && duration > 3) {
      const enParts = splitIntoSentences(en);
      if (enParts.length > 1) {
        const koParts = splitKorean(ko, enParts, en);
        const times = allocateTime(seg.start, seg.end, enParts);

        // Verify each part gets >= reasonable duration
        let validSplit = true;
        for (const t of times) {
          if (t.end - t.start < 0.5) {
            validSplit = false;
            break;
          }
        }

        if (validSplit) {
          for (let i = 0; i < enParts.length; i++) {
            result.push({
              start: times[i].start,
              end: times[i].end,
              en: enParts[i],
              ko: koParts[i] || ''
            });
          }
          splits += enParts.length - 1;
          continue;
        }
      }
    }

    // Rule C: Single sentence > 8s -> try clause split, each part >= 3s
    if (sentCount === 1 && duration > 8) {
      const clauseParts = splitAtClause(en);
      if (clauseParts) {
        const times = allocateTime(seg.start, seg.end, clauseParts);
        let validSplit = true;
        for (const t of times) {
          if (t.end - t.start < 3) {
            validSplit = false;
            break;
          }
        }
        if (validSplit) {
          const koParts = splitKorean(ko, clauseParts, en);
          for (let i = 0; i < clauseParts.length; i++) {
            result.push({
              start: times[i].start,
              end: times[i].end,
              en: clauseParts[i],
              ko: koParts[i] || ''
            });
          }
          splits += clauseParts.length - 1;
          continue;
        }
      }
    }

    // Rule D: 5-8s single sentence with >= 6s -> try clause split if possible
    if (sentCount === 1 && duration >= 6 && duration <= 8) {
      const clauseParts = splitAtClause(en);
      if (clauseParts) {
        const times = allocateTime(seg.start, seg.end, clauseParts);
        let validSplit = true;
        for (const t of times) {
          if (t.end - t.start < 2.5) {
            validSplit = false;
            break;
          }
        }
        if (validSplit) {
          const koParts = splitKorean(ko, clauseParts, en);
          for (let i = 0; i < clauseParts.length; i++) {
            result.push({
              start: times[i].start,
              end: times[i].end,
              en: clauseParts[i],
              ko: koParts[i] || ''
            });
          }
          splits += clauseParts.length - 1;
          continue;
        }
      }
    }

    // Rule B: <= 3s -> keep as is
    // Rule E/F: < 5s -> no split
    result.push(seg);
  }

  // === PASS 2: Merge tiny segments (Rule G: <=2 words, <1.5s -> merge with previous) ===
  let merged = [];
  for (let i = 0; i < result.length; i++) {
    const seg = result[i];
    const duration = seg.end - seg.start;
    const wc = wordCount(seg.en || '');

    if (wc <= 2 && duration < 1.5 && merged.length > 0 && !isMusic(seg.en)) {
      // Merge with previous
      const prev = merged[merged.length - 1];
      prev.end = seg.end;
      prev.en = (prev.en + ' ' + seg.en).trim();
      prev.ko = (prev.ko + ' ' + (seg.ko || '')).trim();
      merges++;
    } else {
      merged.push({ ...seg });
    }
  }

  // === PASS 3: Remove consecutive duplicate segments ===
  let deduped = [];
  for (let i = 0; i < merged.length; i++) {
    if (i > 0 && merged[i].en === merged[i-1].en && merged[i].en.trim() !== '') {
      dupsRemoved++;
      // Keep the one with longer duration
      if ((merged[i].end - merged[i].start) > (deduped[deduped.length-1].end - deduped[deduped.length-1].start)) {
        deduped[deduped.length - 1] = merged[i];
      }
      continue;
    }
    deduped.push(merged[i]);
  }

  const segsAfter = deduped.length;
  const changed = splits > 0 || merges > 0 || dupsRemoved > 0;

  // Round all times to 2 decimals
  for (const seg of deduped) {
    seg.start = Math.round(seg.start * 100) / 100;
    seg.end = Math.round(seg.end * 100) / 100;
  }

  // Write back if changed
  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(deduped, null, 2), 'utf-8');
  }

  return { splits, merges, dupsRemoved, segsBefore, segsAfter, changed };
}

// Main
const report = {
  batch: '22',
  filesProcessed: VIDEO_IDS.length,
  filesChanged: 0,
  totalSplits: 0,
  totalMerges: 0,
  totalDupsRemoved: 0,
  details: {}
};

for (const videoId of VIDEO_IDS) {
  console.log(`Processing ${videoId}...`);
  try {
    const result = processFile(videoId);
    report.totalSplits += result.splits;
    report.totalMerges += result.merges;
    report.totalDupsRemoved += result.dupsRemoved;

    if (result.changed) {
      report.filesChanged++;
      report.details[videoId] = {
        splits: result.splits,
        merges: result.merges,
        dupsRemoved: result.dupsRemoved,
        segsBefore: result.segsBefore,
        segsAfter: result.segsAfter
      };
    }

    console.log(`  -> splits=${result.splits} merges=${result.merges} dups=${result.dupsRemoved} before=${result.segsBefore} after=${result.segsAfter}`);
  } catch (e) {
    console.error(`  ERROR: ${e.message}`);
  }
}

// Write report
fs.writeFileSync(path.join(OUTPUT_DIR, 'batch-22.json'), JSON.stringify(report, null, 2), 'utf-8');
console.log(`\nDone! Changed ${report.filesChanged}/${report.filesProcessed} files.`);
console.log(`Total: ${report.totalSplits} splits, ${report.totalMerges} merges, ${report.totalDupsRemoved} dups removed`);
