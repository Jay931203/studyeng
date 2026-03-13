import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const TRANSCRIPTS_DIR = 'C:/Users/hyunj/studyeng/public/transcripts';
const RESULTS_DIR = 'C:/Users/hyunj/studyeng/src/data/reseg-results';

const VIDEO_IDS = [
  'VaT7IYQgyqo','vcWehsxBLzs','vetKTtM7YyU','VG78fq6KAPA','vhhgI4tSMwc',
  'VHZI9_we5GQ','VKnNUYknsuQ','VLgvY9gZIEk','VNJN1aV8YWI','VqWIZGbtZAk',
  'VsYmwBOYfW8','Vu9gzndeCLM','vvLZ2t5cm0Y','vVPT0JT1dOw','vx2u5uUu3DE',
  'Vxc_9jNeGkc','vxRqPmvGlUY','vYn4DtIOKFg','vyvu1nWjOlI','w-oGpGf03Ag',
  'w1AhrEhQ0mg','w323iXW02G4','w4sOfI2CTSE','W5-9mVvPcGs','W8_POt2KlfQ',
  'WaaANll8h18','wbftlDzIALA','wbIXmB2ZLmA','wcW8SvbnJYE','wD2cVhC-63I',
  'WDt_k3ovjFo','WEgCvKdwNtA','wElbSFWgseA','weU76DGHKU0','whCJ4NLUSB8',
  'wi5Q3rlQaMI','wIrUoTYd9hA','wizgxRBfVTY','wk4d7JWn4oA','WKVxKrrbz1E'
];

function splitSentences(text) {
  let processed = text;
  const abbrevRegex = /\b(Dr|Mr|Mrs|Ms|St|Jr|Sr|vs|etc|Prof|Inc|Ltd|Corp|Gen|Gov|Sgt|Capt|Lt|Col|Maj|Rev|Hon)\.\s/gi;
  processed = processed.replace(abbrevRegex, (m, abbr) => abbr + '@@DOT@@ ');
  processed = processed.replace(/U\.S\.\s/g, 'U@@DOT@@S@@DOT@@ ');

  const parts = [];
  let current = '';

  for (let i = 0; i < processed.length; i++) {
    current += processed[i];

    if ((processed[i] === '.' || processed[i] === '!' || processed[i] === '?') &&
        i + 1 < processed.length) {
      let nextIdx = i + 1;

      if (nextIdx < processed.length && (processed[nextIdx] === '"' || processed[nextIdx] === "'")) {
        current += processed[nextIdx];
        nextIdx++;
      }

      if (nextIdx < processed.length && processed[nextIdx] === ' ') {
        let afterSpace = nextIdx + 1;
        if (afterSpace < processed.length && (processed[afterSpace] === '"' || processed[afterSpace] === "'")) {
          afterSpace++;
        }
        if (afterSpace < processed.length && /[A-Z]/.test(processed[afterSpace])) {
          parts.push(current.trim());
          current = '';
          i = nextIdx;
        }
      }
    }
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts.map(p => p.replace(/@@DOT@@/g, '.'));
}

function splitKoreanSentences(text) {
  const parts = [];
  let current = '';

  for (let i = 0; i < text.length; i++) {
    current += text[i];

    if ((text[i] === '.' || text[i] === '!' || text[i] === '?') &&
        i + 1 < text.length && text[i + 1] === ' ' && i + 2 < text.length) {
      parts.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) {
    parts.push(current.trim());
  }
  return parts;
}

function isMusic(en) {
  return /^[\s\-]*\u266a/.test(en) || en.includes('[music]') || en.includes('[applause]');
}

function validateGroups(groups, totalChars, duration) {
  for (const group of groups) {
    const text = group.join(' ');
    const dur = (text.length / totalChars) * duration;
    if (dur < 1.0) return false;
  }
  return true;
}

function buildGroups(sentences, duration) {
  const totalChars = sentences.reduce((s, t) => s + t.length, 0);

  // Strategy 1: each sentence individually (if all >= 1.0s)
  let groups = sentences.map(s => [s]);
  if (validateGroups(groups, totalChars, duration) && groups.length > 1) {
    return groups;
  }

  // Strategy 2: greedy grouping - accumulate until >= 1.5s, then close
  groups = [];
  let tempGroup = [];
  let tempChars = 0;

  for (let i = 0; i < sentences.length; i++) {
    tempGroup.push(sentences[i]);
    tempChars += sentences[i].length;

    const groupDuration = (tempChars / totalChars) * duration;
    const remainingChars = totalChars - tempChars;
    const remainingDuration = (remainingChars / totalChars) * duration;
    const remainingSentences = sentences.length - i - 1;

    if (groupDuration >= 1.5 && remainingSentences > 0 && remainingDuration >= 1.5) {
      groups.push([...tempGroup]);
      tempGroup = [];
      tempChars = 0;
    }
  }

  if (tempGroup.length > 0) {
    const leftoverChars = tempGroup.reduce((s, t) => s + t.length, 0);
    const leftoverDuration = (leftoverChars / totalChars) * duration;

    if (leftoverDuration < 1.0 && groups.length > 0) {
      groups[groups.length - 1].push(...tempGroup);
    } else {
      groups.push(tempGroup);
    }
  }

  if (groups.length > 1 && validateGroups(groups, totalChars, duration)) {
    return groups;
  }

  // Strategy 3: try splitting into 2 balanced halves
  const halfChars = totalChars / 2;
  let bestSplit = -1;
  let bestDiff = Infinity;
  let cumChars = 0;

  for (let i = 0; i < sentences.length - 1; i++) {
    cumChars += sentences[i].length;
    const diff = Math.abs(cumChars - halfChars);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSplit = i;
    }
  }

  if (bestSplit >= 0) {
    const g1 = sentences.slice(0, bestSplit + 1);
    const g2 = sentences.slice(bestSplit + 1);
    groups = [g1, g2];
    if (validateGroups(groups, totalChars, duration)) {
      return groups;
    }
  }

  // Strategy 4: try splitting into 3 equal parts
  if (sentences.length >= 3) {
    const thirdChars = totalChars / 3;
    let splitPoints = [];
    cumChars = 0;
    let target = thirdChars;

    for (let i = 0; i < sentences.length - 1; i++) {
      cumChars += sentences[i].length;
      if (cumChars >= target && splitPoints.length < 2) {
        splitPoints.push(i);
        target = thirdChars * (splitPoints.length + 1);
      }
    }

    if (splitPoints.length === 2) {
      const g1 = sentences.slice(0, splitPoints[0] + 1);
      const g2 = sentences.slice(splitPoints[0] + 1, splitPoints[1] + 1);
      const g3 = sentences.slice(splitPoints[1] + 1);
      if (g1.length > 0 && g2.length > 0 && g3.length > 0) {
        groups = [g1, g2, g3];
        if (validateGroups(groups, totalChars, duration)) {
          return groups;
        }
      }
    }
  }

  return null;
}

function processSegment(seg) {
  const { start, end, en, ko } = seg;
  const duration = Math.round((end - start) * 10) / 10;

  if (isMusic(en)) return [seg];

  const sentences = splitSentences(en);

  if (sentences.length < 2) return [seg];

  if (duration <= 3) return [seg];

  const groups = buildGroups(sentences, duration);
  if (!groups || groups.length <= 1) return [seg];

  const totalChars = en.length;

  const koSentences = splitKoreanSentences(ko);
  let koGroups;

  const totalEnSentences = groups.reduce((s, g) => s + g.length, 0);

  if (koSentences.length === totalEnSentences) {
    koGroups = [];
    let koIdx = 0;
    for (const group of groups) {
      const koGroup = [];
      for (let i = 0; i < group.length; i++) {
        if (koIdx < koSentences.length) {
          koGroup.push(koSentences[koIdx]);
          koIdx++;
        }
      }
      koGroups.push(koGroup.join(' '));
    }
  } else if (koSentences.length >= groups.length) {
    koGroups = [];
    let koIdx = 0;
    const koPerGroup = Math.floor(koSentences.length / groups.length);
    const extra = koSentences.length % groups.length;

    for (let g = 0; g < groups.length; g++) {
      const count = koPerGroup + (g < extra ? 1 : 0);
      const koSlice = koSentences.slice(koIdx, koIdx + count);
      koGroups.push(koSlice.join(' '));
      koIdx += count;
    }
  } else {
    koGroups = [ko];
    for (let i = 1; i < groups.length; i++) {
      koGroups.push('');
    }
  }

  const result = [];
  let currentStart = start;
  const groupTexts = groups.map(g => g.join(' '));
  const totalGroupChars = groupTexts.reduce((s, t) => s + t.length, 0);

  for (let i = 0; i < groups.length; i++) {
    const groupDuration = (groupTexts[i].length / totalGroupChars) * duration;
    const groupEnd = i === groups.length - 1
      ? end
      : Math.round((currentStart + groupDuration) * 10) / 10;

    result.push({
      start: Math.round(currentStart * 10) / 10,
      end: groupEnd,
      en: groupTexts[i],
      ko: koGroups[i] || ''
    });

    currentStart = groupEnd;
  }

  return result;
}

// Main processing
mkdirSync(RESULTS_DIR, { recursive: true });

const details = {};
let totalFilesChanged = 0;
let totalSplits = 0;

for (const videoId of VIDEO_IDS) {
  const filePath = join(TRANSCRIPTS_DIR, `${videoId}.json`);
  let data;
  try {
    data = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`Error reading ${videoId}: ${e.message}`);
    continue;
  }
  const segsBefore = data.length;

  const newData = [];
  let fileSplits = 0;

  for (const seg of data) {
    const result = processSegment(seg);
    if (result.length > 1) {
      fileSplits++;
    }
    newData.push(...result);
  }

  if (fileSplits > 0) {
    writeFileSync(filePath, JSON.stringify(newData, null, 2));
    totalFilesChanged++;
    totalSplits += fileSplits;
    details[videoId] = {
      splits: fileSplits,
      segsBefore: segsBefore,
      segsAfter: newData.length
    };
    console.log(`${videoId}: ${fileSplits} splits (${segsBefore} -> ${newData.length} segs)`);
  } else {
    console.log(`${videoId}: no changes`);
  }
}

const report = {
  batch: '17',
  filesProcessed: VIDEO_IDS.length,
  filesChanged: totalFilesChanged,
  totalSplits: totalSplits,
  details: details
};

writeFileSync(join(RESULTS_DIR, 'fix2-batch-17.json'), JSON.stringify(report, null, 2));
console.log(`\nDone. ${totalFilesChanged} files changed, ${totalSplits} total splits.`);
