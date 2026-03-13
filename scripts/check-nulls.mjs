import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:/Users/hyunj/studyeng/src/data/match-results-v3/batch-0.json', 'utf8'));
const nulls = data.filter(x => x.surfaceForm === null);

console.log('Null cases:');
for (const n of nulls) {
  console.log('\nexprId:', n.exprId);
  console.log('en (full):', n.en);
}

// Quality check - wide matches
const wide = data.filter(x => {
  if (!x.surfaceForm) return false;
  const exprWC = (x.exprId.match(/[a-z']+/gi) || []).length;
  const sfWC = (x.surfaceForm.match(/[a-z']+/gi) || []).length;
  return sfWC - exprWC > 2;
});
console.log(`\nMatches with more than 2 extra words: ${wide.length}`);
for (const w of wide.slice(0, 20)) {
  const exprWC = (w.exprId.match(/[a-z']+/gi) || []).length;
  const sfWC = (w.surfaceForm.match(/[a-z']+/gi) || []).length;
  console.log(`  [+${sfWC - exprWC}] exprId: "${w.exprId}" → sf: "${w.surfaceForm}"`);
}
