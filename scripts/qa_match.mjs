// QA check: verify specific expected matches
const results = JSON.parse(require('fs').readFileSync('src/data/match-results/batch-3.json', 'utf8'));
const batch = JSON.parse(require('fs').readFileSync('src/data/transcript-batches/batch-3.json', 'utf8'));

// Check 5TBbuIanjrI (Breaking Bad) - "work cut out for us"
console.log('=== 5TBbuIanjrI Breaking Bad ===');
console.log('Sent 1:', batch['5TBbuIanjrI'][1]);
const bbMatches = results['5TBbuIanjrI'].map(m => m.canonical + ' @ ' + m.sentenceIdx);
console.log(bbMatches);

// Check 6pQgbEEFPq0 (When Harry Met Sally - fake it scene)
console.log('\n=== 6pQgbEEFPq0 WHMS ===');
console.log('All sentences:');
for (const [k,v] of Object.entries(batch['6pQgbEEFPq0'])) console.log(k, v);
console.log('Matches:');
console.log(results['6pQgbEEFPq0']);

// Check 52SG2-g54X4 (Good Will Hunting)
console.log('\n=== 52SG2-g54X4 Good Will Hunting ===');
console.log(results['52SG2-g54X4']);
