const fs = require('fs');
const path = require('path');

const transcriptDir = path.join(__dirname, '..', 'public', 'transcripts');
const seedPath = path.join(__dirname, '..', 'src', 'data', 'seed-videos.ts');

// Get IDs that have transcripts
const hasTranscript = new Set(
  fs.readdirSync(transcriptDir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
);

// Read seed file
const content = fs.readFileSync(seedPath, 'utf-8');
const lines = content.split('\n');

// Find youtubeIds without transcripts
const noTranscriptIds = new Set();
for (const line of lines) {
  const m = line.match(/youtubeId:\s*'([^']+)'/);
  if (m && !hasTranscript.has(m[1])) {
    noTranscriptIds.add(m[1]);
  }
}

console.log('Videos without transcripts:', noTranscriptIds.size);
console.log('IDs:', [...noTranscriptIds].join(', '));

// Remove video blocks that contain these IDs
const result = [];
let i = 0;
while (i < lines.length) {
  const line = lines[i];

  // Check if this line is the start of a video block (opening brace within seedVideos array)
  if (line.trim() === '{') {
    // Collect the block until closing },
    const blockLines = [line];
    let j = i + 1;
    while (j < lines.length && lines[j].trim() !== '},') {
      blockLines.push(lines[j]);
      j++;
    }
    if (j < lines.length) {
      blockLines.push(lines[j]); // include the },
    }

    const blockText = blockLines.join('\n');
    const idMatch = blockText.match(/youtubeId:\s*'([^']+)'/);

    if (idMatch && noTranscriptIds.has(idMatch[1])) {
      // Skip this block
      // Also check if the line before was a comment like "// --- ..."
      if (result.length > 0 && result[result.length - 1].trim().startsWith('// ---')) {
        result.pop(); // remove the comment too
      }
      console.log('  Removed:', idMatch[1]);
      i = j + 1;
      continue;
    }
  }

  result.push(lines[i]);
  i++;
}

// Update series episode counts based on remaining videos
const remaining = result.join('\n');
const seriesCounts = {};
const seriesRegex = /seriesId:\s*'([^']+)'/g;
let match;
while ((match = seriesRegex.exec(remaining)) !== null) {
  seriesCounts[match[1]] = (seriesCounts[match[1]] || 0) + 1;
}
console.log('\nSeries counts:', JSON.stringify(seriesCounts, null, 2));

// Update episodeCount in series definitions
let finalContent = result.join('\n');
for (const [seriesId, count] of Object.entries(seriesCounts)) {
  // Match: id: 'seriesId', ... episodeCount: N
  const regex = new RegExp(
    `(id:\\s*'${seriesId}'[\\s\\S]*?episodeCount:\\s*)(\\d+)`,
    'g'
  );
  finalContent = finalContent.replace(regex, `$1${count}`);
}

// Remove series with 0 episodes
const seriesToRemove = [];
const allSeriesIds = [...finalContent.matchAll(/id:\s*'([^']+)'[\s\S]*?episodeCount:\s*(\d+)/g)];
// Find series in the series array that have no videos
const seriesBlockRegex = /\{[\s\S]*?id:\s*'([^']+)'[\s\S]*?episodeCount:\s*\d+[\s\S]*?\}/g;

fs.writeFileSync(seedPath, finalContent, 'utf-8');
console.log('\nDone! Removed', noTranscriptIds.size, 'videos. Lines:', lines.length, '->', finalContent.split('\n').length);
