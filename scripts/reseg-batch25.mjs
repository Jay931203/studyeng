import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const BASE = resolve('public/transcripts');
const OUT = resolve('src/data/reseg-results');

const IDS = [
  'KnpnYAId6dU','kN-q8yX0loc','knro0i2JH44','kOEDG3j1bjs','-Koj9hvcBMk',
  'kq9Q9-U0vrc','Ks-_Mh1QhMc','KSQ8N0EYmqU','KTFjeMITIuY','kThPuEy8V5M',
  'kTJczUoc26U','KtlgYxa6BMU','ktvTqknDobU','KUnA9jb-NpE','KUPSTQSGb50',
  'kVcPXzDAu2c','KVkTAhSxV9w','kVm5k99PnBk','KvRoU6r7a5Q','kwUNMdallSU',
  'KXgt5q3YflE','kxjwb5cXTI0','kXYiU_JCYtU','ky3KiiUK_D0','kze1JkPl5_8',
  'l_NYrWqUR40','L_PWbnHABsM','l1B1_jQnlFk','l1IchzbtNj0','L6G0VxscwqE',
  'l6TGERgrXmA','L7wCy1IOwOw','L81XWiDgmTk','L9d960njfC8','l9VViSscQvA',
  'LABGimhsEys'
];

const ABBR_LIST = [
  'Dr','Mr','Mrs','Ms','U\\.S','St','Jr','Sr','Prof','Gen','Gov','Sgt','Lt',
  'Col','Capt','Rev','etc','vs','Inc','Ltd','Corp','Ave','Blvd','Mt','Ft','No','Vol'
];
const ABBR_RE = new RegExp(`(?:${ABBR_LIST.join('|')})\\.`, 'g');

function r2(n) { return Math.round(n * 100) / 100; }
function protect(t) { return t.replace(ABBR_RE, m => m.replace(/\./g, '\u0000')); }
function restore(t) { return t.replace(/\u0000/g, '.'); }
function wc(t) { return t.trim().split(/\s+/).filter(w => w).length; }
function isMusic(seg) {
  return /^\s*[\u266a\u266b♪♫\[\(].*$/i.test(seg.en) ||
    /^\s*\[.*(?:music|singing|song|instrumental|applause|laughter).*\]\s*$/i.test(seg.en);
}
function isLyrics(segs) {
  let c = 0;
  for (const s of segs) if (wc(s.en) <= 12 && !/[.!?]$/.test(s.en.trim())) c++;
  return c / segs.length > 0.6;
}
function endsComplete(en) { return /[.!?]["'\u201d\u2019…]?\s*$/.test(en.trim()); }
function startsLower(en) { const t = en.trim(); return t.length > 0 && t[0] >= 'a' && t[0] <= 'z'; }

// Split text into sentences
function splitSentences(en) {
  const p = protect(en);
  const parts = p.split(/(?<=[.!?]["'\u201d\u2019]?)\s+(?=[A-Z\u201c"'\u2018])/);
  return parts.map(s => restore(s).trim()).filter(s => s.length > 0);
}
function countSentences(en) { return splitSentences(en).length; }

// After splitting, consolidate fragments: merge parts with <=2 words into neighbors
// Only merge truly tiny fragments (1-2 words like "the trash." or "acts")
function consolidateFragments(parts) {
  if (parts.length <= 1) return parts;
  let result = [...parts];
  // Merge leading fragment (<=2 words) into next
  while (result.length > 1 && wc(result[0]) <= 2) {
    result[1] = result[0] + ' ' + result[1];
    result.splice(0, 1);
  }
  // Merge trailing fragment (<=2 words) into previous
  while (result.length > 1 && wc(result[result.length - 1]) <= 2) {
    result[result.length - 2] = result[result.length - 2] + ' ' + result[result.length - 1];
    result.splice(result.length - 1, 1);
  }
  return result;
}

// Split at clause boundary - pick the split closest to the middle
function splitAtClause(en) {
  const mid = en.length / 2;
  let bestSplit = null;
  let bestDist = Infinity;

  function trySplit(idx, keepLeft, skipRight) {
    // idx is position in string, keepLeft chars go to left side
    const a = en.slice(0, idx + keepLeft).trim();
    const b = en.slice(idx + skipRight).trim();
    if (a.length > 5 && b.length > 5) {
      const dist = Math.abs(idx - mid);
      if (dist < bestDist) {
        bestDist = dist;
        bestSplit = [a, b];
      }
    }
  }

  // Try all comma+conjunction matches
  const clauseRe = /,\s+(?:and|but|or|so|because|since|although|though|while|when|where|which|who|that|if|after|before|until|unless|however|yet|then)\s+/gi;
  let m;
  while ((m = clauseRe.exec(en)) !== null) {
    trySplit(m.index, 1, m[0].length); // keep comma on left, skip conjunction
  }

  // Try colon splits
  const colonRe = /:\s+/g;
  while ((m = colonRe.exec(en)) !== null) {
    trySplit(m.index, 1, m[0].length);
  }

  // Try semicolons
  let si = -1;
  while ((si = en.indexOf(';', si + 1)) !== -1) {
    trySplit(si, 1, 2); // keep semicolon on left, skip semicolon+space
  }

  // Try dash/em-dash
  const dashRe = /\s+[-\u2013\u2014]\s+/g;
  while ((m = dashRe.exec(en)) !== null) {
    trySplit(m.index, 0, m[0].length);
  }

  return bestSplit;
}

// Proportional time split
function splitTime(start, end, parts) {
  const total = parts.reduce((s, p) => s + p.length, 0);
  if (total === 0) return parts.map(() => ({ start, end }));
  const dur = end - start;
  const res = [];
  let cur = start;
  for (let i = 0; i < parts.length; i++) {
    const segEnd = i === parts.length - 1 ? end : r2(cur + dur * parts[i].length / total);
    res.push({ start: r2(cur), end: segEnd });
    cur = segEnd;
  }
  return res;
}

// Split Korean to match English parts count
function splitKo(ko, enParts) {
  if (!ko || !ko.trim()) return enParts.map(() => '');
  const ks = ko.split(/(?<=[.!?\u3002])\s+/).filter(s => s.trim());
  if (ks.length === enParts.length) return ks;
  if (ks.length > enParts.length) {
    const r = [];
    for (let i = 0; i < enParts.length - 1; i++) r.push(ks[i] || '');
    r.push(ks.slice(enParts.length - 1).join(' '));
    return r;
  }
  return [ko, ...Array(enParts.length - 1).fill('')];
}

function processFile(videoId) {
  const filePath = resolve(BASE, `${videoId}.json`);
  let segs;
  try { segs = JSON.parse(readFileSync(filePath, 'utf8')); }
  catch (e) { console.error(`  ERROR: ${e.message}`); return null; }
  if (!segs.length) return { splits: 0, merges: 0, dupsRemoved: 0, segsBefore: 0, segsAfter: 0, changed: false };

  const segsBefore = segs.length;
  let splits = 0, merges = 0, dupsRemoved = 0;

  // Rule I: lyrics -> keep
  if (isLyrics(segs)) {
    return { splits: 0, merges: 0, dupsRemoved: 0, segsBefore, segsAfter: segsBefore, changed: false };
  }

  // === STEP 1: Remove consecutive duplicates ===
  let deduped = [segs[0]];
  for (let i = 1; i < segs.length; i++) {
    if (segs[i].en.trim() === segs[i-1].en.trim()) {
      deduped[deduped.length - 1] = { ...deduped[deduped.length - 1], end: segs[i].end };
      dupsRemoved++;
    } else {
      deduped.push(segs[i]);
    }
  }
  segs = deduped;

  // === STEP 2: Join cross-boundary fragments ===
  // Only join when gap <= 0.5s, next starts lowercase, result <= 15s
  let joined = [];
  let i = 0;
  while (i < segs.length) {
    let cur = { ...segs[i] };
    while (i + 1 < segs.length) {
      const next = segs[i + 1];
      const gap = next.start - cur.end;
      const totalDur = next.end - cur.start;
      if (gap <= 0.5 && startsLower(next.en) && totalDur <= 15) {
        cur = {
          start: cur.start, end: next.end,
          en: cur.en + ' ' + next.en,
          ko: [cur.ko, next.ko].filter(Boolean).join(' ') || ''
        };
        merges++;
        i++;
      } else { break; }
    }
    joined.push(cur);
    i++;
  }
  segs = joined;

  // === STEP 3: Merge tiny segments (Rule G: <=2 words AND <1.5s) ===
  let merged = [];
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    const dur = seg.end - seg.start;
    if (wc(seg.en) <= 2 && dur < 1.5 && !isMusic(seg)) {
      if (merged.length > 0) {
        const prev = merged[merged.length - 1];
        merged[merged.length - 1] = {
          start: prev.start, end: seg.end,
          en: prev.en + ' ' + seg.en,
          ko: [prev.ko, seg.ko].filter(Boolean).join(' ') || ''
        };
        merges++;
      } else if (i + 1 < segs.length) {
        segs[i + 1] = {
          start: seg.start, end: segs[i + 1].end,
          en: seg.en + ' ' + segs[i + 1].en,
          ko: [seg.ko, segs[i + 1].ko].filter(Boolean).join(' ') || ''
        };
        merges++;
      } else {
        merged.push(seg);
      }
    } else {
      merged.push({ ...seg });
    }
  }
  segs = merged;

  // === STEP 4: Split segments (recursive) ===
  // Process a single segment, returning array of resulting segments
  function splitSeg(seg) {
    const dur = r2(seg.end - seg.start);

    // Rule H: music -> keep
    if (isMusic(seg)) return [seg];

    // Rule B: <=3s -> keep
    if (dur <= 3) return [seg];

    const nSent = countSentences(seg.en);

    // Rule A: multi-sentence >3s -> split at sentence boundaries
    if (nSent >= 2 && dur > 3) {
      let enParts = splitSentences(seg.en);
      enParts = consolidateFragments(enParts);
      // Further consolidate: merge any part that would be < 0.8s proportionally
      if (enParts.length >= 2) {
        const totalChars = enParts.reduce((s, p) => s + p.length, 0);
        let merged = true;
        while (merged && enParts.length >= 2) {
          merged = false;
          for (let k = 0; k < enParts.length; k++) {
            const partDur = dur * enParts[k].length / totalChars;
            if (partDur < 0.8) {
              // Merge with neighbor (prefer longer neighbor)
              if (k === 0) {
                enParts[1] = enParts[0] + ' ' + enParts[1];
                enParts.splice(0, 1);
              } else {
                enParts[k - 1] = enParts[k - 1] + ' ' + enParts[k];
                enParts.splice(k, 1);
              }
              merged = true;
              break;
            }
          }
        }
      }
      if (enParts.length >= 2) {
        const times = splitTime(seg.start, seg.end, enParts);
        if (times.every(t => (t.end - t.start) >= 0.8)) {
          const koParts = splitKo(seg.ko, enParts);
          const children = [];
          for (let j = 0; j < enParts.length; j++) {
            children.push({ start: times[j].start, end: times[j].end, en: enParts[j], ko: koParts[j] || '' });
          }
          splits += enParts.length - 1;
          // Recursively process children (for clause splits on long single-sentence parts)
          return children.flatMap(c => splitSeg(c));
        }
      }
    }

    // Rule C: single sentence >8s -> clause split (each >=3s)
    if (nSent <= 1 && dur > 8) {
      const cp = splitAtClause(seg.en);
      if (cp) {
        const times = splitTime(seg.start, seg.end, cp);
        if (times.every(t => (t.end - t.start) >= 3)) {
          const koParts = splitKo(seg.ko, cp);
          const children = [];
          for (let j = 0; j < cp.length; j++) {
            children.push({ start: times[j].start, end: times[j].end, en: cp[j], ko: koParts[j] || '' });
          }
          splits += cp.length - 1;
          return children;
        }
      }
    }

    // Rule D: 6-8s single sentence -> clause split (each >=2.5s)
    if (dur >= 6 && dur <= 8 && nSent <= 1) {
      const cp = splitAtClause(seg.en);
      if (cp) {
        const times = splitTime(seg.start, seg.end, cp);
        if (times.every(t => (t.end - t.start) >= 2.5)) {
          const koParts = splitKo(seg.ko, cp);
          const children = [];
          for (let j = 0; j < cp.length; j++) {
            children.push({ start: times[j].start, end: times[j].end, en: cp[j], ko: koParts[j] || '' });
          }
          splits += cp.length - 1;
          return children;
        }
      }
    }

    // Default: keep
    return [seg];
  }

  let result = [];
  for (const seg of segs) {
    result.push(...splitSeg(seg));
  }

  // === STEP 5: Final merge pass for remaining tiny segments ===
  let final = [];
  for (const seg of result) {
    const dur = seg.end - seg.start;
    if (wc(seg.en) <= 2 && dur < 1.5 && !isMusic(seg) && final.length > 0) {
      const prev = final[final.length - 1];
      final[final.length - 1] = {
        start: prev.start, end: seg.end,
        en: prev.en + ' ' + seg.en,
        ko: [prev.ko, seg.ko].filter(Boolean).join(' ') || ''
      };
      merges++;
    } else {
      final.push(seg);
    }
  }

  const segsAfter = final.length;
  const changed = splits > 0 || merges > 0 || dupsRemoved > 0;
  if (changed) {
    writeFileSync(filePath, JSON.stringify(final, null, 2) + '\n', 'utf8');
  }
  return { splits, merges, dupsRemoved, segsBefore, segsAfter, changed };
}

// === MAIN ===
console.log(`=== Resegmentation Batch 25 (${IDS.length} files) ===\n`);

const details = {};
let totalSplits = 0, totalMerges = 0, totalDupsRemoved = 0, filesChanged = 0;

for (const id of IDS) {
  process.stdout.write(`  ${id} ... `);
  const r = processFile(id);
  if (!r) { console.log('SKIP'); continue; }
  if (r.changed) {
    details[id] = { splits: r.splits, merges: r.merges, dupsRemoved: r.dupsRemoved, segsBefore: r.segsBefore, segsAfter: r.segsAfter };
    filesChanged++;
    totalSplits += r.splits;
    totalMerges += r.merges;
    totalDupsRemoved += r.dupsRemoved;
    console.log(`CHANGED  +${r.splits}sp -${r.merges}mg -${r.dupsRemoved}dp  ${r.segsBefore} -> ${r.segsAfter}`);
  } else {
    console.log('OK');
  }
}

const report = { batch: '25', filesProcessed: IDS.length, filesChanged, totalSplits, totalMerges, totalDupsRemoved, details };
mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, 'batch-25.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');

console.log(`\n=== DONE ===`);
console.log(`Changed: ${filesChanged}/${IDS.length}  |  Splits: ${totalSplits}  |  Merges: ${totalMerges}  |  Dups: ${totalDupsRemoved}`);
