import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TRANSCRIPTS_DIR = 'C:/Users/hyunj/studyeng/public/transcripts';

const videoIds = [
  'WLex9xvQycQ','WOgKIlvjlQ8','wOI5YguHhr0','wQ-GmWy_zmM','WRCCGWEE0JQ',
  'wrXKBR2JUPE','wsl5fS7KGZc','wUJccK4lV74','wVOUYGCBb18','WWEGWathsPc',
  'wwTPr4RjgAs','WxfZkMm3wcg','wXhTHyIgQ_U','wXsNIFK8z7I','wyDU93xVAJs',
  'wyqfYJX23lg','WyrnL-E61Gc','X0FcD0SyhK8','X2FV2E34Bwo','X3s9RVg2STY',
  'xBTQqSNA3oQ','XDSXKmr1cTM','XeO3jMZphhs','XgadSkH_JgM','xGiBiHocSZM',
  'Xk6RLMp5WMw','xkAbs9NT0Lg','xLZ34J01FG8','Xnk4seEHmgw','xPGdOXstSyk',
  'XqSYC_vwhDg','Xr6uNyo8Qgg','xRLDup3Agkg','xs3_hNYAVRw','XsiiIa6bs9I',
  'XSQoorx7foI','XvgnOqcCYCM','xxFj4iNmsJE','XXQaTJsr_xA','XZVHmRvfDHM'
];

function findSentenceBoundaries(text) {
  const abbrPatterns = [
    /\bDr\.\s/g, /\bMr\.\s/g, /\bMrs\.\s/g, /\bMs\.\s/g, /\bSt\.\s/g,
    /\bJr\.\s/g, /\bSr\.\s/g, /\bProf\.\s/g, /\bInc\.\s/g, /\bLtd\.\s/g,
    /\bCorp\.\s/g, /\bGen\.\s/g, /\bGov\.\s/g, /\bSgt\.\s/g, /\bRev\.\s/g,
    /\bCapt\.\s/g, /\bCol\.\s/g, /\bU\.S\.\s/g, /\bi\.e\.\s/g, /\be\.g\.\s/g,
    /\bvs\.\s/g, /\betc\.\s/g
  ];

  const abbrPositions = new Set();
  for (const pattern of abbrPatterns) {
    let m;
    const p = new RegExp(pattern.source, pattern.flags);
    while ((m = p.exec(text)) !== null) {
      const periodIdx = text.indexOf('.', m.index);
      if (periodIdx >= m.index) {
        abbrPositions.add(periodIdx);
      }
    }
  }

  const boundaries = [];
  const sentenceEndRegex = /[.!?]\s+(?=[A-Z])/g;
  let match;

  while ((match = sentenceEndRegex.exec(text)) !== null) {
    const punctPos = match.index;
    if (abbrPositions.has(punctPos)) continue;
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

  const koBoundaries = [];
  const koRegex = /[.!?]\s+/g;
  let m;
  while ((m = koRegex.exec(ko)) !== null) {
    koBoundaries.push(m.index + m[0].length);
  }

  if (koBoundaries.length >= numParts - 1) {
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

  if (isMusic(en)) return [seg];
  if (duration <= 3) return [seg];

  const boundaries = findSentenceBoundaries(en);
  if (boundaries.length === 0) return [seg];

  const sentences = splitTextAtBoundaries(en, boundaries);
  if (sentences.length < 2) return [seg];

  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);

  // Group sentences so each group >= 1.5s
  let groups;
  const timePerSentence = duration / sentences.length;

  if (timePerSentence >= 1.5) {
    groups = sentences.map(s => [s]);
  } else {
    groups = [];
    let currentGroup = [];
    let currentChars = 0;

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

  if (groups.length < 2) return [seg];

  const groupTexts = groups.map(g => g.join(' '));
  const totalGroupChars = groupTexts.reduce((sum, t) => sum + t.length, 0);

  // Check minimum duration: no part < 1.0s
  const groupDurations = groupTexts.map(t => (t.length / totalGroupChars) * duration);
  if (groupDurations.some(d => d < 1.0)) return [seg];

  const koParts = splitKorean(ko, groups.length);

  const newSegs = [];
  let currentStart = start;

  for (let i = 0; i < groups.length; i++) {
    const partDuration = (groupTexts[i].length / totalGroupChars) * duration;
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
  batch: '18',
  type: 'fix2',
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
const reportPath = 'C:/Users/hyunj/studyeng/src/data/reseg-results/fix2-batch-18.json';
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log('\nReport written to ' + reportPath);
console.log('Files changed: ' + report.filesChanged + '/' + report.filesProcessed);
console.log('Total splits: ' + report.totalSplits);
