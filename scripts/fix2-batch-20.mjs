#!/usr/bin/env node
// fix2-batch-20.mjs — Split multi-sentence segments >3s in 31 transcript files
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const TRANSCRIPTS = join(ROOT, 'public', 'transcripts');
const REPORT_DIR = join(ROOT, 'src', 'data', 'reseg-results');

const FILE_IDS = [
  'zKZMCuppTeo','ZL_kpirn61I','ZNn6J56J5HE','znQictYvlLs','ZoEUYdsrJpw',
  'zp-eEVkKh60','ZPGBceVfV60','zqZFzzp0IR8','ZQ_6VUs2VCk','ZRWeZzN9nmQ',
  'Zspzm01_Q20','zSRvmHSgaBg','ZU3Xban0Y6A','zVb1S977b9Q','zVeJ5F26uiM',
  'zvtUrjfnSnA','Zw2wNTbZE7k','ZW8zvaTRuGo','zXCBtGJV2C0','ZxTVQ8oEAVM',
  '_-0J49_9lwc','_21fDo5s0BU','_JZom_gVfuw','_mAycORmun8','_nTpsv9PNqo',
  '_OmdF290gOg','_oygxA1aaRU','_qTZRD1_ybQ','_RchONkTtQ0','_royauacHzU',
  '_rW-RHdqy9E'
];

// Abbreviations that should NOT be treated as sentence boundaries
const ABBREV_RE = /(?:Dr|Mr|Mrs|Ms|St|U\.S|Jr|Sr)$/;

/**
 * Find sentence boundaries: .!? followed by space + uppercase letter
 * But skip abbreviations.
 */
function findSentenceBoundaries(text) {
  const boundaries = [];
  // Match .!? followed by space(s) and an uppercase letter
  const re = /([.!?])\s+(?=[A-Z])/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const endPos = m.index + m[1].length; // position right after the punctuation
    // Check if this is an abbreviation
    const before = text.slice(0, endPos);
    if (ABBREV_RE.test(before)) continue;
    boundaries.push(endPos);
  }
  return boundaries;
}

/**
 * Split English text into sentence groups at given boundaries.
 */
function splitAtBoundaries(text, boundaries) {
  if (boundaries.length === 0) return [text];
  const parts = [];
  let prev = 0;
  for (const b of boundaries) {
    // Find the start of whitespace after punctuation
    let wsEnd = b;
    while (wsEnd < text.length && text[wsEnd] === ' ') wsEnd++;
    parts.push(text.slice(prev, b).trim());
    prev = wsEnd;
  }
  parts.push(text.slice(prev).trim());
  return parts.filter(p => p.length > 0);
}

/**
 * Try to split Korean text at matching sentence boundary count.
 * Korean sentence boundaries: . ! ? 다. 요. 야. 지. 어. 해. etc.
 */
function splitKorean(ko, enParts) {
  if (!ko || enParts.length <= 1) return enParts.map((_, i) => i === 0 ? ko : '');

  const targetParts = enParts.length;

  // Find Korean sentence boundaries: punctuation (.!?) optionally after Korean chars
  const koBoundaries = [];
  const koRe = /([.!?])\s+/g;
  let m;
  while ((m = koRe.exec(ko)) !== null) {
    koBoundaries.push(m.index + m[1].length);
  }

  if (koBoundaries.length >= targetParts - 1) {
    // We have enough Korean boundaries - use first (targetParts-1) boundaries
    const useBounds = koBoundaries.slice(0, targetParts - 1);
    const koParts = [];
    let prev = 0;
    for (const b of useBounds) {
      let wsEnd = b;
      while (wsEnd < ko.length && ko[wsEnd] === ' ') wsEnd++;
      koParts.push(ko.slice(prev, b).trim());
      prev = wsEnd;
    }
    koParts.push(ko.slice(prev).trim());
    return koParts.filter((_, i) => i < targetParts).concat(
      Array(Math.max(0, targetParts - koParts.length)).fill('')
    );
  }

  // Not enough Korean boundaries - put full ko on first part, '' for rest
  const result = [ko];
  for (let i = 1; i < targetParts; i++) result.push('');
  return result;
}

/**
 * Group small parts so each group >= 1.5s, respecting min 1.0s.
 * enParts: string[], totalDur: number
 * Returns grouped indices arrays.
 */
function groupParts(enParts, totalDur) {
  const totalChars = enParts.reduce((s, p) => s + p.length, 0);
  if (totalChars === 0) return [enParts.map((_, i) => i)];

  // Calculate proportional durations
  const durations = enParts.map(p => (p.length / totalChars) * totalDur);

  // Group from left: accumulate until >= 1.5s
  const groups = [];
  let currentGroup = [0];
  let currentDur = durations[0];

  for (let i = 1; i < enParts.length; i++) {
    if (currentDur >= 1.5) {
      groups.push(currentGroup);
      currentGroup = [i];
      currentDur = durations[i];
    } else {
      currentGroup.push(i);
      currentDur += durations[i];
    }
  }
  groups.push(currentGroup);

  // Merge last group if it's too short (< 1.0s)
  if (groups.length > 1) {
    const lastGroup = groups[groups.length - 1];
    const lastDur = lastGroup.reduce((s, i) => s + durations[i], 0);
    if (lastDur < 1.0) {
      const prev = groups[groups.length - 2];
      groups[groups.length - 2] = prev.concat(lastGroup);
      groups.pop();
    }
  }

  return groups;
}

function isMusic(text) {
  return /^\[.*\]$/.test(text.trim()) || /^♪/.test(text.trim()) || /♪$/.test(text.trim());
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function processFile(fileId) {
  const filePath = join(TRANSCRIPTS, `${fileId}.json`);
  if (!existsSync(filePath)) return null;

  const segs = JSON.parse(readFileSync(filePath, 'utf8'));
  const segsBefore = segs.length;
  let splitCount = 0;
  const newSegs = [];

  for (const seg of segs) {
    const dur = round1(seg.end - seg.start);
    const en = seg.en || '';

    // Skip: duration <= 3s, music/effects
    if (dur <= 3 || isMusic(en)) {
      newSegs.push(seg);
      continue;
    }

    // Find sentence boundaries
    const boundaries = findSentenceBoundaries(en);
    if (boundaries.length === 0) {
      // Single sentence or no valid boundaries
      newSegs.push(seg);
      continue;
    }

    // Split English
    const enParts = splitAtBoundaries(en, boundaries);
    if (enParts.length <= 1) {
      newSegs.push(seg);
      continue;
    }

    // Group short parts so each >= 1.5s
    const groups = groupParts(enParts, dur);
    if (groups.length <= 1) {
      newSegs.push(seg);
      continue;
    }

    // Merge grouped English parts
    const groupedEn = groups.map(g => g.map(i => enParts[i]).join(' '));

    // Split Korean
    const koParts = splitKorean(seg.ko, enParts);
    // Regroup Korean to match English groups
    const groupedKo = groups.map(g => g.map(i => koParts[i]).filter(k => k).join(' '));

    // Calculate timing proportionally
    const totalChars = groupedEn.reduce((s, p) => s + p.length, 0);
    let currentStart = seg.start;

    for (let i = 0; i < groupedEn.length; i++) {
      const fraction = groupedEn[i].length / totalChars;
      const partDur = fraction * dur;
      const partEnd = i === groupedEn.length - 1
        ? seg.end
        : round1(currentStart + partDur);

      newSegs.push({
        start: round1(currentStart),
        end: round1(partEnd),
        en: groupedEn[i],
        ko: groupedKo[i] || ''
      });

      currentStart = partEnd;
    }

    splitCount += groupedEn.length - 1;
  }

  if (splitCount > 0) {
    writeFileSync(filePath, JSON.stringify(newSegs, null, 2));
  }

  return {
    splits: splitCount,
    segsBefore,
    segsAfter: newSegs.length
  };
}

// Main
const report = {
  batch: '20',
  filesProcessed: FILE_IDS.length,
  filesChanged: 0,
  totalSplits: 0,
  details: {}
};

for (const id of FILE_IDS) {
  const result = processFile(id);
  if (!result) {
    console.log(`SKIP ${id} — file not found`);
    continue;
  }
  if (result.splits > 0) {
    report.filesChanged++;
    report.totalSplits += result.splits;
    report.details[id] = result;
    console.log(`SPLIT ${id}: ${result.splits} splits (${result.segsBefore} → ${result.segsAfter} segs)`);
  } else {
    console.log(`OK ${id} — no multi-sentence segments >3s`);
  }
}

writeFileSync(join(REPORT_DIR, 'fix2-batch-20.json'), JSON.stringify(report, null, 2));
console.log(`\nDone: ${report.filesChanged}/${report.filesProcessed} files changed, ${report.totalSplits} total splits`);
console.log(`Report: src/data/reseg-results/fix2-batch-20.json`);
