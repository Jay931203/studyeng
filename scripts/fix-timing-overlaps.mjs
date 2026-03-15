#!/usr/bin/env node
/**
 * Fix timing overlaps in transcript files.
 * If entry[i].end > entry[i+1].start, set entry[i].end = entry[i+1].start
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const TRANSCRIPTS_DIR = join(process.cwd(), 'public', 'transcripts');

function round2(v) {
  return Math.round(v * 100) / 100;
}

async function main() {
  const files = (await readdir(TRANSCRIPTS_DIR)).filter(f => f.endsWith('.json'));
  console.log(`Scanning ${files.length} transcript files for timing overlaps...`);

  let filesFixed = 0;
  let totalOverlaps = 0;

  for (const file of files) {
    try {
      const data = JSON.parse(await readFile(join(TRANSCRIPTS_DIR, file), 'utf-8'));
      if (!Array.isArray(data) || data.length < 2) continue;

      let modified = false;
      let overlaps = 0;

      for (let i = 0; i < data.length - 1; i++) {
        if (data[i].end > data[i + 1].start + 0.01) { // 10ms tolerance
          data[i].end = round2(data[i + 1].start);
          // Ensure end > start (minimum 0.1s segment)
          if (data[i].end <= data[i].start) {
            data[i].end = round2(data[i].start + 0.1);
          }
          modified = true;
          overlaps++;
        }
      }

      if (modified) {
        await writeFile(join(TRANSCRIPTS_DIR, file), JSON.stringify(data, null, 2) + '\n', 'utf-8');
        filesFixed++;
        totalOverlaps += overlaps;
      }
    } catch (e) {
      // skip parse errors
    }
  }

  console.log(`\n=== Timing Overlap Fix ===`);
  console.log(`Files fixed: ${filesFixed}`);
  console.log(`Total overlaps corrected: ${totalOverlaps}`);
}

main().catch(console.error);
