#!/usr/bin/env node
/**
 * Batch 07 Resegmentation Script
 * Processes 36 transcript files applying subtitle segmentation rules.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TRANSCRIPTS_DIR = join(process.cwd(), 'public', 'transcripts');
const REPORT_PATH = join(process.cwd(), 'src', 'data', 'reseg-results', 'batch-07.json');

const VIDEO_IDS = [
  '7-MfQB2jqJs', '7NjNOAncIlI', '-7OE6bDfM2M', '7OFROViP0J0', '7Q-hsgdJCME',
  '7wRHBLwpASw', '7wtfhZwyrcc', '7xMAO-eBNOE', '7Y01uy-Q1d8', '7yDmGnA8Hw0',
  '7ysdRn5YLTw', '7ZH0oeDv4Es', '7ZVWIELHQQY', '87JAqBTXk3M', '8aDGKxN1nLo',
  '8DajVKAkL50', '8dM5QYdTo08', '8fT-l0YYLHI', '8gcRTMr-rlg', '8gfipuaIA68',
  '8hjB6UJ2kMU', '-8Jan7r4wDs', '8pDY_9u5Sn0', '8QvfWEb7pDo', '8S0FDjFBj8o',
  '8SxE_NfUX6w', '8VNTTzQMK48', '8vyLqZYwPL8', '8WYHDfJDPDc', '8XNaPX6MKlU',
  '8yNdvL2FTDQ', '8zBAw3_AXe8', '8zfNfilNOIE', '90Y92lQOmEI', '983bBbJx0Mk',
  '9BJUGcy22mY'
];

function isMusicOrEffect(en) {
  const cleaned = en.replace(/[♪\-\s>]/g, '').trim();
  if (cleaned === '' || cleaned === 'M' || cleaned === 'MM') return true;
  if (/^\[?(music|applause|laughter|cheering|singing|instrumental)\]?$/i.test(cleaned)) return true;
  if (/^♪/.test(en.trim()) && en.trim().replace(/[♪\s]/g, '') === '') return true;
  return false;
}

function findSentenceBoundaries(en) {
  const abbrevMatches = [];
  let m;
  const abbrRegex = /\b(?:Dr|Mr|Mrs|Ms|Jr|Sr|Prof|Gen|Gov|Sgt|Cpl|Pvt|Lt|Col|Maj|Capt|Rev|Hon|Pres|etc|vs|Vol|Inc|Corp|Ltd|Bros|St|U\.S)\./gi;
  while ((m = abbrRegex.exec(en)) !== null) {
    abbrevMatches.push({ index: m.index, length: m[0].length });
  }
  const boundaries = [];
  const punctRegex = /[.?!]\s+(?=[A-Z])/g;
  while ((m = punctRegex.exec(en)) !== null) {
    let isAbbrev = false;
    for (const ab of abbrevMatches) {
      if (m.index >= ab.index && m.index < ab.index + ab.length) { isAbbrev = true; break; }
    }
    if (!isAbbrev) boundaries.push(m.index + 1);
  }
  return boundaries;
}

function splitAtBoundaries(text, boundaries) {
  if (boundaries.length === 0) return [text];
  const parts = [];
  let prev = 0;
  for (const b of boundaries) { parts.push(text.substring(prev, b).trim()); prev = b; }
  parts.push(text.substring(prev).trim());
  return parts.filter(p => p.length > 0);
}

const CLAUSE_PATTERNS = [', and ', ', but ', ', because ', ', which ', ', so ', ', or ', ', when ', ', if ', ', although ', ', while ', ', since ', ', though '];

function findClauseBoundary(en) {
  let bestIdx = -1;
  const mid = en.length / 2;
  let bestDist = Infinity;
  for (const pat of CLAUSE_PATTERNS) {
    let idx = en.indexOf(pat);
    while (idx !== -1) {
      const dist = Math.abs(idx - mid);
      if (dist < bestDist) { bestDist = dist; bestIdx = idx; }
      idx = en.indexOf(pat, idx + 1);
    }
  }
  if (bestIdx === -1) return null;
  return { index: bestIdx + 1 };
}

function splitTiming(start, end, parts) {
  const totalDuration = end - start;
  const totalChars = parts.reduce((sum, p) => sum + p.length, 0);
  if (totalChars === 0) return parts.map(() => ({ start, end }));
  const result = [];
  let currentStart = start;
  for (let i = 0; i < parts.length; i++) {
    const fraction = parts[i].length / totalChars;
    const dur = totalDuration * fraction;
    const segEnd = i === parts.length - 1 ? end : round2(currentStart + dur);
    result.push({ start: round2(currentStart), end: segEnd });
    currentStart = segEnd;
  }
  return result;
}

function round2(n) { return Math.round(n * 100) / 100; }

function splitKorean(ko, enParts) {
  if (!ko || enParts.length <= 1) return enParts.map(() => ko || '');
  const koBoundaries = [];
  const koSentenceEnd = /[.?!。]\s*/g;
  let km;
  while ((km = koSentenceEnd.exec(ko)) !== null) {
    if (km.index + km[0].length < ko.length) koBoundaries.push(km.index + km[0].length);
  }
  if (koBoundaries.length >= enParts.length - 1) {
    const koParts = [];
    let prev = 0;
    for (let i = 0; i < enParts.length - 1 && i < koBoundaries.length; i++) {
      koParts.push(ko.substring(prev, koBoundaries[i]).trim()); prev = koBoundaries[i];
    }
    koParts.push(ko.substring(prev).trim());
    return koParts;
  }
  const result = [ko];
  for (let i = 1; i < enParts.length; i++) result.push('');
  return result;
}

function performClauseSplit(seg, en) {
  const clause = findClauseBoundary(en);
  if (!clause) return null;
  const part1 = en.substring(0, clause.index).trim();
  const part2 = en.substring(clause.index).trim();
  const part2Clean = part2.replace(/^,\s*/, '').trim();
  const enParts = [part1.endsWith(',') ? part1 : part1 + ',', part2Clean];
  const timings = splitTiming(seg.start, seg.end, enParts);
  const d1 = round2(timings[0].end - timings[0].start);
  const d2 = round2(timings[1].end - timings[1].start);
  if (d1 >= 3 && d2 >= 3) {
    const koParts = splitKorean(seg.ko, enParts);
    return { enParts, timings, koParts };
  }
  return null;
}

function endsWithoutTerminal(en) {
  const trimmed = en.trim();
  if (trimmed.length === 0) return false;
  if (/[.?!]$/.test(trimmed) || /\.{3}$/.test(trimmed)) return false;
  return true;
}

/** Apply sentence split and clause split rules to a single segment.
 *  Returns array of resulting segments and split count. */
function applySplitRules(seg) {
  const duration = round2(seg.end - seg.start);
  const en = seg.en;
  const boundaries = findSentenceBoundaries(en);
  const sentenceCount = boundaries.length + 1;

  if (sentenceCount >= 2 && duration > 3) {
    // Case A: Multi-sentence > 3s -> SPLIT
    const enParts = splitAtBoundaries(en, boundaries);
    const timings = splitTiming(seg.start, seg.end, enParts);
    const koParts = splitKorean(seg.ko, enParts);
    let allOk = true;
    for (const t of timings) {
      if (round2(t.end - t.start) < 1.5) { allOk = false; break; }
    }
    if (allOk && enParts.length > 1) {
      const out = [];
      for (let j = 0; j < enParts.length; j++) {
        out.push({ start: timings[j].start, end: timings[j].end, en: enParts[j], ko: koParts[j] });
      }
      return { segments: out, splitCount: enParts.length - 1 };
    }
  }

  // Case C: Single sentence > 8s -> clause split
  if (sentenceCount === 1 && duration > 8) {
    const sr = performClauseSplit(seg, en);
    if (sr) {
      const out = [];
      for (let j = 0; j < sr.enParts.length; j++) {
        out.push({ start: sr.timings[j].start, end: sr.timings[j].end, en: sr.enParts[j], ko: sr.koParts[j] });
      }
      return { segments: out, splitCount: 1 };
    }
  }

  // Case D: Single sentence 6-8s with clause
  if (sentenceCount === 1 && duration >= 6 && duration <= 8) {
    const sr = performClauseSplit(seg, en);
    if (sr) {
      const out = [];
      for (let j = 0; j < sr.enParts.length; j++) {
        out.push({ start: sr.timings[j].start, end: sr.timings[j].end, en: sr.enParts[j], ko: sr.koParts[j] });
      }
      return { segments: out, splitCount: 1 };
    }
  }

  return { segments: [seg], splitCount: 0 };
}

function processTranscript(segments) {
  let splits = 0;
  let merges = 0;
  let dupsRemoved = 0;
  const segsBefore = segments.length;

  // Step 1: Remove music/effect segments (Case H)
  let working = segments.filter(seg => !isMusicOrEffect(seg.en));

  // Clean >> prefixes
  working = working.map(seg => ({ ...seg, en: seg.en.replace(/^>>\s*/, '').trim() }));

  // Step 2: Remove consecutive duplicates
  let deduped = [];
  for (let i = 0; i < working.length; i++) {
    if (i > 0 && working[i].en === working[i - 1].en) { dupsRemoved++; continue; }
    deduped.push({ ...working[i] });
  }
  working = deduped;

  // Step 2.5: Merge cross-segment sentence fragments
  // Only when current ends without terminal punct, next starts lowercase,
  // gap < 0.5s, merged duration <= 15s
  let crossMerged = [];
  let i = 0;
  while (i < working.length) {
    const seg = { ...working[i] };
    while (i + 1 < working.length) {
      const next = working[i + 1];
      const gap = next.start - seg.end;
      const mergedDuration = next.end - seg.start;
      const nextStartsLower = /^[a-z]/.test(next.en.trim());
      if (endsWithoutTerminal(seg.en) && nextStartsLower && gap < 0.5 && mergedDuration <= 15) {
        seg.end = next.end;
        seg.en = seg.en.trim() + ' ' + next.en.trim();
        seg.ko = ((seg.ko || '') + ' ' + (next.ko || '')).trim();
        merges++;
        i++;
      } else {
        break;
      }
    }
    crossMerged.push(seg);
    i++;
  }
  working = crossMerged;

  // Step 3: Apply split rules (Case A/B/C/D/E/F) and identify fragments (Case G)
  let result = [];
  for (const seg of working) {
    const duration = round2(seg.end - seg.start);
    const en = seg.en;
    const wordCount = en.trim().split(/\s+/).length;

    // Case G: Fragment (<=2 words, <1.5s) - mark for merging
    if (wordCount <= 2 && duration < 1.5) {
      result.push({ ...seg, _fragment: true });
      continue;
    }

    const { segments: splitSegs, splitCount } = applySplitRules(seg);
    splits += splitCount;
    result.push(...splitSegs);
  }

  // Step 4: Merge fragments (Case G)
  let merged = [];
  for (let i = 0; i < result.length; i++) {
    const seg = result[i];
    if (!seg._fragment) { merged.push(seg); continue; }

    if (merged.length > 0) {
      const prev = merged[merged.length - 1];
      if (!/[.?!]$/.test(prev.en.trim())) {
        prev.end = seg.end;
        prev.en = prev.en + ' ' + seg.en;
        prev.ko = prev.ko + ' ' + seg.ko;
        merges++;
        continue;
      }
    }
    if (i + 1 < result.length) {
      const next = result[i + 1];
      next.start = seg.start;
      next.en = seg.en + ' ' + next.en;
      next.ko = seg.ko + ' ' + next.ko;
      merges++;
      continue;
    }
    delete seg._fragment;
    merged.push(seg);
  }

  // Clean _fragment flags
  merged = merged.map(seg => { const { _fragment, ...rest } = seg; return rest; });

  // Step 5: Re-apply split rules on segments that were modified by fragment merging
  // This catches cases where merging a fragment created a new multi-sentence segment
  let finalResult = [];
  for (const seg of merged) {
    const { segments: splitSegs, splitCount } = applySplitRules(seg);
    splits += splitCount;
    finalResult.push(...splitSegs);
  }

  const segsAfter = finalResult.length;
  return { segments: finalResult, splits, merges, dupsRemoved, segsBefore, segsAfter };
}

// Main
const report = {
  batch: '07',
  filesProcessed: 0,
  filesChanged: 0,
  totalSplits: 0,
  totalMerges: 0,
  totalDupsRemoved: 0,
  details: {}
};

for (const vid of VIDEO_IDS) {
  const filePath = join(TRANSCRIPTS_DIR, `${vid}.json`);
  let segments;
  try {
    segments = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`Error reading ${vid}: ${e.message}`);
    continue;
  }
  report.filesProcessed++;

  const { segments: newSegments, splits, merges, dupsRemoved, segsBefore, segsAfter } = processTranscript(segments);
  const changed = splits > 0 || merges > 0 || dupsRemoved > 0 || segsBefore !== segsAfter;

  if (changed) {
    report.filesChanged++;
    report.totalSplits += splits;
    report.totalMerges += merges;
    report.totalDupsRemoved += dupsRemoved;
    report.details[vid] = { splits, merges, dupsRemoved, segsBefore, segsAfter };
    writeFileSync(filePath, JSON.stringify(newSegments, null, 2) + '\n', 'utf-8');
    console.log(`  CHANGED ${vid}: ${segsBefore} -> ${segsAfter} segs (splits=${splits}, merges=${merges}, dups=${dupsRemoved})`);
  } else {
    console.log(`  OK ${vid}: no changes (${segsBefore} segs)`);
  }
}

writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf-8');
console.log(`\nReport written to ${REPORT_PATH}`);
console.log(`Summary: ${report.filesProcessed} processed, ${report.filesChanged} changed, ${report.totalSplits} splits, ${report.totalMerges} merges, ${report.totalDupsRemoved} dups removed`);
