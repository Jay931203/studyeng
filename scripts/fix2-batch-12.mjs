import fs from 'fs';
import path from 'path';

const TRANSCRIPTS_DIR = 'public/transcripts';
const OUTPUT_DIR = 'src/data/reseg-results';

const FILES = [
  'lV8ocbooymE','lvBmrMEd254','Lz3KYrPQaN0','LZNr8XGqByw','m4qpy87rs6U',
  'm6uvv1aS5_I','M7Is43K6lrg','M7KelAaqsCg','MAioK8ZJhJE','mATlzmlaSQE',
  'mBlJ9N7Ehgk','MDJvZ-zfKyA','MdwuW8n3JYA','mfqC28HcNjk','MfZEDMsOrCk',
  'mhII8J_4Y1g','mIABSdupWdI','MlPd6zWjd_0','MmfmCR4Kta4','MoLkabPK3YU',
  'MoN9ql6Yymw','MPesRzTuTKg','MPoggHQ2qIA','MQJlBpPLHUM','mR6xnrY7rXI',
  'MSRcC626prw','MsWlktW0kj4','mVqbIUIHRFo','MwI6-7kE17M','MWkN3akP3cU',
  'mwoX_UotKGo','MYtjpIwamos','n05FK5Ms0wE','N16YkjFVAyE','N2p5uvbQhaY',
  'n4NVPg2kHv4','N6J_32cDk9Y','N9QxmhaOPiE','NbOaWsqF_Y4','NbuUW9i-mHs'
];

// Abbreviations that are NOT sentence boundaries
const ABBREVS = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'St.', 'U.S.', 'Jr.', 'Sr.'];

function isMusic(en) {
  return /[♪♫]/.test(en) || /^\[music\]/i.test(en.trim()) || /^\[.*\]$/.test(en.trim());
}

/**
 * Split English text into sentences at [.?!] + space + uppercase letter.
 * Respects abbreviations. Merges trailing fragments (< 5 chars) back.
 */
function splitSentences(text) {
  if (!text || text.trim().length === 0) return [text];

  const sentences = [];
  let current = '';
  let i = 0;

  while (i < text.length) {
    current += text[i];

    if ((text[i] === '.' || text[i] === '?' || text[i] === '!') && i + 1 < text.length) {
      if (text[i + 1] === ' ' && i + 2 < text.length && /[A-Z]/.test(text[i + 2])) {
        let isAbbrev = false;
        if (text[i] === '.') {
          for (const abbr of ABBREVS) {
            const endPart = current.slice(-abbr.length);
            if (endPart === abbr) {
              isAbbrev = true;
              break;
            }
          }
          // Dotted abbreviation pattern like U.S. or A.M.
          const lastFew = current.slice(-4);
          if (/[A-Z]\.[A-Z]\.$/.test(lastFew)) {
            isAbbrev = true;
          }
        }

        if (!isAbbrev) {
          sentences.push(current.trim());
          current = '';
          i++; // skip the space
          continue;
        }
      }
    }
    i++;
  }

  if (current.trim().length > 0) {
    sentences.push(current.trim());
  }

  // Merge trailing fragment: if last sentence is very short (< 5 chars, no punctuation ending),
  // merge it back into the previous sentence - it's likely a transcription artifact
  if (sentences.length >= 2) {
    const last = sentences[sentences.length - 1];
    if (last.length < 5 && !/[.?!]$/.test(last)) {
      sentences[sentences.length - 2] += ' ' + last;
      sentences.pop();
    }
  }

  return sentences.filter(s => s.length > 0);
}

/**
 * Split Korean at matching sentence boundaries.
 */
function splitKorean(ko, enSentenceCount) {
  if (!ko || enSentenceCount <= 1) return [ko];

  const koSentences = [];
  let curr = '';
  for (let i = 0; i < ko.length; i++) {
    curr += ko[i];
    if ((ko[i] === '.' || ko[i] === '?' || ko[i] === '!' || ko[i] === '。')
        && i + 1 < ko.length && ko[i + 1] === ' ') {
      koSentences.push(curr.trim());
      curr = '';
      i++; // skip space
    }
  }
  if (curr.trim()) koSentences.push(curr.trim());

  if (koSentences.length === enSentenceCount) {
    return koSentences;
  }

  // Counts don't match: full ko in first segment, "" for rest
  const result = [ko];
  for (let i = 1; i < enSentenceCount; i++) {
    result.push('');
  }
  return result;
}

/**
 * Group sentences so each group >= 1.5s.
 * RULE: never leave 3+ sentences in one group if smaller groups >= 1.5s are possible.
 */
function groupSentences(sentences, totalDuration, totalChars) {
  if (sentences.length <= 1) return [sentences];

  // Proportional duration per sentence
  const withDuration = sentences.map(s => ({
    ...s,
    duration: Math.max(1.0, (s.charCount / totalChars) * totalDuration)
  }));

  // If every sentence individually >= 1.5s, split each on its own
  if (withDuration.every(s => s.duration >= 1.5)) {
    return withDuration.map(s => [s]);
  }

  // Greedy grouping: accumulate until >= 1.5s, then start new group
  const groups = [];
  let currentGroup = [];
  let currentDur = 0;

  for (let i = 0; i < withDuration.length; i++) {
    currentGroup.push(withDuration[i]);
    currentDur += withDuration[i].duration;

    const remaining = withDuration.length - i - 1;
    if (currentDur >= 1.5 && remaining > 0) {
      const remainingDur = withDuration.slice(i + 1).reduce((s, x) => s + x.duration, 0);
      if (remainingDur >= 1.0) {
        groups.push([...currentGroup]);
        currentGroup = [];
        currentDur = 0;
      }
    }
  }

  if (currentGroup.length > 0) {
    // Merge tiny tail into previous group
    if (groups.length > 0 && currentDur < 1.0) {
      groups[groups.length - 1].push(...currentGroup);
    } else {
      groups.push(currentGroup);
    }
  }

  // Second pass: break up any group with 3+ sentences if possible
  const finalGroups = [];
  for (const group of groups) {
    if (group.length >= 3) {
      let sub = [];
      let subDur = 0;
      for (let j = 0; j < group.length; j++) {
        sub.push(group[j]);
        subDur += group[j].duration;
        const left = group.length - j - 1;
        if (subDur >= 1.5 && left > 0) {
          const leftDur = group.slice(j + 1).reduce((s, x) => s + x.duration, 0);
          if (leftDur >= 1.0) {
            finalGroups.push([...sub]);
            sub = [];
            subDur = 0;
          }
        }
      }
      if (sub.length > 0) {
        if (finalGroups.length > 0 && subDur < 1.0) {
          finalGroups[finalGroups.length - 1].push(...sub);
        } else {
          finalGroups.push(sub);
        }
      }
    } else {
      finalGroups.push(group);
    }
  }

  return finalGroups;
}

function rd1(n) { return Math.round(n * 10) / 10; }

function processFile(videoId) {
  const filePath = path.join(TRANSCRIPTS_DIR, `${videoId}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  let splitCount = 0;
  const changes = [];
  const newSegments = [];

  for (let idx = 0; idx < data.length; idx++) {
    const seg = data[idx];
    const duration = rd1(seg.end - seg.start);

    // Skip: segments <= 3s, music/effects
    if (duration <= 3 || isMusic(seg.en)) {
      newSegments.push(seg);
      continue;
    }

    const sentences = splitSentences(seg.en);

    // Skip single sentence
    if (sentences.length <= 1) {
      newSegments.push(seg);
      continue;
    }

    // 2+ sentences and > 3s
    const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
    const koParts = splitKorean(seg.ko, sentences.length);

    const sentenceData = sentences.map((en, i) => ({
      en,
      ko: koParts[i] || '',
      charCount: en.length,
    }));

    const groups = groupSentences(sentenceData, duration, totalChars);

    // If grouping didn't actually split, skip
    if (groups.length <= 1) {
      newSegments.push(seg);
      continue;
    }

    // Build new segments with proportional timing, enforcing min 1.0s
    const groupCharCounts = groups.map(g => g.reduce((s, x) => s + x.charCount, 0));

    // First pass: proportional durations
    let rawDurations = groupCharCounts.map(gc => (gc / totalChars) * duration);

    // Second pass: enforce min 1.0s and redistribute
    const MIN_DUR = 1.0;
    let deficit = 0;
    let longTotal = 0;
    for (let gi = 0; gi < rawDurations.length; gi++) {
      if (rawDurations[gi] < MIN_DUR) {
        deficit += MIN_DUR - rawDurations[gi];
        rawDurations[gi] = MIN_DUR;
      } else {
        longTotal += rawDurations[gi];
      }
    }
    // Steal time proportionally from segments above MIN_DUR
    if (deficit > 0 && longTotal > 0) {
      for (let gi = 0; gi < rawDurations.length; gi++) {
        if (rawDurations[gi] > MIN_DUR) {
          const share = ((rawDurations[gi]) / longTotal) * deficit;
          rawDurations[gi] -= share;
          if (rawDurations[gi] < MIN_DUR) rawDurations[gi] = MIN_DUR;
        }
      }
    }

    // Round and build segments
    let cursor = seg.start;
    const produced = [];

    for (let gi = 0; gi < groups.length; gi++) {
      const group = groups[gi];
      const gDur = rd1(rawDurations[gi]);

      const enText = group.map(s => s.en).join(' ');
      const koTexts = group.map(s => s.ko).filter(k => k);
      const koText = koTexts.length > 0 ? koTexts.join(' ') : '';

      produced.push({
        start: rd1(cursor),
        end: rd1(cursor + gDur),
        en: enText,
        ko: koText,
      });
      cursor += gDur;
    }

    // Snap last segment end to original end
    produced[produced.length - 1].end = seg.end;

    // Ensure sequential and no overlap
    for (let pi = 1; pi < produced.length; pi++) {
      produced[pi].start = produced[pi - 1].end;
    }

    // Final safety: drop any segment with <= 0 duration
    const safe = produced.filter(p => rd1(p.end - p.start) >= 1.0);
    // If too many got dropped, merge remainders into last valid segment
    if (safe.length <= 1) {
      newSegments.push(seg);
      continue;
    }

    // Korean fallback: first segment with empty ko gets the original ko
    const hasAnyKo = safe.some(p => p.ko && p.ko.length > 0);
    if (!hasAnyKo) {
      safe[0].ko = seg.ko;
    } else {
      // Fill segments that have empty ko: leave them empty (they come from unmatched splits)
      // But ensure at least one segment has ko
      if (!safe[0].ko && !safe.some(p => p.ko)) {
        safe[0].ko = seg.ko;
      }
    }

    newSegments.push(...safe);
    splitCount++;
    changes.push({
      index: idx,
      original: seg,
      splitInto: safe.length,
      produced: safe,
    });
  }

  // Write updated file
  fs.writeFileSync(filePath, JSON.stringify(newSegments, null, 2), 'utf-8');

  return {
    videoId,
    originalSegments: data.length,
    newSegments: newSegments.length,
    segmentsSplit: splitCount,
    changes,
  };
}

// Main
const report = {
  batch: 'fix2-batch-12',
  processedAt: new Date().toISOString(),
  files: [],
  totalFilesSplit: 0,
  totalSegmentsSplit: 0,
  totalNewSegments: 0,
};

for (const videoId of FILES) {
  try {
    const result = processFile(videoId);
    report.files.push(result);
    if (result.segmentsSplit > 0) {
      report.totalFilesSplit++;
      report.totalSegmentsSplit += result.segmentsSplit;
      report.totalNewSegments += (result.newSegments - result.originalSegments);
    }
    console.log(`${videoId}: ${result.segmentsSplit} splits (${result.originalSegments} -> ${result.newSegments} segments)`);
  } catch (err) {
    console.error(`ERROR ${videoId}: ${err.message}`);
    report.files.push({ videoId, error: err.message });
  }
}

// Write report
const reportPath = path.join(OUTPUT_DIR, 'fix2-batch-12.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
console.log(`\nReport written to ${reportPath}`);
console.log(`Total: ${report.totalFilesSplit} files modified, ${report.totalSegmentsSplit} segments split, ${report.totalNewSegments} new segments added`);
