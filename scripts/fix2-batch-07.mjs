import fs from 'fs';
import path from 'path';

const TRANSCRIPTS_DIR = 'C:/Users/hyunj/studyeng/public/transcripts';
const OUTPUT_PATH = 'C:/Users/hyunj/studyeng/src/data/reseg-results/fix2-batch-07.json';

const FILE_IDS = [
  'EjW7WzozgI0','eKq8rtjLxqU','eKUlOEHu7Uc','eKz5Hida8n4','Eobm6s5ASVE',
  'Es6PBea8fzM','eSfoF6MhgLA','etJ6RmMPGko','EVmLV7swH2k','ewqfpwXUCP4',
  'EXGUNvIFTQw','EZGXCDJATDs','E_z2PGmUIrE','f0rQgrt_pVk','f36vIp_d2C0',
  'f8JbMvhbvuY','FCmMs10JLw4','fDKTi-jjGCc','ffyKY3Dj5ZE','FGgGLLhbf78',
  'Fh2ePdEn_jk','FoECr2zRWQ8','fOh8YVlObf4','FQ_gVYpwI68','fR2CeheI9s0',
  'fRdQmCaaqUM','FRvxzdkj_YI','FSvNhxKJJyU','fWiVN4mtYxo','fwM3wzWEz80',
  'fwSNu6SxU-4','fYcDQ11vI0M','f_kgZFdt5B0','G-H4Qs-CCIo','G-vp0AprzrA',
  'G2lysk2YXXM','G4hXSY1JgNQ','G5XKkXVmt3k','g6o3rEInTII','g7J_RrBcchQ'
];

// Abbreviations that are NOT sentence boundaries
const ABBREVS = /(?:Dr|Mr|Mrs|Ms|St|Jr|Sr|U\.S)\.\s/;

/**
 * Split English text into sentences at ". " / "? " / "! " + uppercase,
 * but NOT at known abbreviations.
 */
function splitSentences(text) {
  // First, protect abbreviations by replacing their periods with a placeholder
  const abbrevPattern = /\b(Dr|Mr|Mrs|Ms|St|Jr|Sr)\./g;
  const usPattern = /U\.S\./g;

  let protected_ = text.replace(abbrevPattern, '$1\x00');
  protected_ = protected_.replace(usPattern, 'U\x00S\x00');

  // Split at sentence boundaries: .!? followed by space and uppercase letter
  const parts = [];
  let current = '';

  for (let i = 0; i < protected_.length; i++) {
    current += protected_[i];

    // Check if we're at a sentence boundary
    if ((protected_[i] === '.' || protected_[i] === '!' || protected_[i] === '?') &&
        i + 1 < protected_.length && protected_[i + 1] === ' ' &&
        i + 2 < protected_.length && /[A-Z]/.test(protected_[i + 2])) {
      // This is a sentence boundary - push current and start new
      parts.push(current.replace(/\x00/g, '.').trim());
      current = '';
      i++; // skip the space
    }
  }

  if (current.trim()) {
    parts.push(current.replace(/\x00/g, '.').trim());
  }

  return parts.filter(s => s.length > 0);
}

/**
 * Split Korean text to match English sentence boundaries.
 * Try to split at matching Korean sentence boundary (. or space pattern).
 */
function splitKorean(ko, enSentences) {
  if (!ko || enSentences.length <= 1) return [ko];

  // Try to split Korean at sentence-ending markers
  // Korean sentences often end with . or specific patterns
  const koSentences = ko.split(/(?<=[.?!])\s+/).filter(s => s.trim());

  if (koSentences.length === enSentences.length) {
    return koSentences;
  }

  // If counts don't match, try to distribute proportionally
  if (koSentences.length > 1 && koSentences.length >= enSentences.length) {
    // Group ko sentences to match en sentence count
    const result = [];
    const ratio = koSentences.length / enSentences.length;

    for (let i = 0; i < enSentences.length; i++) {
      const startIdx = Math.round(i * ratio);
      const endIdx = Math.round((i + 1) * ratio);
      result.push(koSentences.slice(startIdx, endIdx).join(' '));
    }
    return result;
  }

  // Fallback: full ko in first segment, empty for rest
  const result = [ko];
  for (let i = 1; i < enSentences.length; i++) {
    result.push('');
  }
  return result;
}

/**
 * Given sentence groups and total duration/start, compute timing.
 * Proportional by character count, rounded to 1 decimal, min 1.0s per group.
 */
function computeTiming(groups, segStart, segEnd) {
  const totalDur = segEnd - segStart;
  const totalChars = groups.reduce((sum, g) => sum + g.en.length, 0);

  if (totalChars === 0) {
    // Edge case: distribute evenly
    const each = totalDur / groups.length;
    let t = segStart;
    return groups.map((g, i) => {
      const start = i === 0 ? segStart : Math.round(t * 10) / 10;
      t += each;
      const end = i === groups.length - 1 ? segEnd : Math.round(t * 10) / 10;
      return { start, end };
    });
  }

  // First pass: proportional
  let rawDurations = groups.map(g => (g.en.length / totalChars) * totalDur);

  // Second pass: enforce minimum 1.0s
  let deficit = 0;
  let aboveMinCount = 0;
  for (let i = 0; i < rawDurations.length; i++) {
    if (rawDurations[i] < 1.0) {
      deficit += 1.0 - rawDurations[i];
      rawDurations[i] = 1.0;
    } else {
      aboveMinCount++;
    }
  }

  // Redistribute deficit from above-min segments
  if (deficit > 0 && aboveMinCount > 0) {
    for (let i = 0; i < rawDurations.length; i++) {
      if (rawDurations[i] > 1.0) {
        const reduction = deficit * ((rawDurations[i] - 1.0) / rawDurations.filter(d => d > 1.0).reduce((s, d) => s + d - 1.0, 0));
        rawDurations[i] -= Math.min(reduction, rawDurations[i] - 1.0);
      }
    }
  }

  // Build timing: first segment starts exactly at segStart, last ends exactly at segEnd
  // Intermediate boundaries rounded to 1 decimal but always >= segStart
  let t = segStart;
  return rawDurations.map((dur, i) => {
    const start = i === 0 ? segStart : Math.round(t * 10) / 10;
    t += dur;
    const end = i === rawDurations.length - 1 ? segEnd : Math.round(t * 10) / 10;
    return { start, end };
  });
}

/**
 * Group sentences so each group has >= 1.0s of duration.
 * If individual sentences would each get >= 1.5s, keep them individual.
 * If not, group 2-3 together so each group >= 1.0s.
 * NEVER leave 2+ sentences in one group if both sides would be >= 1.0s.
 */
function groupSentences(sentences, segStart, segEnd) {
  const totalDur = segEnd - segStart;
  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
  if (totalChars === 0) return [sentences];

  // Estimate duration per sentence
  const estDurations = sentences.map(s => (s.length / totalChars) * totalDur);

  // Check if all sentences individually get >= 1.0s (the real minimum)
  if (estDurations.every(d => d >= 1.0)) {
    // Each sentence can stand on its own
    return sentences.map(s => [s]);
  }

  // Some sentences are too short for individual segments.
  // Use greedy grouping: accumulate until >= 1.5s, then cut.
  // But always cut if current >= 1.0s and remaining >= 1.0s.
  const groups = [];
  let currentGroup = [];
  let currentDur = 0;

  for (let i = 0; i < sentences.length; i++) {
    currentGroup.push(sentences[i]);
    currentDur += estDurations[i];

    const isLast = (i === sentences.length - 1);
    const remainingDur = isLast ? 0 : estDurations.slice(i + 1).reduce((s, d) => s + d, 0);

    if (isLast) {
      // Last sentence: close the group
      if (currentGroup.length > 0) {
        // If this tail group is tiny (< 1.0s) and we have a previous group, merge back
        if (currentDur < 1.0 && groups.length > 0) {
          groups[groups.length - 1] = [...groups[groups.length - 1], ...currentGroup];
        } else {
          groups.push([...currentGroup]);
        }
      }
    } else if (currentDur >= 1.0 && remainingDur >= 1.0) {
      // Both sides viable, cut here
      groups.push([...currentGroup]);
      currentGroup = [];
      currentDur = 0;
    }
  }

  // If we ended up with only 1 group (no split happened), try harder:
  // With 2+ sentences and >3s, we MUST split into at least 2 groups.
  if (groups.length <= 1 && sentences.length >= 2 && totalDur > 3) {
    // Find the best split point: try splitting after each sentence
    let bestSplit = -1;
    let bestBalance = Infinity;

    for (let splitAfter = 0; splitAfter < sentences.length - 1; splitAfter++) {
      const leftDur = estDurations.slice(0, splitAfter + 1).reduce((s, d) => s + d, 0);
      const rightDur = estDurations.slice(splitAfter + 1).reduce((s, d) => s + d, 0);

      // Both sides must be >= 1.0s
      if (leftDur >= 1.0 && rightDur >= 1.0) {
        const balance = Math.abs(leftDur - rightDur);
        if (balance < bestBalance) {
          bestBalance = balance;
          bestSplit = splitAfter;
        }
      }
    }

    if (bestSplit >= 0) {
      const left = sentences.slice(0, bestSplit + 1);
      const right = sentences.slice(bestSplit + 1);
      // Recursively try to split each half further
      const leftGroups = groupSentences(left, segStart,
        segStart + estDurations.slice(0, bestSplit + 1).reduce((s, d) => s + d, 0));
      const rightGroups = groupSentences(right,
        segStart + estDurations.slice(0, bestSplit + 1).reduce((s, d) => s + d, 0), segEnd);
      return [...leftGroups, ...rightGroups];
    }
  }

  // Post-check: split any group with 3+ sentences and >= 3s duration
  const finalGroups = [];
  for (const group of groups) {
    if (group.length >= 3) {
      const groupChars = group.reduce((s, sent) => s + sent.length, 0);
      const groupDur = (groupChars / totalChars) * totalDur;

      if (groupDur >= 3.0) {
        // Recursively split this group
        const subStart = 0; // relative
        const subGroups = splitGroupRecursive(group, groupDur);
        finalGroups.push(...subGroups);
        continue;
      }
    }
    finalGroups.push(group);
  }

  return finalGroups.length > 0 ? finalGroups : [sentences];
}

/**
 * Recursively split a group of sentences that has >= 3s duration.
 */
function splitGroupRecursive(sentences, totalDur) {
  if (sentences.length < 2 || totalDur < 2.0) return [sentences];

  const totalChars = sentences.reduce((s, sent) => s + sent.length, 0);
  if (totalChars === 0) return [sentences];

  const estDurations = sentences.map(s => (s.length / totalChars) * totalDur);

  // Try to find a split point where both sides >= 1.0s
  let bestSplit = -1;
  let bestBalance = Infinity;

  for (let splitAfter = 0; splitAfter < sentences.length - 1; splitAfter++) {
    const leftDur = estDurations.slice(0, splitAfter + 1).reduce((s, d) => s + d, 0);
    const rightDur = estDurations.slice(splitAfter + 1).reduce((s, d) => s + d, 0);

    if (leftDur >= 1.0 && rightDur >= 1.0) {
      const balance = Math.abs(leftDur - rightDur);
      if (balance < bestBalance) {
        bestBalance = balance;
        bestSplit = splitAfter;
      }
    }
  }

  if (bestSplit < 0) return [sentences];

  const left = sentences.slice(0, bestSplit + 1);
  const right = sentences.slice(bestSplit + 1);
  const leftDur = estDurations.slice(0, bestSplit + 1).reduce((s, d) => s + d, 0);
  const rightDur = totalDur - leftDur;

  // Recursively split if still 3+ sentences
  const leftResult = left.length >= 3 && leftDur >= 3.0
    ? splitGroupRecursive(left, leftDur) : [left];
  const rightResult = right.length >= 3 && rightDur >= 3.0
    ? splitGroupRecursive(right, rightDur) : [right];

  return [...leftResult, ...rightResult];
}

/**
 * Check if segment contains music/effects markers
 */
function isMusicOrEffects(en) {
  return /^\[.*\]$/.test(en.trim()) || /^♪/.test(en.trim()) || /♪$/.test(en.trim());
}

/**
 * Process a single transcript file.
 */
function processFile(fileId) {
  const filePath = path.join(TRANSCRIPTS_DIR, `${fileId}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  let splitCount = 0;
  const segsBefore = data.length;
  const newData = [];

  for (const seg of data) {
    const dur = seg.end - seg.start;

    // Skip: <= 3s, music/effects
    if (dur <= 3 || isMusicOrEffects(seg.en)) {
      newData.push(seg);
      continue;
    }

    // Split sentences
    const sentences = splitSentences(seg.en);

    // Skip single sentence
    if (sentences.length < 2) {
      newData.push(seg);
      continue;
    }

    // Group sentences so each group >= 1.5s
    const sentGroups = groupSentences(sentences, seg.start, seg.end);

    // If only 1 group after grouping, no split needed
    if (sentGroups.length <= 1) {
      newData.push(seg);
      continue;
    }

    // Build grouped English texts
    const enGroups = sentGroups.map(g => g.join(' '));

    // Split Korean
    const koSentences = splitKoreanForGroups(seg.ko, sentences, sentGroups);

    // Compute timing
    const groupsWithEn = enGroups.map((en, i) => ({ en, ko: koSentences[i] || '' }));
    const timings = computeTiming(groupsWithEn, seg.start, seg.end);

    // Create new segments
    for (let i = 0; i < groupsWithEn.length; i++) {
      newData.push({
        start: timings[i].start,
        end: timings[i].end,
        en: groupsWithEn[i].en,
        ko: groupsWithEn[i].ko
      });
    }

    splitCount += groupsWithEn.length - 1;
  }

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');

  return {
    splits: splitCount,
    segsBefore,
    segsAfter: newData.length
  };
}

/**
 * Split Korean text to match grouped English sentences.
 */
function splitKoreanForGroups(ko, enSentences, sentGroups) {
  if (!ko || sentGroups.length <= 1) return [ko];

  // Split Korean by sentence-ending punctuation
  const koSentences = [];
  let current = '';
  const koChars = [...ko];

  for (let i = 0; i < koChars.length; i++) {
    current += koChars[i];

    if ((koChars[i] === '.' || koChars[i] === '?' || koChars[i] === '!') &&
        i + 1 < koChars.length && koChars[i + 1] === ' ') {
      koSentences.push(current.trim());
      current = '';
      i++; // skip space
    }
  }
  if (current.trim()) {
    koSentences.push(current.trim());
  }

  // If ko sentence count matches en sentence count, assign by group
  if (koSentences.length === enSentences.length) {
    const result = [];
    let koIdx = 0;
    for (const group of sentGroups) {
      const groupKo = koSentences.slice(koIdx, koIdx + group.length).join(' ');
      result.push(groupKo);
      koIdx += group.length;
    }
    return result;
  }

  // If ko sentences >= groups, distribute proportionally
  if (koSentences.length >= sentGroups.length) {
    const result = [];
    const ratio = koSentences.length / sentGroups.length;

    for (let i = 0; i < sentGroups.length; i++) {
      const startIdx = Math.round(i * ratio);
      const endIdx = Math.round((i + 1) * ratio);
      result.push(koSentences.slice(startIdx, endIdx).join(' '));
    }
    return result;
  }

  // Fallback: full ko in first, empty for rest
  const result = [ko];
  for (let i = 1; i < sentGroups.length; i++) {
    result.push('');
  }
  return result;
}

// Main
const report = {
  batch: '07',
  filesProcessed: 0,
  filesChanged: 0,
  totalSplits: 0,
  details: {}
};

for (const fileId of FILE_IDS) {
  try {
    const result = processFile(fileId);
    report.filesProcessed++;
    report.details[fileId] = result;

    if (result.splits > 0) {
      report.filesChanged++;
      report.totalSplits += result.splits;
    }

    console.log(`${fileId}: ${result.splits} splits (${result.segsBefore} -> ${result.segsAfter})`);
  } catch (err) {
    console.error(`ERROR processing ${fileId}:`, err.message);
    report.details[fileId] = { error: err.message };
  }
}

console.log(`\nTotal: ${report.filesProcessed} files, ${report.filesChanged} changed, ${report.totalSplits} splits`);

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf8');
console.log(`Report written to ${OUTPUT_PATH}`);
