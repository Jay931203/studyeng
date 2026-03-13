import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:/Users/hyunj/studyeng/src/data/match-results-v3/batch-0.json', 'utf8'));
const nulls = data.filter(x => x.surfaceForm === null);

// Look at gotta cases
const gotta = nulls.filter(x => x.exprId === 'gotta').slice(0, 5);
console.log('gotta cases:');
for (const g of gotta) console.log(' en:', g.en);

// Look at contractions
const contractions = nulls.filter(x => x.exprId.includes("'")).slice(0, 10);
console.log('\nContraction expr cases:');
for (const c of contractions) console.log(' exprId:', c.exprId, '| en:', c.en?.slice(0, 60));

// Look at 'i like it'
const ilike = nulls.filter(x => x.exprId === 'i like it').slice(0, 5);
console.log('\ni like it cases:');
for (const i of ilike) console.log(' en:', i.en);

// first-word-absent cases
const absent = nulls.filter(item => {
  const en = (item.en || '').toLowerCase();
  const words = item.exprId.toLowerCase().match(/[a-z']+/g) || [];
  const firstWordAbsent = words.length > 0 && !en.includes(words[0]);
  return firstWordAbsent;
}).slice(0, 20);
console.log('\nFirst word absent cases:');
for (const a of absent) console.log(' exprId:', a.exprId, '| en:', a.en?.slice(0, 70));

// Contracted/pronoun variants
console.log('\n--- Pronoun flexibility needed ---');
const pronounMismatches = nulls.filter(item => {
  const expr = item.exprId.toLowerCase();
  const en = (item.en || '').toLowerCase();
  // expr has 'i' but sentence has different subject
  return expr.startsWith('i ') || expr.startsWith("i'");
}).slice(0, 15);
for (const p of pronounMismatches) console.log(' exprId:', p.exprId, '| en:', p.en?.slice(0, 70));
