/**
 * Index words from new transcript files into word-index.json
 * Matches words from word-entries.json against transcript subtitles
 * using word-boundary regex and the pre-defined forms array.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');

// Load data
console.log('Loading data...');
const newVideoIds = JSON.parse(readFileSync(join(ROOT, 'output/new-video-ids.json'), 'utf8'));
const wordEntries = JSON.parse(readFileSync(join(ROOT, 'src/data/word-entries.json'), 'utf8'));
const wordIndex = JSON.parse(readFileSync(join(ROOT, 'src/data/word-index.json'), 'utf8'));

// Filter to only videos with transcripts and not already indexed
const videosToProcess = newVideoIds.filter(id => {
  if (wordIndex[id]) return false; // already indexed
  return existsSync(join(ROOT, 'public/transcripts', id + '.json'));
});

console.log(`Videos to process: ${videosToProcess.length} (of ${newVideoIds.length} total IDs)`);

// Build word lookup: map from surface form → wordId
// Use the forms array from word-entries (already includes inflections)
const formToWord = new Map();
const wordIds = Object.keys(wordEntries);

for (const wordId of wordIds) {
  const entry = wordEntries[wordId];
  const forms = entry.forms || [entry.id];
  for (const form of forms) {
    const lower = form.toLowerCase();
    if (!formToWord.has(lower)) {
      formToWord.set(lower, []);
    }
    formToWord.get(lower).push({ wordId: entry.id, surfaceForm: form.toLowerCase() });
  }
}

console.log(`Word forms indexed: ${formToWord.size} forms from ${wordIds.length} words`);

// Build regex patterns for all forms (batch by first letter for perf)
// We'll use a single big regex approach: extract all words from text, then look up
const MAX_MATCHES_PER_VIDEO = 50;

let totalNewMatches = 0;
const uniqueWordsMatched = new Set();
let videosProcessed = 0;

for (const videoId of videosToProcess) {
  const transcriptPath = join(ROOT, 'public/transcripts', videoId + '.json');
  const transcript = JSON.parse(readFileSync(transcriptPath, 'utf8'));

  const matches = [];
  const matchedWords = new Set(); // track first occurrence per word

  for (let sentenceIdx = 0; sentenceIdx < transcript.length; sentenceIdx++) {
    if (matches.length >= MAX_MATCHES_PER_VIDEO) break;

    const sub = transcript[sentenceIdx];
    if (!sub.en) continue;

    const text = sub.en.toLowerCase();
    // Extract all words from the text
    const wordsInText = text.match(/[a-z']+/g);
    if (!wordsInText) continue;

    // Also check multi-word by testing each form against the text with word boundaries
    // But first, do the fast path: direct word lookup
    const checkedForms = new Set();

    for (const w of wordsInText) {
      if (checkedForms.has(w)) continue;
      checkedForms.add(w);

      const entries = formToWord.get(w);
      if (!entries) continue;

      for (const { wordId, surfaceForm } of entries) {
        if (matchedWords.has(wordId)) continue;
        if (matches.length >= MAX_MATCHES_PER_VIDEO) break;

        matchedWords.add(wordId);
        uniqueWordsMatched.add(wordId);
        matches.push({
          wordId,
          sentenceIdx,
          en: sub.en,
          ko: sub.ko,
          surfaceForm: w
        });
      }
    }
  }

  if (matches.length > 0) {
    wordIndex[videoId] = matches;
    totalNewMatches += matches.length;
  } else {
    wordIndex[videoId] = [];
  }

  videosProcessed++;
  if (videosProcessed % 20 === 0) {
    console.log(`  Processed ${videosProcessed}/${videosToProcess.length} videos (${totalNewMatches} matches so far)`);
  }
}

console.log('\n--- Results ---');
console.log(`Videos processed: ${videosProcessed}`);
console.log(`Total new word matches: ${totalNewMatches}`);
console.log(`Unique words matched: ${uniqueWordsMatched.size}`);

// Save
console.log('\nSaving word-index.json...');
writeFileSync(join(ROOT, 'src/data/word-index.json'), JSON.stringify(wordIndex, null, 2), 'utf8');
console.log('Done!');
