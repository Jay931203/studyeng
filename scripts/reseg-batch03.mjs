import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = 'C:/Users/hyunj/studyeng';
const TRANSCRIPTS_DIR = join(ROOT, 'public/transcripts');
const OUTPUT_DIR = join(ROOT, 'src/data/reseg-results');

const VIDEO_IDS = [
  '2ONo4fpnhII', '2PjZAeiU7uM', '2Q466ZPyNAo', '2RB3edZyeYw', '2RT9rjWu0Ws',
  '2RXZj-OUAtI', '2swCX5-GE9E', '2Szzj6XN6pA', '2TAfvMn8_EQ', '2tM1LFFxeKg',
  '2Tpb1XyqGOQ', '2Vv-BfVoq4g', '2XKg3lsfxGU', '31N_HM2f9Ks', '389nJrZjK1w',
  '38FMDG7tiA4', '39O3PNrVO8A', '3bQXPUQqn9Y', '3bReJswiMGM', '3bXDzwaMxk8',
  '3cEg2HCl50I', '3cX8KLOb0w8', '3F8oJh3J1T0', '3fbhVPnhX-4', '3HKOHxHDoGI',
  '3iAiWIytqdw', '3ik6EwMNvXg', '3JWTaaS7LdU', '3mCN6dh16eU', '3MP5qHvuHE0',
  '3mZj5N-zKRA', '3nc6Tf26afI', '3O5oEY1vL1I', '3PmmZwuPObQ', '3q0mxPLg39I',
  '3Q9l8nI0xtA'
];

// Abbreviations that should NOT be treated as sentence boundaries
const ABBREVIATIONS = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'U.S.', 'St.', 'Jr.', 'Sr.', 'Prof.', 'etc.', 'vs.', 'Inc.', 'Ltd.', 'Corp.', 'Ave.', 'Blvd.', 'Dept.', 'Est.', 'Vol.', 'No.', 'Fig.', 'e.g.', 'i.e.'];

// Music/effects detection
function isMusicOrEffects(en) {
  const trimmed = en.trim();
  return trimmed.startsWith('\u266a') || trimmed.startsWith('[music') ||
         trimmed.startsWith('[Music') || trimmed.startsWith('[applause') ||
         trimmed.startsWith('[Applause') || trimmed.startsWith('[laughter') ||
         trimmed.startsWith('[Laughter') || /^\[.*\]$/.test(trimmed) ||
         /^\u266a/.test(trimmed);
}

// Protect abbreviations by replacing them temporarily
function protectAbbreviations(text) {
  let protected_ = text;
  const replacements = [];
  for (const abbr of ABBREVIATIONS) {
    const escaped = abbr.replace(/\./g, '\\.');
    const regex = new RegExp(escaped.replace(/\\/g, '\\\\').replace(/\./g, '\\.'), 'g');
    // Actually let's do simple replacement
    let idx = 0;
    while ((idx = protected_.indexOf(abbr, idx)) !== -1) {
      const placeholder = `__ABBR${replacements.length}__`;
      replacements.push({ placeholder, original: abbr });
      protected_ = protected_.substring(0, idx) + placeholder + protected_.substring(idx + abbr.length);
      idx += placeholder.length;
    }
  }
  return { text: protected_, replacements };
}

function restoreAbbreviations(text, replacements) {
  let restored = text;
  for (const { placeholder, original } of replacements) {
    restored = restored.replace(placeholder, original);
  }
  return restored;
}

// Find sentence boundaries in English text
// Returns array of split points (indices where one sentence ends and next begins)
function findSentenceBoundaries(en) {
  const { text, replacements } = protectAbbreviations(en);

  // Pattern: sentence-ending punctuation followed by space and capital letter
  const boundaries = [];
  const regex = /([.!?])\s+([A-Z])/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    // The boundary is right after the punctuation mark, before the space
    const splitPoint = match.index + match[1].length;
    boundaries.push(splitPoint);
  }

  // Now map boundaries back to original text positions
  // We need to account for placeholder length differences
  // Actually, let's work with original text directly but skip abbreviations

  // Redo: work with original text, but check each potential boundary
  const origBoundaries = [];
  const origRegex = /([.!?])\s+([A-Z])/g;
  let origMatch;
  while ((origMatch = origRegex.exec(en)) !== null) {
    const dotPos = origMatch.index;
    const punctChar = origMatch[1];

    // Check if this period is part of an abbreviation
    let isAbbr = false;
    for (const abbr of ABBREVIATIONS) {
      // Check if the text ending at dotPos+1 matches an abbreviation
      const abbrLen = abbr.length;
      const startCheck = dotPos + 1 - abbrLen;
      if (startCheck >= 0) {
        const candidate = en.substring(startCheck, dotPos + 1);
        if (candidate === abbr) {
          isAbbr = true;
          break;
        }
      }
    }

    if (!isAbbr) {
      origBoundaries.push(origMatch.index + origMatch[1].length);
    }
  }

  return origBoundaries;
}

// Split English text at boundary positions into sentences
function splitAtBoundaries(text, boundaries) {
  if (boundaries.length === 0) return [text];

  const parts = [];
  let lastIdx = 0;
  for (const boundary of boundaries) {
    parts.push(text.substring(lastIdx, boundary).trim());
    lastIdx = boundary;
  }
  parts.push(text.substring(lastIdx).trim());
  return parts.filter(p => p.length > 0);
}

// Find clause boundaries for long single sentences
function findClauseBoundary(en) {
  // Look for ", and" / ", but" / ", because" / ", which" / ", so" / ", or" / ", when" / ", if" / ", although"
  const clausePatterns = [', and ', ', but ', ', because ', ', which ', ', so ', ', or ', ', when ', ', if ', ', although ', ', while ', ', since ', ', though ', ', where '];

  let bestPos = -1;
  const midpoint = en.length / 2;
  let bestDist = Infinity;

  for (const pattern of clausePatterns) {
    let idx = en.indexOf(pattern);
    while (idx !== -1) {
      // Split position is right after the comma+space (keep comma with first part)
      const splitAt = idx + 2; // after ", "
      const dist = Math.abs(splitAt - midpoint);
      if (dist < bestDist) {
        bestDist = dist;
        bestPos = idx + 2; // split after ", " -- actually we want to split so first part gets ", " and second part starts with "and "
      }
      idx = en.indexOf(pattern, idx + 1);
    }
  }

  return bestPos; // position of the space before the conjunction
}

// Split Korean text to match English sentence splits
function splitKorean(ko, enParts) {
  if (!ko || enParts.length <= 1) return [ko || ''];

  const numParts = enParts.length;

  // Try to split Korean by sentence-ending punctuation
  const koSentences = ko.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);

  if (koSentences.length === numParts) {
    return koSentences.map(s => s.trim());
  }

  // Try splitting by periods specifically
  const koPeriodSplit = ko.split(/(?<=\.)\s+/).filter(s => s.trim().length > 0);
  if (koPeriodSplit.length === numParts) {
    return koPeriodSplit.map(s => s.trim());
  }

  // Cannot cleanly split - put all in first, empty for rest
  const result = [ko];
  for (let i = 1; i < numParts; i++) {
    result.push('');
  }
  return result;
}

// Round to 2 decimal places
function round2(n) {
  return Math.round(n * 100) / 100;
}

// Distribute time proportionally by character count
function distributeTime(start, end, parts) {
  const totalDuration = end - start;
  const totalChars = parts.reduce((sum, p) => sum + p.length, 0);

  if (totalChars === 0) {
    // Equal distribution
    const segDur = totalDuration / parts.length;
    return parts.map((_, i) => ({
      start: round2(start + i * segDur),
      end: round2(start + (i + 1) * segDur)
    }));
  }

  const times = [];
  let currentStart = start;
  for (let i = 0; i < parts.length; i++) {
    const charRatio = parts[i].length / totalChars;
    const segDuration = totalDuration * charRatio;
    const segEnd = (i === parts.length - 1) ? end : round2(currentStart + segDuration);
    times.push({ start: round2(currentStart), end: segEnd });
    currentStart = segEnd;
  }
  return times;
}

// Process a single transcript
function processTranscript(segments) {
  let result = [];
  let splits = 0;
  let merges = 0;
  let dupsRemoved = 0;

  // First pass: splits
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const duration = seg.end - seg.start;
    const en = (seg.en || '').trim();
    const ko = (seg.ko || '').trim();

    // Case H: Music/effects - skip (keep as is)
    if (isMusicOrEffects(en)) {
      result.push({ ...seg });
      continue;
    }

    // Find sentence boundaries
    const boundaries = findSentenceBoundaries(en);
    const numSentences = boundaries.length + 1;

    if (numSentences >= 2) {
      // Multi-sentence segment
      if (duration > 3) {
        // Case A: Split into separate segments per sentence
        const enParts = splitAtBoundaries(en, boundaries);

        // Check if any split would be too short (< 1.5s)
        const times = distributeTime(seg.start, seg.end, enParts);
        const allLongEnough = times.every(t => (t.end - t.start) >= 1.5);

        if (allLongEnough && enParts.length > 1) {
          const koParts = splitKorean(ko, enParts);
          for (let j = 0; j < enParts.length; j++) {
            result.push({
              start: times[j].start,
              end: times[j].end,
              en: enParts[j],
              ko: koParts[j] || ''
            });
          }
          splits += enParts.length - 1;
        } else {
          // Some segments would be too short, try grouping short ones
          // Simple approach: keep short adjacent ones together
          let grouped = [];
          let currentGroup = { parts: [enParts[0]], koParts: [ko ? splitKorean(ko, enParts)[0] : ''], timeStart: times[0].start, timeEnd: times[0].end };

          for (let j = 1; j < enParts.length; j++) {
            const prevDur = currentGroup.timeEnd - currentGroup.timeStart;
            const thisDur = times[j].end - times[j].start;

            if (thisDur < 1.5 || prevDur < 1.5) {
              // Merge with current group
              currentGroup.parts.push(enParts[j]);
              currentGroup.timeEnd = times[j].end;
            } else {
              grouped.push(currentGroup);
              const kp = splitKorean(ko, enParts);
              currentGroup = { parts: [enParts[j]], koParts: [kp[j] || ''], timeStart: times[j].start, timeEnd: times[j].end };
            }
          }
          grouped.push(currentGroup);

          if (grouped.length > 1) {
            const kp = splitKorean(ko, enParts);
            let koIdx = 0;
            for (const group of grouped) {
              const groupEn = group.parts.join(' ');
              const groupKoParts = [];
              for (let k = 0; k < group.parts.length; k++) {
                if (kp[koIdx]) groupKoParts.push(kp[koIdx]);
                koIdx++;
              }
              result.push({
                start: round2(group.timeStart),
                end: round2(group.timeEnd),
                en: groupEn,
                ko: groupKoParts.join(' ').trim() || ''
              });
            }
            splits += grouped.length - 1;
          } else {
            result.push({ ...seg });
          }
        }
      } else {
        // Case B: duration <= 3s, keep as is
        result.push({ ...seg });
      }
    } else {
      // Single sentence
      if (duration > 8) {
        // Case C: Try split at clause boundary
        const clausePos = findClauseBoundary(en);
        if (clausePos > 0) {
          const part1 = en.substring(0, clausePos).trim();
          const part2 = en.substring(clausePos).trim();
          const times = distributeTime(seg.start, seg.end, [part1, part2]);

          // Only split if each part >= 3 seconds
          if ((times[0].end - times[0].start) >= 3 && (times[1].end - times[1].start) >= 3) {
            const koParts = splitKorean(ko, [part1, part2]);
            result.push({ start: times[0].start, end: times[0].end, en: part1, ko: koParts[0] });
            result.push({ start: times[1].start, end: times[1].end, en: part2, ko: koParts[1] || '' });
            splits++;
          } else {
            result.push({ ...seg });
          }
        } else {
          result.push({ ...seg });
        }
      } else if (duration >= 5 && duration <= 8) {
        // Case D: Only split if duration >= 6s AND clear clause boundary
        if (duration >= 6) {
          const clausePos = findClauseBoundary(en);
          if (clausePos > 0) {
            const part1 = en.substring(0, clausePos).trim();
            const part2 = en.substring(clausePos).trim();
            const times = distributeTime(seg.start, seg.end, [part1, part2]);

            if ((times[0].end - times[0].start) >= 3 && (times[1].end - times[1].start) >= 3) {
              const koParts = splitKorean(ko, [part1, part2]);
              result.push({ start: times[0].start, end: times[0].end, en: part1, ko: koParts[0] });
              result.push({ start: times[1].start, end: times[1].end, en: part2, ko: koParts[1] || '' });
              splits++;
            } else {
              result.push({ ...seg });
            }
          } else {
            result.push({ ...seg });
          }
        } else {
          result.push({ ...seg });
        }
      } else {
        // Case E/F: < 5 seconds, keep as is
        result.push({ ...seg });
      }
    }
  }

  // Second pass: merge fragments (Case G)
  let merged = [];
  for (let i = 0; i < result.length; i++) {
    const seg = result[i];
    const en = (seg.en || '').trim();
    const wordCount = en.split(/\s+/).filter(w => w.length > 0).length;
    const duration = seg.end - seg.start;

    if (isMusicOrEffects(en)) {
      merged.push(seg);
      continue;
    }

    if (wordCount <= 2 && duration < 1.5) {
      // Fragment - merge with adjacent
      if (merged.length > 0) {
        const prev = merged[merged.length - 1];
        const prevEn = (prev.en || '').trim();
        // If previous doesn't end with sentence punctuation, merge with previous
        if (!/[.!?]$/.test(prevEn)) {
          prev.end = seg.end;
          prev.en = (prev.en + ' ' + seg.en).trim();
          prev.ko = (prev.ko + ' ' + (seg.ko || '')).trim();
          merges++;
          continue;
        }
      }
      // Otherwise merge with next if available
      if (i + 1 < result.length) {
        const next = result[i + 1];
        next.start = seg.start;
        next.en = (seg.en + ' ' + next.en).trim();
        next.ko = ((seg.ko || '') + ' ' + (next.ko || '')).trim();
        merges++;
        continue;
      }
      // No adjacent to merge with, keep as is
      merged.push(seg);
    } else {
      merged.push(seg);
    }
  }

  // Third pass: remove consecutive duplicates
  let deduped = [];
  for (let i = 0; i < merged.length; i++) {
    if (i > 0 && merged[i].en.trim() === merged[i - 1].en.trim()) {
      dupsRemoved++;
      continue;
    }
    deduped.push(merged[i]);
  }

  return { segments: deduped, splits, merges, dupsRemoved };
}

// Main
function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let totalSplits = 0;
  let totalMerges = 0;
  let totalDupsRemoved = 0;
  let filesChanged = 0;
  const details = {};

  for (const videoId of VIDEO_IDS) {
    const filePath = join(TRANSCRIPTS_DIR, `${videoId}.json`);

    try {
      const raw = readFileSync(filePath, 'utf-8');
      const segments = JSON.parse(raw);
      const segsBefore = segments.length;

      const result = processTranscript(segments);
      const segsAfter = result.segments.length;

      const changed = result.splits > 0 || result.merges > 0 || result.dupsRemoved > 0;

      if (changed) {
        writeFileSync(filePath, JSON.stringify(result.segments, null, 2) + '\n', 'utf-8');
        filesChanged++;
        details[videoId] = {
          splits: result.splits,
          merges: result.merges,
          dupsRemoved: result.dupsRemoved,
          segsBefore,
          segsAfter
        };
        console.log(`[CHANGED] ${videoId}: splits=${result.splits}, merges=${result.merges}, dups=${result.dupsRemoved}, segs: ${segsBefore} -> ${segsAfter}`);
      } else {
        console.log(`[OK] ${videoId}: no changes needed`);
      }

      totalSplits += result.splits;
      totalMerges += result.merges;
      totalDupsRemoved += result.dupsRemoved;
    } catch (err) {
      console.error(`[ERROR] ${videoId}: ${err.message}`);
    }
  }

  const report = {
    batch: '03',
    filesProcessed: VIDEO_IDS.length,
    filesChanged,
    totalSplits,
    totalMerges,
    totalDupsRemoved,
    details
  };

  const reportPath = join(OUTPUT_DIR, 'batch-03.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf-8');

  console.log('\n=== SUMMARY ===');
  console.log(`Files processed: ${VIDEO_IDS.length}`);
  console.log(`Files changed: ${filesChanged}`);
  console.log(`Total splits: ${totalSplits}`);
  console.log(`Total merges: ${totalMerges}`);
  console.log(`Total dups removed: ${totalDupsRemoved}`);
  console.log(`Report written to: ${reportPath}`);
}

main();
