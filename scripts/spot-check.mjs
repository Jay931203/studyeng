import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:/Users/hyunj/studyeng/src/data/match-results-v3/batch-0.json', 'utf8'));

// Records where sf has more words than exprId
const withGap = data.filter(x => {
  if (!x.surfaceForm) return false;
  const a = (x.exprId.match(/\S+/g) || []).length;
  const b = (x.surfaceForm.match(/\S+/g) || []).length;
  return b > a;
});
console.log(`Records where sf has more space-separated tokens than exprId: ${withGap.length}`);
withGap.slice(0, 15).forEach(x => {
  console.log(`  exprId: "${x.exprId}" → sf: "${x.surfaceForm}" | en: "${x.en?.slice(0, 60)}"`);
});

// Also show some complex / multi-word expressions
const multiWord = data.filter(x => x.exprId.includes(' ')).slice(0, 10);
console.log('\nMulti-word expression samples:');
multiWord.forEach(x => {
  console.log(`  exprId: "${x.exprId}" → sf: "${x.surfaceForm}"`);
});
