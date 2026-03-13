import fs from 'fs';
import path from 'path';

const TRANSCRIPTS_DIR = 'C:/Users/hyunj/studyeng/public/transcripts';
const RESULTS_DIR = 'C:/Users/hyunj/studyeng/src/data/reseg-results';

const VIDEO_IDS = [
  'e6Funs6yyEw', 'E6LpBIwGyA4', 'e7dfCs0z5Eg', 'e7t4pTNZshA',
  'E8k7P_6-joY', 'E8WaFvwtphY', 'e9HXmMnUEdE', 'E9L-0x92vXk',
  'EApCLbgAE5E', 'eazNXtXuohc', 'eBG7P-K-r1Y', 'eBS7QW9d100',
  'eBz7iUJu9UM', 'eBzduwzZH-w', 'ecF1y2bI2T4', 'ECjYsWLgy3I',
  'eCKRI2wEw7I', 'eD0oskR19oE', 'Ed4ylzr4CKI', 'eEJWtAMnAlA',
  'efMQRfmrlA0', 'eIho2S0ZahI', 'eiyfwZVAzGw', 'EjW7WzozgI0',
  'eKq8rtjLxqU', 'eKUlOEHu7Uc', 'eKz5Hida8n4', 'ekzHIouo8Q4',
  'eLbE_05rS1A', 'ELZNClmKX1E', 'emGzPmmMA3o', 'en37fxk4ccM',
  'eNvUS-6PTbs', 'Eobm6s5ASVE', 'Eo-KmOd3i7s', 'eoL7khWduNI'
];

const ABBREVIATIONS = /(?:Dr|Mr|Mrs|Ms|U\.S|St|Jr|Sr|Prof|Inc|Corp|Ltd|Ave|Blvd|vs|etc|approx|dept|govt|vol|no|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\./gi;

function isMusic(en) {
  const t = en.trim();
  return /^[♪\s\[\(]*(music|♪)[♪\s\]\)]*$/i.test(t) || /^♪+$/.test(t);
}

function maskAbbreviations(text) {
  return text.replace(ABBREVIATIONS, (m) => m.replace(/\./g, '\x00'));
}

function unmaskAbbreviations(text) {
  return text.replace(/\x00/g, '.');
}

function splitAtSentenceBoundaries(en) {
  const masked = maskAbbreviations(en);
  const parts = [];
  let current = '';

  for (let i = 0; i < masked.length; i++) {
    current += masked[i];
    if ((masked[i] === '.' || masked[i] === '!' || masked[i] === '?') &&
        (i + 1 >= masked.length || masked[i + 1] === ' ' || masked[i + 1] === '"' || masked[i + 1] === "'")) {
      let nextNonSpace = i + 1;
      while (nextNonSpace < masked.length && masked[nextNonSpace] === ' ') nextNonSpace++;
      if (nextNonSpace >= masked.length ||
          (masked[nextNonSpace] >= 'A' && masked[nextNonSpace] <= 'Z') ||
          masked[nextNonSpace] === '"' || masked[nextNonSpace] === "'") {
        parts.push(unmaskAbbreviations(current.trim()));
        current = '';
      }
    }
  }
  if (current.trim()) parts.push(unmaskAbbreviations(current.trim()));
  return parts.filter(p => p.length > 0);
}

function findClauseBoundary(en) {
  const clausePattern = /,\s+(and|but|because|which|so|or|when|if|although|where|while|since|though|as|before|after|until|unless|that)\b/gi;
  const matches = [...en.matchAll(clausePattern)];
  if (matches.length === 0) return null;

  const mid = en.length / 2;
  let bestMatch = matches[0];
  let bestDist = Math.abs(matches[0].index - mid);
  for (const m of matches) {
    const dist = Math.abs(m.index - mid);
    if (dist < bestDist) {
      bestDist = dist;
      bestMatch = m;
    }
  }
  return bestMatch.index + 1;
}

function splitTimingProportional(start, end, parts) {
  const totalChars = parts.reduce((sum, p) => sum + p.length, 0);
  const totalDuration = end - start;
  const result = [];
  let currentStart = start;

  for (let i = 0; i < parts.length; i++) {
    const proportion = parts[i].length / totalChars;
    const duration = totalDuration * proportion;
    const partEnd = i === parts.length - 1 ? end : Math.round((currentStart + duration) * 100) / 100;
    result.push({ start: Math.round(currentStart * 100) / 100, end: partEnd });
    currentStart = partEnd;
  }
  return result;
}

function splitKorean(ko, enParts) {
  if (!ko || enParts.length <= 1) return enParts.map(() => ko || '');

  const koParts = ko.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);

  if (koParts.length === enParts.length) {
    return koParts;
  }

  const result = [ko];
  for (let i = 1; i < enParts.length; i++) {
    result.push('');
  }
  return result;
}

function splitKoreanForGroups(ko, groups) {
  if (!ko || groups.length <= 1) return groups.map(() => ko || '');

  const koParts = ko.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);

  if (koParts.length === groups.length) {
    return koParts;
  }

  const result = [ko];
  for (let i = 1; i < groups.length; i++) {
    result.push('');
  }
  return result;
}

// Group sentences into segments where each is >= 1.5s
function groupSentencesForMinDuration(sentences, timings, minDur) {
  if (sentences.length <= 1) return null;

  // Build groups greedily from left, merging short ones to the right
  let groups = [];
  let curTexts = [sentences[0]];
  let curStart = timings[0].start;

  for (let j = 1; j < sentences.length; j++) {
    const curEnd = timings[j - 1].end;
    const curDur = curEnd - curStart;
    const nextDur = timings[j].end - timings[j].start;

    if (curDur >= minDur && nextDur >= minDur) {
      // Current group is long enough and next can stand alone
      groups.push({ text: curTexts.join(' '), start: curStart, end: curEnd });
      curTexts = [sentences[j]];
      curStart = timings[j].start;
    } else if (curDur >= minDur && nextDur < minDur) {
      // Next sentence is too short, merge it into current group
      curTexts.push(sentences[j]);
    } else {
      // Current group not long enough yet, keep building
      curTexts.push(sentences[j]);
    }
  }
  // Finalize last group
  groups.push({ text: curTexts.join(' '), start: curStart, end: timings[timings.length - 1].end });

  // Verify all groups are >= minDur
  let valid = true;
  for (const g of groups) {
    if ((g.end - g.start) < minDur) {
      valid = false;
      break;
    }
  }

  // If not valid or only 1 group, try reverse direction
  if (!valid || groups.length <= 1) {
    groups = [];
    curTexts = [sentences[sentences.length - 1]];
    let curEnd = timings[sentences.length - 1].end;

    for (let j = sentences.length - 2; j >= 0; j--) {
      const jStart = timings[j].start;
      const rightDur = curEnd - timings[j + 1].start;
      const thisDur = timings[j].end - timings[j].start;

      if (rightDur >= minDur && thisDur >= minDur) {
        groups.unshift({ text: curTexts.join(' '), start: timings[j + 1].start, end: curEnd });
        curTexts = [sentences[j]];
        curEnd = timings[j].end;
      } else {
        curTexts.unshift(sentences[j]);
      }
    }
    groups.unshift({ text: curTexts.join(' '), start: timings[0].start, end: groups.length > 0 ? groups[0].start : timings[timings.length - 1].end });

    // Fix: remove empty groups from unshift logic
    if (groups.length > 1 && groups[0].end === groups[1].start && groups[0].text === '') {
      groups.shift();
    }

    // Re-verify
    valid = groups.every(g => (g.end - g.start) >= minDur) && groups.length > 1;
    if (!valid) return null;
  }

  return groups.length > 1 ? groups : null;
}

function processFile(videoId) {
  const filePath = path.join(TRANSCRIPTS_DIR, `${videoId}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const segsBefore = data.length;
  let splits = 0;
  let merges = 0;
  let dupsRemoved = 0;

  // Step 1: Remove consecutive duplicate en segments
  let deduped = [];
  for (let i = 0; i < data.length; i++) {
    if (i > 0 && data[i].en.trim() === data[i - 1].en.trim()) {
      dupsRemoved++;
      continue;
    }
    deduped.push({ ...data[i] });
  }

  // Step 2: Process splits and merges
  let processed = [];

  for (let i = 0; i < deduped.length; i++) {
    const seg = deduped[i];
    const en = seg.en.trim();
    const duration = Math.round((seg.end - seg.start) * 100) / 100;

    // Case H: Music - skip (keep as is)
    if (isMusic(en)) {
      processed.push(seg);
      continue;
    }

    // Case G: Fragment <= 2 words and < 1.5s -> merge
    const wordCount = en.split(/\s+/).length;
    if (wordCount <= 2 && duration < 1.5) {
      // Try merge with previous if previous doesn't end with sentence-ending punctuation
      // and gap is small (< 2s)
      if (processed.length > 0 && !isMusic(processed[processed.length - 1].en)) {
        const prev = processed[processed.length - 1];
        const prevEn = prev.en.trim();
        const gapToPrev = seg.start - prev.end;
        if (!prevEn.match(/[.!?]$/) && gapToPrev < 2) {
          prev.en = prevEn + ' ' + en;
          prev.end = seg.end;
          if (seg.ko && prev.ko) {
            prev.ko = prev.ko.trim() + ' ' + seg.ko.trim();
          }
          merges++;
          continue;
        }
      }
      // Try merge with next if gap is small (< 2s)
      if (i + 1 < deduped.length && !isMusic(deduped[i + 1].en)) {
        const gapToNext = deduped[i + 1].start - seg.end;
        if (gapToNext < 2) {
          deduped[i + 1].en = en + ' ' + deduped[i + 1].en.trim();
          deduped[i + 1].start = seg.start;
          if (seg.ko && deduped[i + 1].ko) {
            deduped[i + 1].ko = seg.ko.trim() + ' ' + deduped[i + 1].ko.trim();
          }
          merges++;
          continue;
        }
      }
      processed.push(seg);
      continue;
    }

    // Count sentences
    const sentences = splitAtSentenceBoundaries(en);

    // Case A: Multi-sentence > 3s -> split per sentence
    if (sentences.length > 1 && duration > 3) {
      const timings = splitTimingProportional(seg.start, seg.end, sentences);
      const allAboveMin = timings.every(t => (t.end - t.start) >= 1.5);

      if (allAboveMin) {
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

      // Try grouping sentences into min-duration groups
      const groups = groupSentencesForMinDuration(sentences, timings, 1.5);
      if (groups && groups.length > 1) {
        const koParts = splitKoreanForGroups(seg.ko, groups);
        for (let j = 0; j < groups.length; j++) {
          processed.push({
            start: groups[j].start,
            end: groups[j].end,
            en: groups[j].text,
            ko: koParts[j] || ''
          });
        }
        splits += groups.length - 1;
        continue;
      }
      // Can't split, keep as is
      processed.push(seg);
      continue;
    }

    // Case B: Multi-sentence <= 3s -> keep
    if (sentences.length > 1 && duration <= 3) {
      processed.push(seg);
      continue;
    }

    // Case C: Single sentence > 8s -> split at clause boundary
    if (sentences.length <= 1 && duration > 8) {
      const boundaryIdx = findClauseBoundary(en);
      if (boundaryIdx !== null) {
        const part1 = en.substring(0, boundaryIdx).trim();
        const part2 = en.substring(boundaryIdx).trim().replace(/^,\s*/, '');
        const parts = [part1 + ',', part2];
        const timings = splitTimingProportional(seg.start, seg.end, parts);

        if ((timings[0].end - timings[0].start) >= 3 && (timings[1].end - timings[1].start) >= 3) {
          const koParts = splitKorean(seg.ko, parts);
          for (let j = 0; j < parts.length; j++) {
            processed.push({
              start: timings[j].start,
              end: timings[j].end,
              en: parts[j],
              ko: koParts[j] || ''
            });
          }
          splits += 1;
          continue;
        }
      }
      processed.push(seg);
      continue;
    }

    // Case D: Single sentence 5-8s -> split only if >= 6s AND clear clause
    if (sentences.length <= 1 && duration >= 5 && duration <= 8) {
      if (duration >= 6) {
        const boundaryIdx = findClauseBoundary(en);
        if (boundaryIdx !== null) {
          const part1 = en.substring(0, boundaryIdx).trim();
          const part2 = en.substring(boundaryIdx).trim().replace(/^,\s*/, '');
          const parts = [part1 + ',', part2];
          const timings = splitTimingProportional(seg.start, seg.end, parts);

          if ((timings[0].end - timings[0].start) >= 3 && (timings[1].end - timings[1].start) >= 3) {
            const koParts = splitKorean(seg.ko, parts);
            for (let j = 0; j < parts.length; j++) {
              processed.push({
                start: timings[j].start,
                end: timings[j].end,
                en: parts[j],
                ko: koParts[j] || ''
              });
            }
            splits += 1;
            continue;
          }
        }
      }
      processed.push(seg);
      continue;
    }

    // Case E/F: < 5s -> no change
    processed.push(seg);
  }

  const segsAfter = processed.length;
  const changed = splits > 0 || merges > 0 || dupsRemoved > 0;

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(processed, null, 2) + '\n');
  }

  return { splits, merges, dupsRemoved, segsBefore, segsAfter, changed };
}

// Main execution
const report = {
  batch: '15',
  filesProcessed: VIDEO_IDS.length,
  filesChanged: 0,
  totalSplits: 0,
  totalMerges: 0,
  totalDupsRemoved: 0,
  details: {}
};

for (const vid of VIDEO_IDS) {
  try {
    const result = processFile(vid);
    if (result.changed) {
      report.filesChanged++;
      report.totalSplits += result.splits;
      report.totalMerges += result.merges;
      report.totalDupsRemoved += result.dupsRemoved;
      report.details[vid] = {
        splits: result.splits,
        merges: result.merges,
        dupsRemoved: result.dupsRemoved,
        segsBefore: result.segsBefore,
        segsAfter: result.segsAfter
      };
    }
    console.log(`${vid}: splits=${result.splits}, merges=${result.merges}, dups=${result.dupsRemoved}, segs=${result.segsBefore}->${result.segsAfter}`);
  } catch (e) {
    console.error(`Error processing ${vid}: ${e.message}`);
  }
}

fs.writeFileSync(path.join(RESULTS_DIR, 'batch-15.json'), JSON.stringify(report, null, 2) + '\n');
console.log('\n=== BATCH 15 SUMMARY ===');
console.log(`Files processed: ${report.filesProcessed}`);
console.log(`Files changed: ${report.filesChanged}`);
console.log(`Total splits: ${report.totalSplits}`);
console.log(`Total merges: ${report.totalMerges}`);
console.log(`Total dups removed: ${report.totalDupsRemoved}`);
