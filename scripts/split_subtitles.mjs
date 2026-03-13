import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE = 'C:/Users/hyunj/studyeng/public/transcripts';

function isEndPunctuation(ch) {
  return '.?!"\')\u266A\u2014'.includes(ch);
}

function endsWithPunctuation(text) {
  const trimmed = text.trim();
  if (!trimmed) return true;
  const last = trimmed[trimmed.length - 1];
  return isEndPunctuation(last);
}

function fixEndPunctuation(text) {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (endsWithPunctuation(trimmed)) return trimmed;
  // Music note segments
  if (trimmed.includes('\u266A')) return trimmed;
  // Ends with dash (trailing thought)
  if (trimmed.endsWith('-') || trimmed.endsWith('\u2014')) return trimmed;
  // Question detection
  if (/^(what|where|when|who|why|how|is |are |do |does |did |can |could |would |should |will |shall |has |have |had |may |might )/i.test(trimmed)) {
    return trimmed + '?';
  }
  return trimmed + '.';
}

function splitEnglishSentences(text) {
  // Protect abbreviations
  const abbrPositions = new Set();
  const abbrRegex = /\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|Sgt|Lt|Gen|Gov|Pres|Rev|vs|etc|inc|ltd|corp|dept|est|approx|vol|no|fig|eq)\./gi;
  let match;
  while ((match = abbrRegex.exec(text)) !== null) {
    abbrPositions.add(match.index + match[0].length - 1);
  }

  // Protect "p.m." and "a.m."
  const timeRegex = /\b[ap]\.m\./gi;
  while ((match = timeRegex.exec(text)) !== null) {
    abbrPositions.add(match.index + 1);
    abbrPositions.add(match.index + 3);
  }

  // Protect "U.S." "U.K." etc
  const countryRegex = /\b[A-Z]\.[A-Z]\./g;
  while ((match = countryRegex.exec(text)) !== null) {
    abbrPositions.add(match.index + 1);
    abbrPositions.add(match.index + 3);
  }

  // Protect decimal numbers
  const numRegex = /\d+\.\d+/g;
  while ((match = numRegex.exec(text)) !== null) {
    for (let p = match.index; p < match.index + match[0].length; p++) {
      if (text[p] === '.') abbrPositions.add(p);
    }
  }

  // Protect ellipsis
  const ellipsisRegex = /\.{2,}/g;
  while ((match = ellipsisRegex.exec(text)) !== null) {
    for (let p = match.index; p < match.index + match[0].length; p++) {
      abbrPositions.add(p);
    }
  }

  const sentences = [];
  let current = '';

  for (let i = 0; i < text.length; i++) {
    current += text[i];

    if (abbrPositions.has(i)) continue;

    if (text[i] === '.' || text[i] === '?' || text[i] === '!') {
      let endIdx = i;
      // Include closing quote right after
      if (i + 1 < text.length && (text[i + 1] === '"' || text[i + 1] === "'" || text[i + 1] === '\u201D')) {
        current += text[i + 1];
        endIdx = i + 1;
        i++;
      }

      const nextCharIdx = endIdx + 1;
      if (nextCharIdx >= text.length) {
        sentences.push(current.trim());
        current = '';
      } else if (text[nextCharIdx] === ' ') {
        const afterSpace = text[nextCharIdx + 1];
        if (afterSpace) {
          const isUpper = afterSpace >= 'A' && afterSpace <= 'Z';
          const isQuote = afterSpace === '"' || afterSpace === "'" || afterSpace === '\u201C';
          const isMusicNote = afterSpace === '\u266A';
          const isSpecial = afterSpace === '\u2014' || afterSpace === '(' || afterSpace === '[';
          if (isUpper || isQuote || isMusicNote || isSpecial) {
            sentences.push(current.trim());
            current = '';
            i = nextCharIdx; // skip the space
          }
        }
      }
    }
  }

  if (current.trim()) {
    sentences.push(current.trim());
  }

  return sentences.filter(s => s.length > 0);
}

function splitKoreanToMatch(koText, enSentences) {
  const targetCount = enSentences.length;
  if (targetCount <= 1) return [koText];

  // Find split points in Korean at punctuation (. ? ! followed by space)
  const splitPoints = [];
  for (let i = 0; i < koText.length; i++) {
    if ((koText[i] === '.' || koText[i] === '?' || koText[i] === '!') &&
        i < koText.length - 1 && koText[i + 1] === ' ') {
      splitPoints.push(i);
    }
  }

  // If we have enough punctuation split points, use them
  if (splitPoints.length >= targetCount - 1) {
    // Choose best split points (closest to proportional distribution)
    const totalEnChars = enSentences.reduce((sum, s) => sum + s.length, 0);
    const chosen = [];
    let lastKoIdx = 0;

    for (let s = 0; s < targetCount - 1; s++) {
      const enCumul = enSentences.slice(0, s + 1).reduce((sum, e) => sum + e.length, 0);
      const targetKoPos = Math.round((enCumul / totalEnChars) * koText.length);

      // Find the closest split point to targetKoPos that hasn't been used
      let bestPoint = -1;
      let bestDist = Infinity;
      for (const sp of splitPoints) {
        if (sp > lastKoIdx && !chosen.includes(sp)) {
          const dist = Math.abs(sp - targetKoPos);
          if (dist < bestDist) {
            bestDist = dist;
            bestPoint = sp;
          }
        }
      }

      if (bestPoint >= 0) {
        chosen.push(bestPoint);
        lastKoIdx = bestPoint;
      }
    }

    if (chosen.length === targetCount - 1) {
      chosen.sort((a, b) => a - b);
      const parts = [];
      let lastIdx = 0;
      for (const sp of chosen) {
        parts.push(koText.substring(lastIdx, sp + 1).trim());
        lastIdx = sp + 2; // skip punct and space
      }
      parts.push(koText.substring(lastIdx).trim());
      return parts;
    }
  }

  // Fallback: proportional split at nearest space/punctuation boundary
  const totalLen = koText.length;
  const enLengths = enSentences.map(s => s.length);
  const totalEnLen = enLengths.reduce((a, b) => a + b, 0);

  const parts = [];
  let lastIdx = 0;

  for (let i = 0; i < targetCount - 1; i++) {
    const targetPos = Math.round((enLengths.slice(0, i + 1).reduce((a, b) => a + b, 0) / totalEnLen) * totalLen);

    // Find nearest punctuation+space first, then space
    let bestBreak = -1;

    // Look for punctuation breaks first
    for (let d = 0; d < 20; d++) {
      for (const offset of [targetPos + d, targetPos - d]) {
        if (offset > lastIdx && offset < totalLen - 1) {
          if ((koText[offset] === '.' || koText[offset] === '?' || koText[offset] === '!' || koText[offset] === ',') && koText[offset + 1] === ' ') {
            bestBreak = offset + 2;
            break;
          }
        }
      }
      if (bestBreak > 0) break;
    }

    // Fallback to space
    if (bestBreak < 0) {
      for (let d = 0; d < 30; d++) {
        if (targetPos + d < totalLen && koText[targetPos + d] === ' ') {
          bestBreak = targetPos + d + 1;
          break;
        }
        if (targetPos - d > lastIdx && koText[targetPos - d] === ' ') {
          bestBreak = targetPos - d + 1;
          break;
        }
      }
    }

    if (bestBreak > lastIdx && bestBreak < totalLen) {
      parts.push(koText.substring(lastIdx, bestBreak).trim());
      lastIdx = bestBreak;
    }
  }
  parts.push(koText.substring(lastIdx).trim());

  if (parts.length < targetCount) {
    return [koText];
  }

  return parts;
}

function splitAtClauseBoundary(text) {
  const clausePatterns = [', and ', ', but ', ', because ', ', which ', ', so ', ', or ', ', yet ', ', then '];
  for (const pattern of clausePatterns) {
    const idx = text.indexOf(pattern);
    if (idx > 0) {
      const part1 = text.substring(0, idx + 1).trim();
      const rest = text.substring(idx + pattern.length).trim();
      const part2 = rest.charAt(0).toUpperCase() + rest.slice(1);
      if (part1.length > 10 && part2.length > 10) {
        return [part1, part2];
      }
    }
  }
  return null;
}

function processSegment(seg) {
  const duration = seg.end - seg.start;
  let en = seg.en.trim();
  let ko = seg.ko.trim();

  // Fix missing end punctuation (Rule 3)
  en = fixEndPunctuation(en);

  // Rule 2: Keep short multi-sentence segments (<=3s)
  if (duration <= 3) {
    return [{ start: seg.start, end: seg.end, en, ko }];
  }

  // Rule 1: Split multi-sentence segments >3s
  const sentences = splitEnglishSentences(en);

  if (sentences.length >= 2) {
    const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
    const koSentences = splitKoreanToMatch(ko, sentences);

    const results = [];
    let currentStart = seg.start;

    for (let i = 0; i < sentences.length; i++) {
      const charRatio = sentences[i].length / totalChars;
      const segDuration = duration * charRatio;
      let segEnd = i === sentences.length - 1 ? seg.end : Math.round((currentStart + segDuration) * 100) / 100;

      const koText = i < koSentences.length ? koSentences[i] : '';
      let fixedEn = fixEndPunctuation(sentences[i]);

      results.push({
        start: Math.round(currentStart * 100) / 100,
        end: segEnd,
        en: fixedEn,
        ko: koText
      });

      currentStart = segEnd;
    }

    // Rule 7: Merge any segments < 1 second with neighbor
    const merged = [];
    for (const r of results) {
      const dur = r.end - r.start;
      if (dur < 1 && merged.length > 0) {
        merged[merged.length - 1].end = r.end;
        merged[merged.length - 1].en += ' ' + r.en;
        merged[merged.length - 1].ko += ' ' + r.ko;
      } else {
        merged.push(r);
      }
    }

    if (merged.length >= 2) {
      return merged;
    }
  }

  // Rule 5: Long single sentences >8s - split at clause boundaries
  if (duration > 8 && sentences.length === 1) {
    const clauseSplit = splitAtClauseBoundary(en);
    if (clauseSplit) {
      const totalChars = clauseSplit.reduce((sum, s) => sum + s.length, 0);
      const koSplit = splitKoreanToMatch(ko, clauseSplit);

      const part1Duration = duration * (clauseSplit[0].length / totalChars);
      const part2Duration = duration * (clauseSplit[1].length / totalChars);

      if (part1Duration >= 3 && part2Duration >= 3) {
        const midPoint = Math.round((seg.start + part1Duration) * 100) / 100;
        return [
          { start: seg.start, end: midPoint, en: fixEndPunctuation(clauseSplit[0]), ko: koSplit[0] || '' },
          { start: midPoint, end: seg.end, en: fixEndPunctuation(clauseSplit[1]), ko: koSplit[1] || '' }
        ];
      }
    }
  }

  return [{ start: seg.start, end: seg.end, en, ko }];
}

function processFile(filename) {
  const filepath = join(BASE, filename);
  const data = JSON.parse(readFileSync(filepath, 'utf-8'));

  let splitCount = 0;
  let punctFixes = 0;
  const result = [];

  for (const seg of data) {
    const origEn = seg.en.trim();
    const processed = processSegment(seg);

    if (processed.length > 1) {
      splitCount++;
    }
    if (processed.length === 1 && !endsWithPunctuation(origEn) && endsWithPunctuation(processed[0].en)) {
      punctFixes++;
    }
    // Count punct fixes in split segments too
    if (processed.length > 1) {
      for (const p of processed) {
        // each split sentence gets punct fixed inside processSegment
      }
    }

    result.push(...processed);
  }

  // Rule 8: Fix overlaps
  for (let i = 1; i < result.length; i++) {
    if (result[i].start < result[i - 1].end) {
      result[i].start = result[i - 1].end;
    }
  }

  // Final check: no segments < 0.5 second
  const final = [];
  for (const seg of result) {
    const dur = seg.end - seg.start;
    if (dur < 0.5 && final.length > 0) {
      final[final.length - 1].end = seg.end;
      final[final.length - 1].en += ' ' + seg.en;
      final[final.length - 1].ko += ' ' + seg.ko;
    } else {
      final.push(seg);
    }
  }

  writeFileSync(filepath, JSON.stringify(final, null, 2), 'utf-8');
  console.log(`  ${filename}: ${data.length} -> ${final.length} segments (${splitCount} multi-sent splits, ${punctFixes} punct fixes)`);
  return { original: data.length, final: final.length, splits: splitCount, punctFixes };
}

const files = [
  'qCzWL9OPpwE.json',
  '21Ki96Lsxhc.json',
  'pT6It4rnh_o.json',
  '4hX9o6ghEGI.json',
  'YpecVts2qqc.json',
  'QPig73PjDF0.json',
  '2ONo4fpnhII.json',
  'yH6C3JbCXxo.json',
];

console.log('=== Subtitle Segmentation Processing ===\n');
let totalOrig = 0, totalFinal = 0, totalSplits = 0;
for (const f of files) {
  const r = processFile(f);
  totalOrig += r.original;
  totalFinal += r.final;
  totalSplits += r.splits;
}
console.log(`\n=== TOTALS: ${totalOrig} -> ${totalFinal} segments (${totalSplits} multi-sent splits) ===`);
