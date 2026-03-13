const fs = require('fs');
const results = JSON.parse(fs.readFileSync('C:/Users/hyunj/studyeng/src/data/match-results/batch-8.json'));

// Verify structure
let ok = true;
for (const [vid, matches] of Object.entries(results)) {
  for (const m of matches) {
    if (typeof m.canonical !== 'string' || typeof m.sentenceIdx !== 'number') {
      console.log('INVALID:', vid, m);
      ok = false;
    }
  }
}
console.log('Structure valid:', ok);
console.log('Videos with matches:', Object.keys(results).length);
console.log('Total matches:', Object.values(results).reduce((a,v) => a + v.length, 0));

// List all videos in batch
const batch = JSON.parse(fs.readFileSync('C:/Users/hyunj/studyeng/src/data/transcript-batches/batch-8.json'));
const batchVids = Object.keys(batch);
const matchedVids = Object.keys(results);
console.log('Batch videos total:', batchVids.length);
console.log('Videos with 0 matches:', batchVids.filter(v => !matchedVids.includes(v)));

// Sample a few matched expressions to verify canonicals exist
const canonicals = new Set(fs.readFileSync('C:/Users/hyunj/studyeng/src/data/canonical-list.txt', 'utf8').split('\n').map(l => l.trim()).filter(l => l));
let badCanonicals = [];
for (const [vid, matches] of Object.entries(results)) {
  for (const m of matches) {
    if (!canonicals.has(m.canonical)) {
      badCanonicals.push(m.canonical);
    }
  }
}
if (badCanonicals.length > 0) {
  console.log('BAD canonicals (not in list):', [...new Set(badCanonicals)].slice(0, 10));
} else {
  console.log('All canonicals verified in list!');
}
