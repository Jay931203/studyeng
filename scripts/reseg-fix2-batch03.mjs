import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TRANSCRIPTS_DIR = 'C:/Users/hyunj/studyeng/public/transcripts';

const videoIds = [
  '6iClgRjmTvc','6KHyMISpE18','6lCG9ScuuLA','6ovOboVwB7g','6pJC0FLA3Sk',
  '6Pkq_eBHXJ4','6pQgbEEFPq0','6TBlaUD3ma4','6tqPK8nJL2U','6U4-KZSoe6g',
  '6VF5P7qLaEQ','6W7yhe1i-sQ','6wZuNj9J4H8','6YFmnO_Z9PA','6ZZI6-zh0GM',
  '72uaaH8YWqw','7E_WeuKkJ2s','7FIQQVWNE1U','7Q-hsgdJCME','7Y01uy-Q1d8',
  '7ysdRn5YLTw','7ZH0oeDv4Es','87JAqBTXk3M','8hjB6UJ2kMU','8pDY_9u5Sn0',
  '8QvfWEb7pDo','8SxE_NfUX6w','8VNTTzQMK48','8vyLqZYwPL8','8yNdvL2FTDQ',
  '9BJUGcy22mY','9GYtgFdXCGE','9Ht_GI2zOxo','9OBK8KS8Ims','9omHSTgIn6g',
  '9rGBqeP4pns','9SG3FgGY9ao','9tqhEE9DVVA','9XGOXYi-LNc','a3iIERXZeJE'
];

function findSentenceBoundaries(text) {
  // Known abbreviations that should NOT be treated as sentence ends
  const abbrPatterns = [
    /\bDr\.\s/g, /\bMr\.\s/g, /\bMrs\.\s/g, /\bMs\.\s/g, /\bSt\.\s/g,
    /\bJr\.\s/g, /\bSr\.\s/g, /\bProf\.\s/g, /\bInc\.\s/g, /\bLtd\.\s/g,
    /\bCorp\.\s/g, /\bGen\.\s/g, /\bGov\.\s/g, /\bSgt\.\s/g, /\bRev\.\s/g,
    /\bCapt\.\s/g, /\bCol\.\s/g, /\bU\.S\.\s/g, /\bi\.e\.\s/g, /\be\.g\.\s/g,
    /\bvs\.\s/g, /\betc\.\s/g
  ];

  // Collect all abbreviation positions
  const abbrPositions = new Set();
  for (const pattern of abbrPatterns) {
    let m;
    const p = new RegExp(pattern.source, pattern.flags);
    while ((m = p.exec(text)) !== null) {
      // Mark the period position
      const periodIdx = text.indexOf('.', m.index);
      if (periodIdx >= m.index) {
        abbrPositions.add(periodIdx);
      }
    }
  }

  // Find sentence boundaries: .!? followed by space(s) then uppercase letter
  const boundaries = [];
  const sentenceEndRegex = /[.!?]\s+(?=[A-Z])/g;
  let match;

  while ((match = sentenceEndRegex.exec(text)) !== null) {
    const punctPos = match.index;

    // Skip if this is an abbreviation
    if (abbrPositions.has(punctPos)) continue;

    // The boundary position is where the next sentence starts (after the space)
    boundaries.push(punctPos + match[0].length);
  }

  return boundaries;
}

function splitTextAtBoundaries(text, boundaries) {
  if (boundaries.length === 0) return [text];
  const parts = [];
  let lastIdx = 0;
  for (const b of boundaries) {
    const part = text.substring(lastIdx, b).trim();
    if (part.length > 0) parts.push(part);
    lastIdx = b;
  }
  const last = text.substring(lastIdx).trim();
  if (last.length > 0) parts.push(last);
  return parts;
}

function isMusic(text) {
  const t = text.trim();
  return t.includes('\u266A') || t.startsWith('[music') || t.startsWith('[applause') ||
    t.startsWith('-\u266A') || /^[\u266A\[\(]/.test(t);
}

function splitKorean(ko, numParts) {
  if (numParts <= 1) return [ko];

  // Try to find sentence boundaries in Korean
  const koBoundaries = [];
  const koRegex = /[.!?]\s+/g;
  let m;
  while ((m = koRegex.exec(ko)) !== null) {
    koBoundaries.push(m.index + m[0].length);
  }

  if (koBoundaries.length >= numParts - 1) {
    // Pick evenly spaced boundaries
    const step = koBoundaries.length / numParts;
    const selected = [];
    for (let i = 1; i < numParts; i++) {
      const idx = Math.min(Math.round(i * step) - 1, koBoundaries.length - 1);
      selected.push(koBoundaries[idx]);
    }
    const unique = [...new Set(selected)].sort((a, b) => a - b);
    if (unique.length === numParts - 1) {
      const parts = splitTextAtBoundaries(ko, unique);
      if (parts.length === numParts && parts.every(p => p.length > 0)) {
        return parts;
      }
    }
  }

  // Fallback: full ko in first, empty for rest
  const result = [ko];
  for (let i = 1; i < numParts; i++) result.push('');
  return result;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function processSegment(seg) {
  const { start, end, en, ko } = seg;
  const duration = end - start;

  // Skip music/effects
  if (isMusic(en)) return [seg];

  // Skip segments <= 3 seconds
  if (duration <= 3) return [seg];

  // Find sentence boundaries
  const boundaries = findSentenceBoundaries(en);
  if (boundaries.length === 0) return [seg];

  const sentences = splitTextAtBoundaries(en, boundaries);
  if (sentences.length < 2) return [seg];

  // Calculate time per sentence
  const timePerSentence = duration / sentences.length;

  // Group sentences so each group >= 1.5s
  let groups;
  if (timePerSentence >= 1.5) {
    // Each sentence individually
    groups = sentences.map(s => [s]);
  } else {
    // Need to group
    groups = [];
    let currentGroup = [];
    let currentChars = 0;
    const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);

    for (let i = 0; i < sentences.length; i++) {
      currentGroup.push(sentences[i]);
      currentChars += sentences[i].length;

      const groupDuration = (currentChars / totalChars) * duration;
      const remainingSentences = sentences.length - i - 1;

      if (groupDuration >= 1.5 && remainingSentences > 0) {
        const remainingChars = totalChars - currentChars;
        const remainingDuration = (remainingChars / totalChars) * duration;

        if (remainingDuration >= 1.5) {
          groups.push([...currentGroup]);
          currentGroup = [];
          currentChars = 0;
        }
      }
    }
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
  }

  // Need at least 2 groups to split
  if (groups.length < 2) return [seg];

  // Build group texts
  const groupTexts = groups.map(g => g.join(' '));
  const totalChars = groupTexts.reduce((sum, t) => sum + t.length, 0);

  // Check minimum duration: no part < 1.0s
  const groupDurations = groupTexts.map(t => (t.length / totalChars) * duration);
  if (groupDurations.some(d => d < 1.0)) return [seg];

  // Split Korean to match
  const koParts = splitKorean(ko, groups.length);

  // Build new segments with proportional timing
  const newSegs = [];
  let currentStart = start;

  for (let i = 0; i < groups.length; i++) {
    const partDuration = (groupTexts[i].length / totalChars) * duration;
    const partEnd = (i === groups.length - 1) ? end : round1(currentStart + partDuration);

    newSegs.push({
      start: round1(currentStart),
      end: partEnd,
      en: groupTexts[i],
      ko: koParts[i]
    });

    currentStart = partEnd;
  }

  return newSegs;
}

// Main
const report = {
  batch: '03',
  filesProcessed: 40,
  filesChanged: 0,
  totalSplits: 0,
  details: {}
};

for (const id of videoIds) {
  const filePath = join(TRANSCRIPTS_DIR, id + '.json');
  if (!existsSync(filePath)) {
    console.log('SKIP: ' + id + ' - file not found');
    continue;
  }

  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const segsBefore = data.length;
  let splits = 0;

  const newData = [];
  for (const seg of data) {
    const result = processSegment(seg);
    if (result.length > 1) {
      splits++;
    }
    newData.push(...result);
  }

  if (splits > 0) {
    writeFileSync(filePath, JSON.stringify(newData, null, 2) + '\n', 'utf8');
    report.filesChanged++;
    report.totalSplits += splits;
    report.details[id] = {
      splits,
      segsBefore,
      segsAfter: newData.length
    };
    console.log('CHANGED: ' + id + ' - ' + splits + ' splits (' + segsBefore + ' -> ' + newData.length + ' segs)');
  } else {
    console.log('OK: ' + id + ' - no changes needed');
  }
}

// Write report
const reportPath = 'C:/Users/hyunj/studyeng/src/data/reseg-results/fix2-batch-03.json';
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log('\nReport written to ' + reportPath);
console.log('Files changed: ' + report.filesChanged + '/' + report.filesProcessed);
console.log('Total splits: ' + report.totalSplits);
