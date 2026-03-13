import { readFileSync, writeFileSync } from 'fs';

const FILES = 'nByAshpybOo,nCrjHPBQg9I,Nc_Tny40JPU,ndTbiDQjbiE,NeSvMWrxh8E,nfs8NYg7yQM,NfXoVR3hP7M,nGUfj2taniA,NhkT5Y4yvMg,NHopJHSlVo4,NIBUWqSTp90,NieGl78W4-w,nITZooG6ij8,niZKrt4XAZE,njJ41irPjTc,njtfNPB-YKg,nJzo5TDfamk,nJ_htuCMCqM,nK1jtVhimPA,nQJRDIXCcRs,nrBAHIc7Aco,nRpXUhLQG48,nW9pqeXofh4,nWeCJTyho8Y,NxoW7MEWFEY,o0SV9cBcNVQ,o3bhQwY0KCY,O5b0ZxUWNf0,O7VaXlMvAvk,OA3Txp94pjs,oB5dctpeI0o,oCwsZavV0mM,Of73UiXUvjA,onVhbeY7nLM,OOK3lltE3OU,opGJR_dBEvY,orDUxNZYKdo,oRD_ccAYLF4,oweYva96e2g,P0kcnb-3Tz4'.split(',');

const ABBRS = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'St.', 'U.S.', 'Jr.', 'Sr.'];

function protectAbbrs(text) {
  let result = text;
  for (const abbr of ABBRS) {
    result = result.replaceAll(abbr, abbr.replaceAll('.', '\x00'));
  }
  return result;
}

function restoreAbbrs(text) {
  return text.replaceAll('\x00', '.');
}

function splitSentences(en) {
  const safe = protectAbbrs(en);
  const regex = /([.!?])\s+(?=[A-Z])/g;
  const parts = [];
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(safe)) !== null) {
    const endPos = match.index + match[1].length;
    parts.push(restoreAbbrs(safe.substring(lastIdx, endPos).trim()));
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < safe.length) {
    parts.push(restoreAbbrs(safe.substring(lastIdx).trim()));
  }
  return parts.filter(p => p.length > 0);
}

function splitKorean(ko, enCount) {
  if (!ko || enCount <= 1) return Array(enCount).fill(ko || '');

  // Try splitting Korean at its own sentence boundaries
  const koBySentence = ko.split(/(?<=[.!?])\s+/).filter(p => p.length > 0);
  if (koBySentence.length === enCount) return koBySentence;

  // Try Korean-specific endings
  const koByEnding = ko.split(/(?<=[다요죠네][\.\?!]?)\s+/).filter(p => p.length > 0);
  if (koByEnding.length === enCount) return koByEnding;

  // Fallback: full ko in first segment, empty for rest
  const result = [ko];
  for (let i = 1; i < enCount; i++) result.push('');
  return result;
}

function rd1(v) {
  return Math.round(v * 10) / 10;
}

function buildSegments(sentenceTexts, koParts, origStart, origEnd, totalDur) {
  const totalChars = sentenceTexts.reduce((s, t) => s + t.length, 0);
  if (totalChars === 0) return null;

  // proportional durations, min 1.0s
  let durations = sentenceTexts.map(t => Math.max(1.0, rd1((t.length / totalChars) * totalDur)));

  // scale so they sum to totalDur
  let sum = durations.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - totalDur) > 0.05) {
    const last = rd1(durations[durations.length - 1] + (totalDur - sum));
    durations[durations.length - 1] = Math.max(1.0, last);
  }

  const segs = [];
  let t = origStart;
  for (let i = 0; i < sentenceTexts.length; i++) {
    const segEnd = i === sentenceTexts.length - 1 ? origEnd : rd1(t + durations[i]);
    segs.push({
      start: rd1(t),
      end: Math.min(segEnd, origEnd),
      en: sentenceTexts[i],
      ko: koParts[i] || ''
    });
    t = segEnd;
  }

  // Ensure last segment is at least 1.0s by borrowing from previous
  if (segs.length >= 2) {
    const last = segs[segs.length - 1];
    const lastDur = rd1(last.end - last.start);
    if (lastDur < 1.0) {
      const need = rd1(1.0 - lastDur);
      const prev = segs[segs.length - 2];
      const prevDur = rd1(prev.end - prev.start);
      if (prevDur - need >= 1.0) {
        const newBoundary = rd1(prev.end - need);
        prev.end = newBoundary;
        last.start = newBoundary;
      }
    }
  }

  return segs;
}

function groupSentences(sentences, totalDur) {
  // Calculate raw proportional durations
  const totalChars = sentences.reduce((s, t) => s + t.length, 0);
  const rawDurs = sentences.map(t => Math.max(1.0, rd1((t.length / totalChars) * totalDur)));

  // If all sentences >= 1.5s, no grouping needed
  if (rawDurs.every(d => d >= 1.5)) {
    return sentences.map(s => [s]); // each sentence is its own group (array of 1)
  }

  // Group short sentences together
  const groups = [];
  let curTexts = [sentences[0]];
  let curDur = rawDurs[0];

  for (let i = 1; i < sentences.length; i++) {
    if (curDur >= 1.5 && rawDurs[i] >= 1.5) {
      groups.push(curTexts);
      curTexts = [sentences[i]];
      curDur = rawDurs[i];
    } else {
      curTexts.push(sentences[i]);
      curDur += rawDurs[i];
    }
  }
  groups.push(curTexts);

  // Second pass: break groups with 3+ sentences if possible
  const finalGroups = [];
  for (const g of groups) {
    if (g.length >= 3) {
      const gChars = g.reduce((s, t) => s + t.length, 0);
      const gDur = (gChars / totalChars) * totalDur;
      if (gDur >= 3.0) {
        // Split into pairs
        for (let i = 0; i < g.length; i += 2) {
          const sub = g.slice(i, Math.min(i + 2, g.length));
          finalGroups.push(sub);
        }
        continue;
      }
    }
    finalGroups.push(g);
  }

  return finalGroups;
}

function processSegment(seg) {
  const dur = rd1(seg.end - seg.start);
  const en = seg.en || '';
  const ko = seg.ko || '';

  // Skip conditions
  if (dur <= 3) return null;
  if (en.includes('\u266a') || /\[music\]/i.test(en)) return null;

  const sentences = splitSentences(en);
  if (sentences.length < 2) return null;

  // Group sentences if needed
  const groups = groupSentences(sentences, dur);
  if (groups.length < 2) return null; // everything collapsed into one group

  // Build final text for each group
  const groupTexts = groups.map(g => g.join(' '));

  // Split Korean proportionally to groups
  const koParts = splitKorean(ko, groupTexts.length);

  return buildSegments(groupTexts, koParts, seg.start, seg.end, dur);
}

// ---- Main ----
const report = {
  batch: '13',
  filesProcessed: 0,
  filesChanged: 0,
  totalSplits: 0,
  details: {}
};

for (const fileId of FILES) {
  const path = `C:/Users/hyunj/studyeng/public/transcripts/${fileId}.json`;

  try {
    const data = JSON.parse(readFileSync(path, 'utf8'));
    const segsBefore = data.length;
    let splits = 0;
    const newData = [];

    for (const seg of data) {
      const result = processSegment(seg);
      if (result && result.length > 1) {
        splits++;
        newData.push(...result);
      } else {
        newData.push(seg);
      }
    }

    report.filesProcessed++;

    if (splits > 0) {
      report.filesChanged++;
      report.totalSplits += splits;
      report.details[fileId] = { splits, segsBefore, segsAfter: newData.length };
      writeFileSync(path, JSON.stringify(newData, null, 2), 'utf8');
      console.log(`${fileId}: ${splits} splits (${segsBefore} -> ${newData.length} segs)`);
    } else {
      console.log(`${fileId}: no splits needed`);
    }
  } catch (e) {
    console.error(`${fileId}: ERROR - ${e.message}`);
  }
}

// Write report
const reportPath = 'C:/Users/hyunj/studyeng/src/data/reseg-results/fix2-batch-13.json';
writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
console.log(`\nDone: ${report.filesProcessed} files, ${report.filesChanged} changed, ${report.totalSplits} splits`);
