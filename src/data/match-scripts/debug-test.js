function variantInSentence(sentNorm, sentExpanded, v) {
  const esc = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(?:^|\\s)' + esc + '(?:\\s|$)', 'i');
  return re.test(sentNorm) || re.test(sentExpanded) ||
         sentNorm.includes(' ' + v + ' ') || sentExpanded.includes(' ' + v + ' ') ||
         sentNorm.startsWith(v + ' ') || sentExpanded.startsWith(v + ' ') ||
         sentNorm.endsWith(' ' + v) || sentExpanded.endsWith(' ' + v) ||
         sentNorm === v || sentExpanded === v;
}

// Test sign out
const s1 = 'did you notice a sign out in the front of my house that said dead nigger storage';
console.log('"sign out" in sign sentence:', variantInSentence(s1, s1, 'sign out'));
console.log('"sign in" in sign sentence:', variantInSentence(s1, s1, 'sign in'));

// Test go up in wake up sentence
const s2 = 'so in this video we ll go from the moment i wake up until about the end of my work day';
console.log('"go up" in wake sentence (direct):', variantInSentence(s2, s2, 'go up'));
// gap matching
const re2 = new RegExp('(?:^|\\s)go\\b.{0,40}\\bup(?:\\s|$)');
console.log('"go...up" (phrasal gap) in wake sentence:', re2.test(s2));

// Test "woke" in wake up context
const s3 = 'so in this video we ll go from the moment i wake up until about the end of my work day';
console.log('"woke" in wake sentence:', variantInSentence(s3, s3, 'woke'));
