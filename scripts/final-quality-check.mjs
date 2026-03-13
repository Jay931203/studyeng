import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:/Users/hyunj/studyeng/src/data/match-results-v3/batch-0.json', 'utf8'));

console.log('=== Final Quality Check ===');
console.log(`Total records: ${data.length}`);
console.log(`With surfaceForm: ${data.filter(x => x.surfaceForm !== null).length}`);
console.log(`Null surfaceForm: ${data.filter(x => x.surfaceForm === null).length}`);

// Distribution by extra words
const dist = {};
for (const item of data) {
  if (!item.surfaceForm) { dist['null'] = (dist['null'] || 0) + 1; continue; }
  const exprWC = (item.exprId.match(/[a-z']+/gi) || []).length;
  const sfWC = (item.surfaceForm.match(/[a-z']+/gi) || []).length;
  const key = `+${sfWC - exprWC}`;
  dist[key] = (dist[key] || 0) + 1;
}
console.log('\nExtra word distribution (sfWords - exprWords):');
for (const [k, v] of Object.entries(dist).sort()) {
  console.log(`  ${k}: ${v}`);
}

// Sample some interesting cases
console.log('\n--- Object-insertion examples ---');
const withGap = data.filter(x => {
  if (!x.surfaceForm) return false;
  const exprWC = (x.exprId.match(/[a-z']+/gi) || []).length;
  const sfWC = (x.surfaceForm.match(/[a-z']+/gi) || []).length;
  return sfWC - exprWC >= 1 && sfWC - exprWC <= 2;
}).slice(0, 10);
for (const w of withGap) {
  console.log(`  "${w.exprId}" → "${w.surfaceForm}"`);
}

// Sample colloquial expansions
console.log('\n--- Colloquial expansion examples ---');
const colloquial = ['gonna', 'gotta', 'wanna', "i'm", "i'll", "i'd"];
for (const expr of colloquial) {
  const matches = data.filter(x => x.exprId === expr && x.surfaceForm);
  if (matches.length > 0) {
    console.log(`  "${expr}" → "${matches[0].surfaceForm}" | en: "${matches[0].en?.slice(0, 60)}"`);
  }
}

// Sample first record structure
console.log('\n--- First record ---');
console.log(JSON.stringify(data[0], null, 2));
