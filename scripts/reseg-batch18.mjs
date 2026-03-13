import fs from 'fs';
import path from 'path';

const TRANSCRIPTS_DIR = 'public/transcripts';
const RESULTS_DIR = 'src/data/reseg-results';

const VIDEO_IDS = [
  'G5XKkXVmt3k','g6o3rEInTII','g7J_RrBcchQ','G7KNmW9a75Y','g8rhCeP1SPg',
  'GaoLU6zKaws','Gbsw-XxPREA','GcaKkWsVtM4','gCKjctTWIsw','gCZBY7a8kqE',
  'GDEVOCTW4qk','GFAbkHlKFGE','gFr0_ywVdhY','gf-tZ8OAc1U','G-H4Qs-CCIo',
  'Ghd2bkIadG4','GHTQQHwKa7Q','GIUhpzv47YQ','gJ_cx3AmCuI','GjIKnpjUZP0',
  'gJuNiHitc40','GkD20ajVxnY','gKGOG-Pr81E','gnHCw87Enq4','gNi_6U5Pm_o',
  'GNtS6KzseN8','GNxiVJbqncs','gO8N3L_aERg','Goem3yP-__4','GOfv3rAVOPA',
  'gOxG6HSicwk','gpeh1DUAusk','gPoiv0sZ4s4','GQMlWwIXg3M','gQ-she8Xneo',
  'gQU3EphIpMY'
];

// Abbreviations that end with period but are NOT sentence endings
const ABBR_PATTERN = /\b(?:Dr|Mr|Mrs|Ms|Jr|Sr|vs|etc|Inc|Ltd|Prof|Gen|Gov|Sgt|Cpl|Pvt|Capt|Col|Lt|Maj|Rev|Hon|Pres|Sen|Rep|Dept|Ave|Blvd|Hwy|Mt|Ft|approx|dept|est|govt|natl|intl|St)\./g;

function isMusic(text) {
  const t = text.trim();
  return /^[\s\-♪\[\(]*(music|♪)[\s♪\]\)]*$/i.test(t) || /^-?♪+$/.test(t);
}

function isLyrics(segments) {
  // If most segments lack sentence-ending punctuation, it's likely lyrics
  let noPunct = 0;
  for (const seg of segments) {
    const t = seg.en.trim();
    if (!t.match(/[.!?]$/)) noPunct++;
  }
  return segments.length > 3 && noPunct / segments.length > 0.7;
}

// Check if text is repetitive single-word exclamations like "Go! Go! Go!"
function isRepetitiveExclamation(text) {
  const words = text.trim().split(/\s+/);
  if (words.length < 4) return false;
  const unique = new Set(words.map(w => w.replace(/[.!?,]+$/, '').toLowerCase()));
  return unique.size <= 2;
}

function protectAbbreviations(text) {
  const abbrs = [];
  const protected_ = text.replace(ABBR_PATTERN, (m) => {
    abbrs.push(m);
    return `__ABBR${abbrs.length - 1}__`;
  });
  return { text: protected_, abbrs };
}

function restoreAbbreviations(text, abbrs) {
  let result = text;
  for (let i = 0; i < abbrs.length; i++) {
    result = result.replace(`__ABBR${i}__`, abbrs[i]);
  }
  return result;
}

function splitSentences(text) {
  const { text: protected_, abbrs } = protectAbbreviations(text);

  // Split on sentence-ending punctuation followed by space
  const parts = [];
  const regex = /([.!?]+)\s+/g;
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(protected_)) !== null) {
    const endIdx = match.index + match[0].length;
    const part = protected_.substring(lastIdx, endIdx).trim();
    if (part) parts.push(part);
    lastIdx = endIdx;
  }

  const last = protected_.substring(lastIdx).trim();
  if (last) parts.push(last);

  return parts.map(p => restoreAbbreviations(p, abbrs));
}

function splitAtClause(text) {
  const clauseRegex = /,\s+(and|but|because|which|so|or|when|if|although|where|while|since|though|after|before|until|unless)\s+/i;
  const match = text.match(clauseRegex);
  if (match) {
    const idx = match.index;
    const part1 = text.substring(0, idx + 1).trim();
    const part2 = text.substring(idx + 1).trim();
    if (part1.length > 0 && part2.length > 0) {
      return [part1, part2];
    }
  }
  return null;
}

function splitKorean(ko, enParts) {
  if (enParts.length <= 1) return [ko];

  // Try splitting Korean by sentence-ending markers (Korean periods/question marks too)
  const koSentences = ko.split(/(?<=[.!?。])\s+/).filter(s => s.trim().length > 0);

  if (koSentences.length === enParts.length) {
    return koSentences;
  }

  // If exact match fails, try to distribute available ko sentences
  if (koSentences.length > 1 && koSentences.length >= enParts.length) {
    // Group ko sentences to match en parts count
    const perPart = Math.floor(koSentences.length / enParts.length);
    const result = [];
    let koIdx = 0;
    for (let i = 0; i < enParts.length; i++) {
      const count = i === enParts.length - 1 ? koSentences.length - koIdx : perPart;
      result.push(koSentences.slice(koIdx, koIdx + count).join(' '));
      koIdx += count;
    }
    return result;
  }

  // Fallback: full ko in first, empty for rest
  const result = [ko];
  for (let i = 1; i < enParts.length; i++) {
    result.push('');
  }
  return result;
}

function rd(n) {
  return Math.round(n * 100) / 100;
}

function proportionalTiming(start, end, parts) {
  const totalChars = parts.reduce((sum, p) => sum + p.length, 0);
  if (totalChars === 0) return parts.map(() => ({ start, end }));
  const totalDuration = end - start;
  const result = [];
  let cur = start;

  for (let i = 0; i < parts.length; i++) {
    const ratio = parts[i].length / totalChars;
    const dur = totalDuration * ratio;
    const segEnd = i === parts.length - 1 ? end : rd(cur + dur);
    result.push({ start: rd(cur), end: rd(segEnd) });
    cur = segEnd;
  }

  return result;
}

function processFile(videoId) {
  const filePath = path.join(TRANSCRIPTS_DIR, `${videoId}.json`);

  if (!fs.existsSync(filePath)) {
    console.log(`  File not found: ${filePath}`);
    return null;
  }

  const segments = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  if (!segments || segments.length === 0) {
    return { changed: false, splits: 0, merges: 0, dupsRemoved: 0, segsBefore: 0, segsAfter: 0 };
  }

  const segsBefore = segments.length;
  const lyricsMode = isLyrics(segments);

  let result = segments.map(s => ({ ...s }));
  let splits = 0;
  let merges = 0;
  let dupsRemoved = 0;

  // === Step 1: Remove consecutive duplicates ===
  let deduped = [];
  for (let i = 0; i < result.length; i++) {
    if (i > 0 && result[i].en.trim() === result[i - 1].en.trim()) {
      dupsRemoved++;
      continue;
    }
    deduped.push({ ...result[i] });
  }
  result = deduped;

  // === Step 2: Process splits ===
  let processed = [];
  for (let i = 0; i < result.length; i++) {
    const seg = result[i];
    const duration = rd(seg.end - seg.start);
    const en = seg.en.trim();

    // Case H: Skip music
    if (isMusic(en)) {
      processed.push(seg);
      continue;
    }

    // Case I: Lyrics - keep as verse lines
    if (lyricsMode) {
      processed.push(seg);
      continue;
    }

    // Case E/F: <5s - no splitting
    if (duration < 5) {
      processed.push(seg);
      continue;
    }

    // Skip repetitive exclamations (Go! Go! Go!)
    if (isRepetitiveExclamation(en)) {
      processed.push(seg);
      continue;
    }

    const sentences = splitSentences(en);

    // Case A: Multi-sentence >3s → SPLIT per sentence
    if (sentences.length > 1 && duration > 3) {
      const timings = proportionalTiming(seg.start, seg.end, sentences);
      // Check all parts >= 1.5s
      const allOk = timings.every(t => rd(t.end - t.start) >= 1.5);

      if (allOk) {
        const koParts = splitKorean(seg.ko, sentences);
        for (let j = 0; j < sentences.length; j++) {
          processed.push({
            start: timings[j].start,
            end: timings[j].end,
            en: sentences[j],
            ko: koParts[j] || ''
          });
        }
        splits += sentences.length - 1;
        continue;
      }

      // Try grouping short adjacent splits to get >= 1.5s each
      let groups = [[0]];
      for (let j = 1; j < sentences.length; j++) {
        const lastGroup = groups[groups.length - 1];
        const gStart = timings[lastGroup[0]].start;
        const gEnd = timings[lastGroup[lastGroup.length - 1]].end;
        const gDur = rd(gEnd - gStart);

        if (gDur < 1.5) {
          lastGroup.push(j);
        } else {
          groups.push([j]);
        }
      }
      // Check if last group is too short, merge with previous
      if (groups.length > 1) {
        const lastG = groups[groups.length - 1];
        const lastStart = timings[lastG[0]].start;
        const lastEnd = timings[lastG[lastG.length - 1]].end;
        if (rd(lastEnd - lastStart) < 1.5) {
          const prev = groups[groups.length - 2];
          groups[groups.length - 2] = [...prev, ...lastG];
          groups.pop();
        }
      }

      if (groups.length > 1) {
        const groupTexts = groups.map(g => g.map(idx => sentences[idx]).join(' '));
        const koParts = splitKorean(seg.ko, groupTexts);
        for (let g = 0; g < groups.length; g++) {
          const gStart = timings[groups[g][0]].start;
          const gEnd = timings[groups[g][groups[g].length - 1]].end;
          processed.push({
            start: rd(gStart),
            end: rd(gEnd),
            en: groupTexts[g],
            ko: koParts[g] || ''
          });
        }
        splits += groups.length - 1;
        continue;
      }
    }

    // Case C: Single sentence >8s → SPLIT at clause
    if (sentences.length <= 1 && duration > 8) {
      const clauseParts = splitAtClause(en);
      if (clauseParts) {
        const timings = proportionalTiming(seg.start, seg.end, clauseParts);
        if (timings.every(t => rd(t.end - t.start) >= 3)) {
          const koParts = splitKorean(seg.ko, clauseParts);
          for (let j = 0; j < clauseParts.length; j++) {
            processed.push({
              start: timings[j].start,
              end: timings[j].end,
              en: clauseParts[j],
              ko: koParts[j] || ''
            });
          }
          splits += clauseParts.length - 1;
          continue;
        }
      }
    }

    // Case D: Single sentence 5-8s → Split only if >=6s AND clear clause
    if (sentences.length <= 1 && duration >= 6 && duration <= 8) {
      const clauseParts = splitAtClause(en);
      if (clauseParts) {
        const timings = proportionalTiming(seg.start, seg.end, clauseParts);
        if (timings.every(t => rd(t.end - t.start) >= 3)) {
          const koParts = splitKorean(seg.ko, clauseParts);
          for (let j = 0; j < clauseParts.length; j++) {
            processed.push({
              start: timings[j].start,
              end: timings[j].end,
              en: clauseParts[j],
              ko: koParts[j] || ''
            });
          }
          splits += clauseParts.length - 1;
          continue;
        }
      }
    }

    // No change needed
    processed.push(seg);
  }

  result = processed;

  // === Step 3: Merge fragments (Case G) ===
  // Fragment: <=2 words AND <1.5s duration
  // Only merge with adjacent segments (no time gap > 1s)
  let merged = [];
  let skipNext = false;

  for (let i = 0; i < result.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }

    const seg = result[i];
    const duration = rd(seg.end - seg.start);
    const words = seg.en.trim().split(/\s+/);
    const wordCount = words.length;

    if (wordCount <= 2 && duration < 1.5 && !isMusic(seg.en)) {
      // Try merge with previous (if prev doesn't end with [.?!])
      if (merged.length > 0) {
        const prev = merged[merged.length - 1];
        const prevEn = prev.en.trim();
        const timeGap = rd(seg.start - prev.end);

        if (!prevEn.match(/[.!?]$/) && timeGap <= 1) {
          prev.end = seg.end;
          prev.en = prev.en.trim() + ' ' + seg.en.trim();
          if (seg.ko.trim()) {
            prev.ko = (prev.ko.trim() + ' ' + seg.ko.trim()).trim();
          }
          merges++;
          continue;
        }
      }

      // Else merge with next if available and time-adjacent
      if (i + 1 < result.length) {
        const next = result[i + 1];
        const timeGap = rd(next.start - seg.end);

        if (timeGap <= 1) {
          merged.push({
            start: seg.start,
            end: next.end,
            en: (seg.en.trim() + ' ' + next.en.trim()),
            ko: (seg.ko.trim() + ' ' + next.ko.trim()).trim()
          });
          merges++;
          skipNext = true;
          continue;
        }
      }
    }

    merged.push(seg);
  }

  result = merged;

  const segsAfter = result.length;
  const changed = splits > 0 || merges > 0 || dupsRemoved > 0;

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
    console.log(`  Changed: +${splits} splits, +${merges} merges, -${dupsRemoved} dups | ${segsBefore} -> ${segsAfter} segs`);
  } else {
    console.log(`  No changes`);
  }

  return { changed, splits, merges, dupsRemoved, segsBefore, segsAfter };
}

// === Main ===
const report = {
  batch: '18',
  filesProcessed: 36,
  filesChanged: 0,
  totalSplits: 0,
  totalMerges: 0,
  totalDupsRemoved: 0,
  details: {}
};

for (const videoId of VIDEO_IDS) {
  console.log(`Processing ${videoId}...`);
  const result = processFile(videoId);

  if (!result) continue;

  if (result.changed) {
    report.filesChanged++;
    report.totalSplits += result.splits;
    report.totalMerges += result.merges;
    report.totalDupsRemoved += result.dupsRemoved;
    report.details[videoId] = {
      splits: result.splits,
      merges: result.merges,
      dupsRemoved: result.dupsRemoved,
      segsBefore: result.segsBefore,
      segsAfter: result.segsAfter
    };
  }
}

// Write report
fs.writeFileSync(path.join(RESULTS_DIR, 'batch-18.json'), JSON.stringify(report, null, 2));
console.log('\n=== Final Report ===');
console.log(JSON.stringify(report, null, 2));
