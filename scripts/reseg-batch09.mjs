import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const TRANSCRIPTS_DIR = 'C:/Users/hyunj/studyeng/public/transcripts';
const RESULTS_DIR = 'C:/Users/hyunj/studyeng/src/data/reseg-results';

const VIDEO_IDS = [
  'AIUaYqSUVps','AIuWQ41m7ys','ajb-YbY3-rw','aJOTlE1K90k','AJzgI6v5wXQ',
  'AM0MVuEmFGc','ampLJDK6lYs','aMuBngVO6QE','AnDZaIKIXtI','apidUvNbqJA',
  'aPnuxi4S9JQ','ar0rK_NDErU','Ar3-ymEoJk0','ArHq_mBrEpo','arj7oStGLkU',
  'ArlsU2_cUbg','ARoCpelSF70','aRsOBFhNjVM','aS1esgRV4Rc','AS38I3esj0o',
  'AST2-4db4ic','aSugSGCC12I','ASVUj89hyg0','-at3oShfXH8','aTL4qIIxg8A',
  'ATMR5ettHz8','AU-AqxMUs_o','auLBLk4ibAk','AuqEZx6TmfI','avfVD6Par0M',
  'aWIE0PX1uXk','aXzVF3XeS8M','AyMs2xox_hE','Ayp72KBYk5o','B0bnsYzJqYk',
  'B0JmxKg_IaY'
];

// ── Helpers ──────────────────────────────────────────────────

function isMusic(en) {
  if (!en) return false;
  const t = en.trim();
  if (/^[\u266A\u266B]/.test(t) || /[\u266A\u266B]$/.test(t)) return true;
  if (/^\[?(music|applause|laughter|cheering|singing|instrumental)\]?$/i.test(t)) return true;
  return false;
}

// Find sentence boundaries in English text, respecting abbreviations
function findSentenceBoundaries(en) {
  if (!en || en.trim().length === 0) return null;

  // Replace known abbreviations with placeholders so their periods are not treated as sentence ends
  const placeholders = [];
  let safe = en;

  // Handle multi-dot abbreviations first: U.S., e.g., i.e.
  safe = safe.replace(/\bU\.S\./g, (m) => {
    placeholders.push(m);
    return `__ABBR${placeholders.length - 1}__`;
  });
  safe = safe.replace(/\b(e\.g|i\.e)\./gi, (m) => {
    placeholders.push(m);
    return `__ABBR${placeholders.length - 1}__`;
  });
  // Single-dot abbreviations
  safe = safe.replace(/\b(Dr|Mr|Mrs|Ms|Jr|Sr|Prof|Inc|Ltd|St|vs)\./gi, (m) => {
    placeholders.push(m);
    return `__ABBR${placeholders.length - 1}__`;
  });

  // Find boundaries: punctuation [.?!] followed by whitespace then uppercase letter (or quote + uppercase)
  const boundaries = [];
  const regex = /([.?!])(\s+)(?=["'\u201C\u2018]?[A-Z])/g;
  let match;
  while ((match = regex.exec(safe)) !== null) {
    // The boundary is right after the punctuation mark (the space position)
    boundaries.push(match.index + match[1].length);
  }

  if (boundaries.length === 0) return null;

  // Split using safe string, then restore placeholders
  const sentences = [];
  let prev = 0;
  for (const bnd of boundaries) {
    const seg = safe.substring(prev, bnd).trim();
    if (seg) sentences.push(seg);
    prev = bnd;
  }
  const last = safe.substring(prev).trim();
  if (last) sentences.push(last);

  // Restore placeholders in each sentence
  const restored = sentences.map(s =>
    s.replace(/__ABBR(\d+)__/g, (_, idx) => placeholders[parseInt(idx)])
  );

  return restored.length >= 2 ? restored : null;
}

// Split Korean text to match English sentence count
function splitKorean(ko, enParts) {
  if (!ko || !ko.trim()) return enParts.map((_, i) => (i === 0 ? (ko || '') : ''));

  // Try splitting Korean by sentence-ending punctuation followed by space
  const koBoundaries = [];
  const koRegex = /([.?!\uFF1F\uFF01])(\s+)/g;
  let m;
  while ((m = koRegex.exec(ko)) !== null) {
    koBoundaries.push(m.index + m[1].length);
  }

  const neededSplits = enParts.length - 1;
  if (koBoundaries.length >= neededSplits) {
    const koSentences = [];
    let prev = 0;
    for (let i = 0; i < neededSplits; i++) {
      koSentences.push(ko.substring(prev, koBoundaries[i]).trim());
      prev = koBoundaries[i];
    }
    koSentences.push(ko.substring(prev).trim());
    return koSentences;
  }

  // Cannot split cleanly: full ko in first, empty for rest
  return enParts.map((_, i) => (i === 0 ? ko : ''));
}

// Split timing proportionally by character count
function splitTimingByChars(start, end, parts) {
  const totalChars = parts.reduce((s, p) => s + p.length, 0);
  if (totalChars === 0) return parts.map(() => ({ start, end }));
  const totalDur = end - start;
  const result = [];
  let cur = start;

  for (let i = 0; i < parts.length; i++) {
    const ratio = parts[i].length / totalChars;
    const dur = totalDur * ratio;
    const segEnd = i === parts.length - 1 ? end : Math.round((cur + dur) * 100) / 100;
    result.push({ start: Math.round(cur * 100) / 100, end: segEnd });
    cur = segEnd;
  }
  return result;
}

// Find clause boundary for long single-sentence segments
function findClauseBoundary(en) {
  const patterns = [
    ', and ', ', but ', ', because ', ', which ', ', so ', ', or ',
    ', when ', ', if ', ', although ', ', while ', ', since ', ', where ',
    ', though ', ', after ', ', before ', ', until '
  ];

  const found = [];
  for (const pat of patterns) {
    let idx = en.toLowerCase().indexOf(pat.toLowerCase());
    while (idx !== -1) {
      // Verify it exists at this position in original (case-insensitive match)
      found.push({ idx, pat });
      idx = en.toLowerCase().indexOf(pat.toLowerCase(), idx + 1);
    }
  }

  if (found.length === 0) return null;

  // Pick the one closest to the middle for balanced split
  const mid = en.length / 2;
  found.sort((a, b) => Math.abs(a.idx - mid) - Math.abs(b.idx - mid));

  const best = found[0];
  // Split: everything up to and including the comma stays in part1,
  // part2 starts with the conjunction word
  return { splitAt: best.idx + 2 }; // after ", "
}

// ── Main processing ──────────────────────────────────────────

function processTranscript(segments) {
  let splits = 0;
  let merges = 0;
  let dupsRemoved = 0;

  // Phase 1: Remove consecutive duplicate en segments
  const deduped = [];
  for (let i = 0; i < segments.length; i++) {
    const curEn = (segments[i].en || '').trim();
    if (i > 0 && curEn === (segments[i - 1].en || '').trim() && curEn.length > 0) {
      dupsRemoved++;
      continue;
    }
    deduped.push({ ...segments[i] });
  }

  // Phase 2: Splitting
  const afterSplit = [];
  for (const seg of deduped) {
    const dur = seg.end - seg.start;
    const en = (seg.en || '').trim();
    const ko = (seg.ko || '').trim();

    // Case H: Music/effects - keep as-is
    if (isMusic(en)) {
      afterSplit.push(seg);
      continue;
    }

    // Check for multi-sentence
    const sentences = findSentenceBoundaries(en);

    if (sentences && sentences.length >= 2) {
      // Case A: Multi-sentence > 3s -> SPLIT
      if (dur > 3) {
        const timings = splitTimingByChars(seg.start, seg.end, sentences);
        const koSplits = splitKorean(ko, sentences);

        // Group short parts (< 1.5s) with neighbors
        const groups = [];
        let curGroup = { ens: [sentences[0]], kos: [koSplits[0]], timing: { ...timings[0] } };

        for (let j = 1; j < sentences.length; j++) {
          const partDur = timings[j].end - timings[j].start;
          const curDur = curGroup.timing.end - curGroup.timing.start;

          if (partDur < 1.5 || curDur < 1.5) {
            // Merge into current group
            curGroup.ens.push(sentences[j]);
            curGroup.kos.push(koSplits[j]);
            curGroup.timing.end = timings[j].end;
          } else {
            groups.push(curGroup);
            curGroup = { ens: [sentences[j]], kos: [koSplits[j]], timing: { ...timings[j] } };
          }
        }
        groups.push(curGroup);

        if (groups.length >= 2) {
          splits += groups.length - 1;
          for (const g of groups) {
            afterSplit.push({
              start: g.timing.start,
              end: g.timing.end,
              en: g.ens.join(' '),
              ko: g.kos.filter(k => k).join(' ') || ko
            });
          }
          continue;
        }
      }
      // Case B: Multi-sentence <= 3s OR couldn't split -> KEEP
      afterSplit.push(seg);
      continue;
    }

    // Single sentence cases
    // Case C: > 8s -> split at clause boundary
    if (dur > 8) {
      const boundary = findClauseBoundary(en);
      if (boundary) {
        const part1 = en.substring(0, boundary.splitAt).trim();
        const part2 = en.substring(boundary.splitAt).trim();
        const timings = splitTimingByChars(seg.start, seg.end, [part1, part2]);

        const dur1 = timings[0].end - timings[0].start;
        const dur2 = timings[1].end - timings[1].start;

        if (dur1 >= 3 && dur2 >= 3) {
          const koSplits = splitKorean(ko, [part1, part2]);
          splits++;
          afterSplit.push(
            { start: timings[0].start, end: timings[0].end, en: part1, ko: koSplits[0] },
            { start: timings[1].start, end: timings[1].end, en: part2, ko: koSplits[1] }
          );
          continue;
        }
      }
      afterSplit.push(seg);
      continue;
    }

    // Case D: 5-8s, only split if >= 6s and clear clause boundary
    if (dur >= 5 && dur <= 8 && dur >= 6) {
      const boundary = findClauseBoundary(en);
      if (boundary) {
        const part1 = en.substring(0, boundary.splitAt).trim();
        const part2 = en.substring(boundary.splitAt).trim();
        const timings = splitTimingByChars(seg.start, seg.end, [part1, part2]);

        const dur1 = timings[0].end - timings[0].start;
        const dur2 = timings[1].end - timings[1].start;

        if (dur1 >= 3 && dur2 >= 3) {
          const koSplits = splitKorean(ko, [part1, part2]);
          splits++;
          afterSplit.push(
            { start: timings[0].start, end: timings[0].end, en: part1, ko: koSplits[0] },
            { start: timings[1].start, end: timings[1].end, en: part2, ko: koSplits[1] }
          );
          continue;
        }
      }
    }

    // Case E/F: < 5s -> no change
    afterSplit.push(seg);
  }

  // Phase 3: Merge fragments (Case G: <= 2 words AND < 1.5s)
  const merged = [];
  let i = 0;
  while (i < afterSplit.length) {
    const seg = afterSplit[i];
    const dur = seg.end - seg.start;
    const words = (seg.en || '').trim().split(/\s+/).filter(w => w.length > 0);

    if (words.length <= 2 && dur < 1.5 && !isMusic(seg.en)) {
      // Try merge with previous
      if (merged.length > 0) {
        const prev = merged[merged.length - 1];
        const prevEn = (prev.en || '').trim();
        if (!/[.?!]$/.test(prevEn)) {
          // Merge with previous
          prev.end = seg.end;
          prev.en = prevEn + ' ' + (seg.en || '').trim();
          if (seg.ko && seg.ko.trim()) {
            prev.ko = ((prev.ko || '').trim() + ' ' + seg.ko.trim()).trim();
          }
          merges++;
          i++;
          continue;
        }
      }
      // Merge with next
      if (i + 1 < afterSplit.length) {
        const next = afterSplit[i + 1];
        next.start = seg.start;
        next.en = ((seg.en || '').trim() + ' ' + (next.en || '').trim()).trim();
        if (seg.ko && seg.ko.trim()) {
          next.ko = (seg.ko.trim() + ' ' + (next.ko || '').trim()).trim();
        }
        merges++;
        i++;
        continue;
      }
      // No neighbor to merge with
      merged.push(seg);
    } else {
      merged.push(seg);
    }
    i++;
  }

  return { segments: merged, splits, merges, dupsRemoved };
}

// ── Run ──────────────────────────────────────────────────────

if (!existsSync(RESULTS_DIR)) {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

const report = {
  batch: '09',
  filesProcessed: 0,
  filesChanged: 0,
  totalSplits: 0,
  totalMerges: 0,
  totalDupsRemoved: 0,
  details: {}
};

for (const vid of VIDEO_IDS) {
  const filePath = `${TRANSCRIPTS_DIR}/${vid}.json`;
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const segments = JSON.parse(raw);
    report.filesProcessed++;

    const segsBefore = segments.length;
    const result = processTranscript(segments);
    const segsAfter = result.segments.length;

    const changed = result.splits > 0 || result.merges > 0 || result.dupsRemoved > 0;

    if (changed) {
      report.filesChanged++;
      report.totalSplits += result.splits;
      report.totalMerges += result.merges;
      report.totalDupsRemoved += result.dupsRemoved;
      report.details[vid] = {
        splits: result.splits,
        merges: result.merges,
        dupsRemoved: result.dupsRemoved,
        segsBefore,
        segsAfter
      };

      // Write modified file back
      writeFileSync(filePath, JSON.stringify(result.segments, null, 2) + '\n', 'utf-8');
      console.log(`CHANGED: ${vid} | splits=${result.splits} merges=${result.merges} dups=${result.dupsRemoved} | ${segsBefore} -> ${segsAfter} segs`);
    } else {
      console.log(`UNCHANGED: ${vid} (${segsBefore} segs)`);
    }
  } catch (err) {
    console.error(`ERROR: ${vid}: ${err.message}`);
  }
}

// Write report
writeFileSync(`${RESULTS_DIR}/batch-09.json`, JSON.stringify(report, null, 2) + '\n', 'utf-8');
console.log('\n=== BATCH 09 REPORT ===');
console.log(`Files processed: ${report.filesProcessed}`);
console.log(`Files changed: ${report.filesChanged}`);
console.log(`Total splits: ${report.totalSplits}`);
console.log(`Total merges: ${report.totalMerges}`);
console.log(`Total dups removed: ${report.totalDupsRemoved}`);
console.log(JSON.stringify(report, null, 2));
