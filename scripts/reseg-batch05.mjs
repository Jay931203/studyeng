import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = 'C:/Users/hyunj/studyeng';
const TRANSCRIPTS_DIR = join(ROOT, 'public/transcripts');
const RESULTS_DIR = join(ROOT, 'src/data/reseg-results');

const VIDEO_IDS = [
  '-4sU_AhRPY0', '4ts6Ep_KarE', '4V3NOuVctrs', '4v54LRmRpZA', '4WfIbTfpGGc',
  '4Y1iErgBrDQ', '4yAQcKhv_5k', '4ZK8Z8hulFg', '4zKU_HS6npw', '4zTCd-k--7A',
  '5_XhWGU_Mg8', '52SG2-g54X4', '56fngopihOo', '5AARjANyhgk', '5dkxJVljyaA',
  '5E0M6Rh9qpg', '5GL9JoH4Sws', '5JD6ejmlpa8', '5kllNkZv82U', '5Kqg31MaysQ',
  '5M1ZKPCLb4I', '5pXU5xUiSmc', '5Q1NV57XMzM', '5s6y4r-xamk', '5TBbuIanjrI',
  '5ufGLwOPv5M', '5VjTswqyHdA', '5v-Na8Xpwzg', '5Ww5v_CYXBw', '5X-Mrc2l1d0',
  '5ZeiL-WqZIA', '60ItHLz5WEA', '61UL0bKRzhI', '66LnhtnSoKc', '687AZbbH-Jw',
  '6bnWHRULK-M'
];

// Abbreviation patterns that are NOT sentence boundaries
const ABBREVIATIONS = /(?:Dr|Mr|Mrs|Ms|U\.S|St|vs|etc|Jr|Sr|Prof|Inc|Ltd|Corp|Vol|No|Fig)\./g;

// Music/effects patterns
const MUSIC_PATTERN = /^[\s]*[♪♫🎵\[\(]*(music|applause|laughter|cheering|singing|instrumental|♪|♫)[\]\)]*[\s]*$/i;

function isMusic(en) {
  if (!en) return false;
  const trimmed = en.trim();
  return MUSIC_PATTERN.test(trimmed) || /^[♪♫\s]+$/.test(trimmed);
}

function isSongLyrics(segments) {
  // Heuristic: if most segments lack sentence-ending punctuation, it's likely lyrics
  let noPunctCount = 0;
  for (const seg of segments) {
    const en = seg.en.trim();
    if (!/[.?!]$/.test(en)) noPunctCount++;
  }
  return noPunctCount / segments.length > 0.7;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Protect abbreviations by replacing them temporarily
function protectAbbreviations(text) {
  let result = text;
  const replacements = [];
  let idx = 0;
  // Replace known abbreviations with placeholders
  result = result.replace(/\b(Dr|Mr|Mrs|Ms|Jr|Sr|Prof|Inc|Ltd|Corp|Vol|No|Fig|St|vs|etc)\./g, (match, p1, offset) => {
    const placeholder = `\x00ABR${idx}\x00`;
    replacements.push({ placeholder, original: match });
    idx++;
    return placeholder;
  });
  // Also protect "U.S." pattern
  result = result.replace(/U\.S\./g, () => {
    const placeholder = `\x00ABR${idx}\x00`;
    replacements.push({ placeholder, original: 'U.S.' });
    idx++;
    return placeholder;
  });
  return { text: result, replacements };
}

function restoreAbbreviations(text, replacements) {
  let result = text;
  for (const { placeholder, original } of replacements) {
    result = result.split(placeholder).join(original);
  }
  return result;
}

// Detect sentence boundaries in English text
// Returns array of sentences
function splitSentences(en) {
  const { text: protected_, replacements } = protectAbbreviations(en);

  // Split at [.?!] followed by space and capital letter, or [.?!] at end
  const sentences = [];
  let current = '';

  for (let i = 0; i < protected_.length; i++) {
    current += protected_[i];

    if (/[.?!]/.test(protected_[i])) {
      // Check if this is followed by space+capital or end of string
      const remaining = protected_.substring(i + 1);
      if (remaining.length === 0 || /^\s+[A-Z]/.test(remaining)) {
        sentences.push(restoreAbbreviations(current.trim(), replacements));
        current = '';
        // Skip the space
        if (remaining.length > 0 && /^\s+/.test(remaining)) {
          const spaceMatch = remaining.match(/^(\s+)/);
          if (spaceMatch) {
            i += spaceMatch[1].length;
          }
        }
      }
    }
  }

  if (current.trim()) {
    sentences.push(restoreAbbreviations(current.trim(), replacements));
  }

  return sentences.filter(s => s.length > 0);
}

// Split Korean text at sentence boundaries
function splitKorean(ko, enSentences, enFull) {
  if (!ko || enSentences.length <= 1) return [ko];

  // Try splitting Korean by sentence-ending punctuation
  const koParts = ko.split(/(?<=[.?!。])\s+/).filter(s => s.trim().length > 0);

  if (koParts.length === enSentences.length) {
    return koParts;
  }

  // If we can't split cleanly, put full ko in first, empty for rest
  const result = [ko];
  for (let i = 1; i < enSentences.length; i++) {
    result.push('');
  }
  return result;
}

// Clause boundary patterns for splitting long segments
const CLAUSE_BOUNDARIES = [
  ', and ', ', but ', ', because ', ', which ', ', so ',
  ', or ', ', when ', ', if ', ', although ', ', while ',
  ', since ', ', though ', ', where ', ', before ', ', after '
];

function findClauseBoundary(en) {
  for (const boundary of CLAUSE_BOUNDARIES) {
    const idx = en.indexOf(boundary);
    if (idx > 0) {
      return { index: idx, boundary };
    }
  }
  return null;
}

function splitAtClause(seg) {
  const en = seg.en;
  const duration = seg.end - seg.start;

  const cb = findClauseBoundary(en);
  if (!cb) return null;

  const part1En = en.substring(0, cb.index + 1); // include the comma
  const part2En = en.substring(cb.index + cb.boundary.length).trim();
  const conjWord = cb.boundary.trim().replace(/^,\s*/, '');
  const part2EnFull = conjWord.charAt(0).toUpperCase() + conjWord.slice(1) + ' ' + part2En;

  // Actually keep the conjunction with part2 naturally
  const split1En = en.substring(0, cb.index + 1).trim(); // "..., "
  const split2En = en.substring(cb.index + 2).trim(); // "and ..."

  const totalChars = en.length;
  const ratio1 = split1En.length / totalChars;
  const ratio2 = split2En.length / totalChars;

  const dur1 = round2(seg.start + duration * ratio1);
  const dur2 = round2(seg.end);

  const t1Duration = dur1 - seg.start;
  const t2Duration = seg.end - dur1;

  // Only split if each part >= 3s
  if (t1Duration < 3 || t2Duration < 3) return null;

  // Split Korean
  const koParts = splitKoreanAtClause(seg.ko, ratio1);

  return [
    { start: seg.start, end: dur1, en: split1En, ko: koParts[0] },
    { start: dur1, end: seg.end, en: split2En, ko: koParts[1] }
  ];
}

function splitKoreanAtClause(ko, ratio) {
  if (!ko) return [ko, ''];

  // Try splitting at Korean comma or similar boundary
  const commaIdx = ko.indexOf(',');
  if (commaIdx > 0 && commaIdx < ko.length - 1) {
    return [ko.substring(0, commaIdx + 1).trim(), ko.substring(commaIdx + 1).trim()];
  }

  // Put full ko in first segment
  return [ko, ''];
}

function processTranscript(videoId) {
  const filePath = join(TRANSCRIPTS_DIR, `${videoId}.json`);

  if (!existsSync(filePath)) {
    console.log(`  SKIP: ${videoId} - file not found`);
    return null;
  }

  let segments;
  try {
    segments = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.log(`  SKIP: ${videoId} - invalid JSON`);
    return null;
  }

  if (!Array.isArray(segments) || segments.length === 0) {
    console.log(`  SKIP: ${videoId} - empty or invalid`);
    return null;
  }

  const segsBefore = segments.length;
  const isLyrics = isSongLyrics(segments);

  let splits = 0;
  let merges = 0;
  let dupsRemoved = 0;

  // Pass 1: Remove consecutive duplicate en segments
  let deduped = [];
  for (let i = 0; i < segments.length; i++) {
    if (i > 0 && segments[i].en.trim() === segments[i - 1].en.trim()) {
      dupsRemoved++;
      // Extend previous segment's end time
      deduped[deduped.length - 1].end = segments[i].end;
      continue;
    }
    deduped.push({ ...segments[i] });
  }

  // Pass 2: Skip music/effects
  deduped = deduped.filter(seg => !isMusic(seg.en));

  // If song lyrics, skip further processing (Case I)
  if (isLyrics) {
    if (dupsRemoved === 0 && deduped.length === segsBefore) {
      return null; // no changes
    }

    writeFileSync(filePath, JSON.stringify(deduped, null, 2));
    return {
      splits, merges, dupsRemoved,
      segsBefore, segsAfter: deduped.length
    };
  }

  // Pass 3: Split multi-sentence segments (Case A)
  let processed = [];
  for (const seg of deduped) {
    const duration = seg.end - seg.start;
    const sentences = splitSentences(seg.en);

    if (sentences.length >= 2 && duration > 3) {
      // Case A: Multi-sentence, > 3s - SPLIT
      const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
      const koParts = splitKorean(seg.ko, sentences, seg.en);

      let currentStart = seg.start;
      const newSegs = [];

      for (let i = 0; i < sentences.length; i++) {
        const charRatio = sentences[i].length / totalChars;
        const segDuration = duration * charRatio;
        let segEnd = i === sentences.length - 1 ? seg.end : round2(currentStart + segDuration);

        // Check if resulting segment would be < 1.5s
        const thisDur = segEnd - currentStart;

        newSegs.push({
          start: round2(currentStart),
          end: round2(segEnd),
          en: sentences[i],
          ko: koParts[i] || ''
        });

        currentStart = segEnd;
      }

      // Merge any segments < 1.5s with neighbors
      const merged = [];
      for (let i = 0; i < newSegs.length; i++) {
        const dur = newSegs[i].end - newSegs[i].start;
        if (dur < 1.5 && merged.length > 0) {
          // Merge with previous
          const prev = merged[merged.length - 1];
          prev.end = newSegs[i].end;
          prev.en = prev.en + ' ' + newSegs[i].en;
          if (newSegs[i].ko) {
            prev.ko = prev.ko ? prev.ko + ' ' + newSegs[i].ko : newSegs[i].ko;
          }
        } else if (dur < 1.5 && i < newSegs.length - 1) {
          // Merge with next
          newSegs[i + 1].start = newSegs[i].start;
          newSegs[i + 1].en = newSegs[i].en + ' ' + newSegs[i + 1].en;
          if (newSegs[i].ko) {
            newSegs[i + 1].ko = newSegs[i].ko + (newSegs[i + 1].ko ? ' ' + newSegs[i + 1].ko : '');
          }
        } else {
          merged.push(newSegs[i]);
        }
      }

      if (merged.length > 1) {
        splits += merged.length - 1;
        processed.push(...merged);
      } else {
        processed.push(...merged);
      }
    } else {
      // Case B or single sentence
      processed.push(seg);
    }
  }

  // Pass 4: Split long single sentences (Cases C, D)
  let processed2 = [];
  for (const seg of processed) {
    const duration = seg.end - seg.start;
    const sentences = splitSentences(seg.en);

    if (sentences.length === 1) {
      if (duration > 8) {
        // Case C: Single sentence > 8s - split at clause
        const result = splitAtClause(seg);
        if (result) {
          splits += result.length - 1;
          processed2.push(...result);
          continue;
        }
      } else if (duration >= 6 && duration <= 8) {
        // Case D: 6-8s with clear clause boundary
        const result = splitAtClause(seg);
        if (result) {
          splits += result.length - 1;
          processed2.push(...result);
          continue;
        }
      }
    }
    processed2.push(seg);
  }

  // Pass 5: Merge fragments (Case G)
  let processed3 = [];
  for (let i = 0; i < processed2.length; i++) {
    const seg = processed2[i];
    const duration = seg.end - seg.start;
    const wordCount = seg.en.trim().split(/\s+/).length;

    if (wordCount <= 2 && duration < 1.5) {
      // Case G: Fragment
      if (processed3.length > 0) {
        const prev = processed3[processed3.length - 1];
        if (!/[.?!]$/.test(prev.en.trim())) {
          // Merge with previous
          prev.end = seg.end;
          prev.en = prev.en + ' ' + seg.en;
          if (seg.ko) {
            prev.ko = prev.ko ? prev.ko + ' ' + seg.ko : seg.ko;
          }
          merges++;
          continue;
        } else if (i < processed2.length - 1) {
          // Merge with next
          processed2[i + 1].start = seg.start;
          processed2[i + 1].en = seg.en + ' ' + processed2[i + 1].en;
          if (seg.ko) {
            processed2[i + 1].ko = seg.ko + (processed2[i + 1].ko ? ' ' + processed2[i + 1].ko : '');
          }
          merges++;
          continue;
        }
      } else if (i < processed2.length - 1) {
        // No previous, merge with next
        processed2[i + 1].start = seg.start;
        processed2[i + 1].en = seg.en + ' ' + processed2[i + 1].en;
        if (seg.ko) {
          processed2[i + 1].ko = seg.ko + (processed2[i + 1].ko ? ' ' + processed2[i + 1].ko : '');
        }
        merges++;
        continue;
      }
    }
    processed3.push(seg);
  }

  const segsAfter = processed3.length;

  if (splits === 0 && merges === 0 && dupsRemoved === 0 && segsAfter === segsBefore) {
    return null; // no changes
  }

  // Write the modified file
  writeFileSync(filePath, JSON.stringify(processed3, null, 2));

  return {
    splits, merges, dupsRemoved,
    segsBefore, segsAfter
  };
}

// Main
console.log('=== Resegmentation Batch 05 ===');
console.log(`Processing ${VIDEO_IDS.length} files...\n`);

const report = {
  batch: '05',
  filesProcessed: VIDEO_IDS.length,
  filesChanged: 0,
  totalSplits: 0,
  totalMerges: 0,
  totalDupsRemoved: 0,
  details: {}
};

for (const videoId of VIDEO_IDS) {
  console.log(`Processing: ${videoId}`);
  const result = processTranscript(videoId);

  if (result) {
    report.filesChanged++;
    report.totalSplits += result.splits;
    report.totalMerges += result.merges;
    report.totalDupsRemoved += result.dupsRemoved;
    report.details[videoId] = result;
    console.log(`  Changed: splits=${result.splits}, merges=${result.merges}, dupsRemoved=${result.dupsRemoved}, ${result.segsBefore} -> ${result.segsAfter} segs`);
  } else {
    console.log('  No changes needed');
  }
}

console.log(`\n=== Summary ===`);
console.log(`Files processed: ${report.filesProcessed}`);
console.log(`Files changed: ${report.filesChanged}`);
console.log(`Total splits: ${report.totalSplits}`);
console.log(`Total merges: ${report.totalMerges}`);
console.log(`Total dups removed: ${report.totalDupsRemoved}`);

// Write report
if (!existsSync(RESULTS_DIR)) {
  mkdirSync(RESULTS_DIR, { recursive: true });
}
writeFileSync(join(RESULTS_DIR, 'batch-05.json'), JSON.stringify(report, null, 2));
console.log(`\nReport written to src/data/reseg-results/batch-05.json`);
