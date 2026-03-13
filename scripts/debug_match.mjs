// Debug 'for another' false positive
const sent = 'account for the blue color, but if that is our competition,';
const sentLow = sent.toLowerCase();
const sentTokens = sentLow.replace(/[^\w\s]/g,' ').split(/\s+/).filter(Boolean);
console.log('Tokens:', sentTokens);
console.log('Has for?', sentTokens.includes('for'));
console.log('Has another?', sentTokens.includes('another'));
console.log('substring for another:', sentLow.includes('for another'));

// Check the expanded version
const expanded = sentLow; // no contractions here
console.log('expanded tokens:', expanded.replace(/[^\w\s]/g,' ').split(/\s+/).filter(Boolean));

// Simulate flexMatchStrict for ['for','another'] against sentTokens
const canWords = ['for', 'another'];
for (let start = 0; start <= sentTokens.length - 1; start++) {
  let ci = 0, si = start, totalGap = 0;
  while (ci < canWords.length && si < sentTokens.length) {
    if (canWords[ci] === sentTokens[si]) {
      ci++; si++;
    } else {
      si++;
      totalGap++;
      if (totalGap > 4) break;
    }
  }
  if (ci === canWords.length && totalGap <= 4) {
    console.log('MATCH at start', start, '- ci:', ci, 'gap:', totalGap);
    console.log('matching window:', sentTokens.slice(start, si));
  }
}
