import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:/Users/hyunj/studyeng/src/data/match-results-v3/batch-0.json', 'utf8'));

// Check surface forms wider than the expression by more than N words
const badMatches = [];
for (const item of data) {
  if (!item.surfaceForm) continue;
  const exprWordCount = (item.exprId.match(/[a-z']+/gi) || []).length;
  const sfWordCount = (item.surfaceForm.match(/[a-z']+/gi) || []).length;
  const extraWords = sfWordCount - exprWordCount;
  // Flag if extra words > 2 (too much gap)
  if (extraWords > 3) {
    badMatches.push({ exprId: item.exprId, sf: item.surfaceForm, en: item.en?.slice(0, 80), extra: extraWords });
  }
}

console.log(`Potentially bad matches (extra words > 3): ${badMatches.length}`);
for (const b of badMatches.slice(0, 30)) {
  console.log(`  exprId: "${b.exprId}" (${b.extra} extra) → sf: "${b.sf}" | en: "${b.en}"`);
}

// Also count by expression word count vs sf word count
const stats = { same: 0, plus1: 0, plus2: 0, plus3: 0, plus4plus: 0 };
for (const item of data) {
  if (!item.surfaceForm) continue;
  const exprWC = (item.exprId.match(/[a-z']+/gi) || []).length;
  const sfWC = (item.surfaceForm.match(/[a-z']+/gi) || []).length;
  const extra = sfWC - exprWC;
  if (extra === 0) stats.same++;
  else if (extra === 1) stats.plus1++;
  else if (extra === 2) stats.plus2++;
  else if (extra === 3) stats.plus3++;
  else stats.plus4plus++;
}
console.log('\nExtra words distribution:', stats);
