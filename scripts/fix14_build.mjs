import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('C:/Users/hyunj/studyeng/src/data/subtitle-fix-batches/fix-14.json', 'utf8'));

// Build the result with all fixes
const result = {};

// Initialize all video IDs with empty objects
for (const vid of Object.keys(data)) {
  result[vid] = {};
}

// ===== Rj1RS3738VE =====
// Seg 0: "has never happened before..." - starts lowercase
result['Rj1RS3738VE']['0'] = "Has never happened before. I forgot to fill the car up. Here we go. Okay.";

// ===== tYFaeT0PxIM =====
// Seg 0: "never brought in a CEO..." - starts lowercase
result['tYFaeT0PxIM']['0'] = "Never brought in a CEO, and he was a teenager.";

// ===== UnierMA90D4 =====
// Seg 0: "how you were, fine..." - starts lowercase
result['UnierMA90D4']['0'] = "How you were, fine, how are you, fine.";

// ===== 5TBbuIanjrI =====
// Seg 0: "account for the blue color..." - starts lowercase
result['5TBbuIanjrI']['0'] = "Account for the blue color, but if that is our competition,";

// ===== bhKCGlubXa4 =====
// Seg 3: two sentences run together without punctuation
result['bhKCGlubXa4']['3'] = "Matthew Broderick can eat a d**k. He peaked at 17.";

// ===== 1mlFdXpcf9c =====
// Seg 0: "on 140, what's your margin?" - starts lowercase
result['1mlFdXpcf9c']['0'] = "On 140, what's your margin?";

// ===== hUktzolvlP4 =====
// Seg 16: "Oh a slide whistle!" - missing comma after "Oh"
result['hUktzolvlP4']['16'] = "Oh, a slide whistle!";

// ===== ZoEUYdsrJpw =====
// Seg 2: missing period before "Hey"
result['ZoEUYdsrJpw']['2'] = "♪ We know him and this ain't so concerning. Hey, Blake.";

// ===== zGekmhnSqY4 =====
// Seg 0: "of smart list..." - starts lowercase
result['zGekmhnSqY4']['0'] = "Of smart list Sean Hayes, Will Arnett and a guy who's never really been my thing, Jason Bateman.";

// ===== Nxe8-9YOnnk =====
// Seg 0: "out of himself..." - starts lowercase
result['Nxe8-9YOnnk']['0'] = "Out of himself in front of the whole damn country the Congressional Medal of Honor.";

// Write output
const outputPath = 'C:/Users/hyunj/studyeng/src/data/subtitle-fixes/fix-14.json';
writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
console.log('Written to', outputPath);

// Show summary
for (const [vid, fixes] of Object.entries(result)) {
  if (Object.keys(fixes).length > 0) {
    console.log('\n' + vid + ':');
    for (const [idx, text] of Object.entries(fixes)) {
      const orig = data[vid][idx];
      console.log('  [' + idx + '] ORIG: ' + orig);
      console.log('  [' + idx + '] FIX:  ' + text);
    }
  }
}
