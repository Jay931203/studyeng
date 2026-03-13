import fs from 'fs';
import path from 'path';

const matchDir = 'C:/Users/hyunj/studyeng/src/data/match-results';
const transFixDir = 'C:/Users/hyunj/studyeng/src/data/transcript-fix-batches';

// Build input
const matches = JSON.parse(fs.readFileSync(path.join(matchDir, 'batch-9.json'), 'utf8'));
const fixTrans = JSON.parse(fs.readFileSync(path.join(transFixDir, 'batch-9.json'), 'utf8'));

const result = [];
for (const [videoId, vidMatches] of Object.entries(matches)) {
  const fixVid = fixTrans[videoId] || [];
  for (const m of vidMatches) {
    const sent = fixVid[m.sentenceIdx];
    if (!sent) continue;
    result.push({
      videoId,
      exprId: m.canonical,
      sentenceIdx: m.sentenceIdx,
      en: sent.en || null,
      ko: sent.ko || null
    });
  }
}

console.log('Total records (with ko):', result.length);
fs.writeFileSync('C:/tmp/sf-batch-9.json', JSON.stringify(result, null, 2));
console.log('Written to C:/tmp/sf-batch-9.json');
