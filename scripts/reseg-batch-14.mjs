import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const TRANSCRIPTS_DIR = join(process.cwd(), 'public', 'transcripts');
const RESULTS_DIR = join(process.cwd(), 'src', 'data', 'reseg-results');

const VIDEO_IDS = [
  'dOkyKyVFnSs', 'DOmIpiTMs2w', '-doMNIdooe8', 'donJlg14_LY', 'dOxiSsBTHbk',
  'dqONk48l5vY', 'dqT-UlYlg1s', 'dQw4w9WgXcQ', 'Ds0R1eApo9w', 'DsNvk7heXgI',
  'DtRhrfhP5b4', 'DU000lCfmBs', 'DUzEYcR2VtM', 'DvkYRhu-TP0', 'dVmOvmH4dL4',
  'DVrFuGJ2QjQ', 'DvtxOzO6OAE', 'DVWyxC64FcA', 'DW4Q9bdE_BY', 'DwAOHVBKTwg',
  'Dwiczhta4e0', 'Dwnl43ASLBA', 'Dx06c0ZEBMk', 'dx5jTXNnCZw', 'dx7vNdAb5e4',
  'DyDfgMOUjCI', 'E_z2PGmUIrE', 'E1I0hAxGFXw', 'e1KEC_3vygc', 'E1xEVZ99_S0',
  'e2wm_VRROvA', 'e2zyjbH9zzA', 'e3-5YC_oHjE', 'E3RQVcNUcTA', 'e5BFR-E-ae0',
  '-e5CtbbZL-k'
];

// Abbreviations that should NOT be treated as sentence boundaries
const ABBREVIATIONS = /(?:Dr|Mr|Mrs|Ms|U\.S|St|Jr|Sr|Prof|Rev|Gen|Gov|Sgt|Cpl|Pvt|Lt|Capt|Maj|Col|etc|vs|Vol|Inc|Corp|Ltd|i\.e|e\.g)\./gi;

function isMultiSentence(en) {
  // Replace abbreviations with placeholders to avoid false positives
  let cleaned = en.replace(ABBREVIATIONS, 'ABBR_PLACEHOLDER');
  // Check for sentence boundary: [.?!] + space + capital letter
  return /[.?!]\s+[A-Z]/.test(cleaned);
}

function splitSentences(en) {
  // Split at sentence boundaries ([.?!] followed by space and capital letter)
  // But protect abbreviations
  const abbrs = [];
  let temp = en.replace(/(?:Dr|Mr|Mrs|Ms|U\.S|St|Jr|Sr|Prof|Rev|Gen|Gov|Sgt|Cpl|Pvt|Lt|Capt|Maj|Col|etc|vs|Vol|Inc|Corp|Ltd)\./gi, (m) => {
    abbrs.push(m);
    return `__ABBR${abbrs.length - 1}__`;
  });
  // Also protect "i.e." and "e.g."
  temp = temp.replace(/(?:i\.e|e\.g)\./gi, (m) => {
    abbrs.push(m);
    return `__ABBR${abbrs.length - 1}__`;
  });

  // Split at sentence boundaries
  const parts = [];
  let remaining = temp;
  const regex = /([.?!])\s+(?=[A-Z])/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(remaining)) !== null) {
    const end = match.index + match[1].length;
    parts.push(remaining.substring(lastIndex, end));
    lastIndex = end + match[0].length - match[1].length;
  }
  if (lastIndex < remaining.length) {
    parts.push(remaining.substring(lastIndex));
  }

  // Restore abbreviations
  return parts.map(p => {
    let restored = p;
    for (let i = 0; i < abbrs.length; i++) {
      restored = restored.replace(`__ABBR${i}__`, abbrs[i]);
    }
    return restored.trim();
  }).filter(p => p.length > 0);
}

function splitKorean(ko, enParts) {
  if (!ko || enParts.length <= 1) return enParts.map(() => ko || '');

  // Try splitting Korean at sentence-ending punctuation
  const koParts = ko.split(/(?<=[.?!])\s+/).filter(p => p.trim().length > 0);

  if (koParts.length === enParts.length) {
    return koParts.map(p => p.trim());
  }

  // If counts don't match, put full ko in first segment, "" for rest
  return enParts.map((_, i) => i === 0 ? ko : '');
}

function splitAtClause(en) {
  // Split at clause boundaries: ", and/but/because/which/so/or/when/if/although"
  const clauseRegex = /,\s+(?:and|but|because|which|so|or|when|if|although|while|since|though|where|that|as|yet|nor)\s+/i;
  const match = clauseRegex.exec(en);
  if (!match) return null;

  const splitPoint = match.index + 1; // include the comma in first part
  const part1 = en.substring(0, splitPoint).trim();
  const part2 = en.substring(match.index + match[0].length).trim();
  // Capitalize second part if not already
  const part2Cap = part2.charAt(0).toUpperCase() + part2.slice(1);

  return [part1, part2Cap];
}

function splitKoreanForClause(ko, enParts) {
  if (!ko || enParts.length <= 1) return [ko || ''];
  // Try splitting at Korean comma or period
  const koParts = ko.split(/,\s+|(?<=[.?!])\s+/).filter(p => p.trim().length > 0);
  if (koParts.length >= enParts.length) {
    // distribute
    const result = [];
    const perPart = Math.floor(koParts.length / enParts.length);
    let idx = 0;
    for (let i = 0; i < enParts.length; i++) {
      const count = (i === enParts.length - 1) ? koParts.length - idx : perPart;
      result.push(koParts.slice(idx, idx + count).join(', '));
      idx += count;
    }
    return result;
  }
  return enParts.map((_, i) => i === 0 ? ko : '');
}

function proportionalTime(start, end, parts) {
  const totalLen = parts.reduce((sum, p) => sum + p.length, 0);
  const duration = end - start;
  const result = [];
  let currentStart = start;

  for (let i = 0; i < parts.length; i++) {
    const ratio = parts[i].length / totalLen;
    const segDuration = duration * ratio;
    const segEnd = (i === parts.length - 1) ? end : currentStart + segDuration;
    result.push({
      start: Math.round(currentStart * 100) / 100,
      end: Math.round(segEnd * 100) / 100
    });
    currentStart = segEnd;
  }
  return result;
}

function isMusicOrEffect(en) {
  if (!en) return true;
  const trimmed = en.trim();
  if (trimmed.includes('♪') || trimmed.includes('♫')) return true;
  if (/^\[.*\]$/.test(trimmed)) return true;
  if (/^\(.*\)$/.test(trimmed)) return true;
  if (/^\[music\]$/i.test(trimmed)) return true;
  return false;
}

function isFragment(seg) {
  const words = seg.en.trim().split(/\s+/).length;
  const duration = seg.end - seg.start;
  return words <= 2 && duration < 1.5;
}

function processTranscript(segments) {
  let splits = 0;
  let merges = 0;
  let dupsRemoved = 0;

  // Step 1: Remove consecutive duplicates
  let deduped = [];
  for (let i = 0; i < segments.length; i++) {
    if (i > 0 && segments[i].en === segments[i - 1].en) {
      // Extend previous segment's end time
      deduped[deduped.length - 1].end = segments[i].end;
      dupsRemoved++;
    } else {
      deduped.push({ ...segments[i] });
    }
  }

  // Step 2: Split multi-sentence and long segments
  let processed = [];
  for (const seg of deduped) {
    if (isMusicOrEffect(seg.en)) {
      processed.push(seg);
      continue;
    }

    const duration = seg.end - seg.start;
    const multiSent = isMultiSentence(seg.en);

    if (multiSent && duration > 3) {
      // Case A: Multi-sentence, duration > 3s → SPLIT
      const enParts = splitSentences(seg.en);
      if (enParts.length > 1) {
        const times = proportionalTime(seg.start, seg.end, enParts);
        const koParts = splitKorean(seg.ko, enParts);

        // Check minimum duration (1.5s) - merge short ones
        const finalParts = [];
        let accumEn = '';
        let accumKo = '';
        let accumStart = times[0].start;

        for (let i = 0; i < enParts.length; i++) {
          const partDur = times[i].end - times[i].start;
          if (accumEn.length === 0) {
            accumEn = enParts[i];
            accumKo = koParts[i];
            accumStart = times[i].start;
          } else {
            accumEn += ' ' + enParts[i];
            if (koParts[i]) accumKo += (accumKo ? ' ' : '') + koParts[i];
          }

          const accumDur = times[i].end - accumStart;
          const isLast = i === enParts.length - 1;
          const nextPartDur = (!isLast && i + 1 < enParts.length) ? times[i + 1].end - times[i + 1].start : 999;

          if (accumDur >= 1.5 || isLast) {
            finalParts.push({
              start: Math.round(accumStart * 100) / 100,
              end: times[i].end,
              en: accumEn,
              ko: accumKo
            });
            accumEn = '';
            accumKo = '';
          }
        }

        if (finalParts.length > 1) {
          splits += finalParts.length - 1;
          processed.push(...finalParts);
          continue;
        }
      }
      processed.push(seg);
    } else if (!multiSent && duration > 8) {
      // Case C: Single sentence > 8s → split at clause boundary
      const clauseParts = splitAtClause(seg.en);
      if (clauseParts) {
        const times = proportionalTime(seg.start, seg.end, clauseParts);
        const dur1 = times[0].end - times[0].start;
        const dur2 = times[1].end - times[1].start;
        if (dur1 >= 3 && dur2 >= 3) {
          const koParts = splitKoreanForClause(seg.ko, clauseParts);
          splits++;
          processed.push(
            { start: times[0].start, end: times[0].end, en: clauseParts[0], ko: koParts[0] },
            { start: times[1].start, end: times[1].end, en: clauseParts[1], ko: koParts[1] }
          );
          continue;
        }
      }
      processed.push(seg);
    } else if (!multiSent && duration >= 6 && duration <= 8) {
      // Case D: Single sentence 5-8s, split only if >= 6s AND clear clause boundary
      const clauseParts = splitAtClause(seg.en);
      if (clauseParts) {
        const times = proportionalTime(seg.start, seg.end, clauseParts);
        const dur1 = times[0].end - times[0].start;
        const dur2 = times[1].end - times[1].start;
        if (dur1 >= 3 && dur2 >= 3) {
          const koParts = splitKoreanForClause(seg.ko, clauseParts);
          splits++;
          processed.push(
            { start: times[0].start, end: times[0].end, en: clauseParts[0], ko: koParts[0] },
            { start: times[1].start, end: times[1].end, en: clauseParts[1], ko: koParts[1] }
          );
          continue;
        }
      }
      processed.push(seg);
    } else {
      processed.push(seg);
    }
  }

  // Step 3: Merge fragments (Case G)
  let merged = [];
  for (let i = 0; i < processed.length; i++) {
    const seg = processed[i];
    if (isMusicOrEffect(seg.en)) {
      merged.push(seg);
      continue;
    }

    if (isFragment(seg)) {
      // Merge with previous if prev doesn't end with sentence punctuation, else next
      if (merged.length > 0 && !isMusicOrEffect(merged[merged.length - 1].en)) {
        const prev = merged[merged.length - 1];
        const prevEndsWithPunct = /[.?!]$/.test(prev.en.trim());
        if (!prevEndsWithPunct) {
          // Merge into previous
          prev.end = seg.end;
          prev.en = prev.en + ' ' + seg.en;
          if (seg.ko) prev.ko = prev.ko + ' ' + seg.ko;
          merges++;
          continue;
        }
      }
      // Merge with next if available
      if (i + 1 < processed.length && !isMusicOrEffect(processed[i + 1].en)) {
        const next = processed[i + 1];
        next.start = seg.start;
        next.en = seg.en + ' ' + next.en;
        if (seg.ko) next.ko = seg.ko + ' ' + next.ko;
        merges++;
        continue;
      }
    }
    merged.push(seg);
  }

  return { segments: merged, splits, merges, dupsRemoved };
}

function main() {
  if (!existsSync(RESULTS_DIR)) {
    mkdirSync(RESULTS_DIR, { recursive: true });
  }

  const report = {
    batch: '14',
    filesProcessed: 0,
    filesChanged: 0,
    totalSplits: 0,
    totalMerges: 0,
    totalDupsRemoved: 0,
    details: {}
  };

  let missing = 0;

  for (const videoId of VIDEO_IDS) {
    const filePath = join(TRANSCRIPTS_DIR, `${videoId}.json`);
    report.filesProcessed++;

    if (!existsSync(filePath)) {
      console.log(`MISSING: ${videoId}`);
      missing++;
      continue;
    }

    try {
      const raw = readFileSync(filePath, 'utf-8');
      const segments = JSON.parse(raw);

      if (!Array.isArray(segments) || segments.length === 0) {
        console.log(`EMPTY: ${videoId}`);
        continue;
      }

      const segsBefore = segments.length;
      const result = processTranscript(segments);
      const segsAfter = result.segments.length;

      const changed = result.splits > 0 || result.merges > 0 || result.dupsRemoved > 0;

      if (changed) {
        writeFileSync(filePath, JSON.stringify(result.segments, null, 2), 'utf-8');
        report.filesChanged++;
        report.totalSplits += result.splits;
        report.totalMerges += result.merges;
        report.totalDupsRemoved += result.dupsRemoved;
        report.details[videoId] = {
          splits: result.splits,
          merges: result.merges,
          dupsRemoved: result.dupsRemoved,
          segsBefore,
          segsAfter
        };
        console.log(`CHANGED: ${videoId} - splits:${result.splits} merges:${result.merges} dups:${result.dupsRemoved} (${segsBefore} → ${segsAfter})`);
      } else {
        console.log(`OK: ${videoId} (${segsBefore} segs, no changes)`);
      }
    } catch (err) {
      console.error(`ERROR: ${videoId} - ${err.message}`);
    }
  }

  // Write report
  const reportPath = join(RESULTS_DIR, 'batch-14.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\nReport written to ${reportPath}`);
  console.log(`Processed: ${report.filesProcessed}, Changed: ${report.filesChanged}, Missing: ${missing}`);
  console.log(`Total splits: ${report.totalSplits}, merges: ${report.totalMerges}, dups removed: ${report.totalDupsRemoved}`);
}

main();
