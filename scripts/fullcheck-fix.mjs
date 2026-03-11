import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = 'C:/Users/hyunj/studyeng';
const TRANSCRIPTS_DIR = join(ROOT, 'public/transcripts');

let fixCount = 0;

function fixFile(videoId, transformer) {
  const filePath = join(TRANSCRIPTS_DIR, `${videoId}.json`);
  if (!existsSync(filePath)) return false;
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  const result = transformer(data);
  if (result) {
    writeFileSync(filePath, JSON.stringify(result, null, 2) + '\n', 'utf-8');
    fixCount++;
    return true;
  }
  return false;
}

// Fix 1: Tighten timing_too_long entries where a short phrase has an unreasonably long end time
// These are cases where the subtitle is a short phrase but the duration spans 30+ seconds
const timingFixes = [
  // { videoId, subtitleIndex, reasonable end time based on phrase length }
  { id: 'dnRxQ3dcaQk', idx: 3, newEnd: 32 }, // "Follow me." - give 2 seconds
  { id: 'dOxiSsBTHbk', idx: 7, newEnd: 57 }, // "Oh, no!" - give 2 seconds
  { id: 'GIUhpzv47YQ', idx: 5, newEnd: 22 }, // "Stay." - give 2 seconds
  { id: 'DU000lCfmBs', idx: 1, newEnd: 30 }, // "Rodney Dorman, everybody!" - give 3 seconds
  { id: 'DyDfgMOUjCI', idx: 1, newEnd: 15 }, // "I have taken out my Invisalign..." - give 5s
  { id: 'bat8-rxEpdo', idx: 1, newEnd: 61 }, // "Freeze!" - give 2 seconds
  { id: '8gcRTMr-rlg', idx: 1, newEnd: 62 }, // "♪" music - give 3 seconds
];

for (const { id, idx, newEnd } of timingFixes) {
  fixFile(id, (data) => {
    if (data[idx] && data[idx].end - data[idx].start > 30) {
      const oldEnd = data[idx].end;
      data[idx].end = newEnd;
      console.log(`FIX timing: ${id} idx ${idx}: end ${oldEnd} -> ${newEnd} (en: "${data[idx].en.substring(0, 40)}")`);
      return data;
    }
    return null;
  });
}

// Fix 2: Music-only single subtitle files - these clips are just music with no dialogue
// They aren't useful for an English learning app. However, we shouldn't delete them -
// just note them in the report. We can tighten their timing though.
const musicOnlyFiles = [
  '-FW9Sqxb-4o', // ♪♪ 29-88.6
  'aWIE0PX1uXk', // ♪♪ 0-56.84
  'bp6hhq8DdgU', // ♪♪ 24-86
  'Ds0R1eApo9w', // ♪♪ 0-56.86
  'e2wm_VRROvA', // ♪♪ 22-82
  'F02_MVdAqCk', // ♪♪ 37-69.02
  'KVkTAhSxV9w', // ♪♪ 6-68
  'kVm5k99PnBk', // ♪♪ 16-78.06
  '3mZj5N-zKRA', // ♪♪ 16-81
  '403jzB62dAs', // ♪♪ 11-71
  '0EGPLZ2AnIw', // only "you"
];

// Fix 3: The iK6Sg-wof7Y file - just a URL, completely useless transcript
// Leave as is (it's just 1 subtitle with a URL)

// Fix 4: Clean up Cf2Gec_2fMY - just "." as en text, broken
// Leave as is

// Fix 5: Some timing_too_long in minor files that are music segments
const musicTimingFixes = [
  { id: '4PwDFddpo4c', idx: 0 }, // ♪♪ 29-61.52 -> keep at 5s
  { id: 'DW4Q9bdE_BY', idx: 0 }, // ♪♪ 29-74.04 -> keep at 5s
  { id: 'gCZBY7a8kqE', idx: 4 }, // -♪♪ 38-75 -> keep at 5s
];

for (const { id, idx } of musicTimingFixes) {
  fixFile(id, (data) => {
    if (data[idx] && data[idx].en.includes('♪') && data[idx].end - data[idx].start > 30) {
      const oldEnd = data[idx].end;
      data[idx].end = data[idx].start + 5;
      console.log(`FIX music timing: ${id} idx ${idx}: end ${oldEnd} -> ${data[idx].end} (music segment)`);
      return data;
    }
    return null;
  });
}

// Fix 6: Long timing for non-music clips too
const longTimingMore = [
  { id: '-_zYn-HHcyA', idx: 0 }, // ♪♪ 0-57.04
  { id: '0AhpcCST5xY', idx: 0 }, // "Ready, Steady, Go!" 29-66 -> 32
];

fixFile('-_zYn-HHcyA', (data) => {
  if (data[0] && data[0].en.includes('♪') && data[0].end - data[0].start > 30) {
    const oldEnd = data[0].end;
    data[0].end = data[0].start + 5;
    console.log(`FIX music timing: -_zYn-HHcyA idx 0: end ${oldEnd} -> ${data[0].end}`);
    return data;
  }
  return null;
});

fixFile('0AhpcCST5xY', (data) => {
  if (data[0] && data[0].end - data[0].start > 30) {
    const oldEnd = data[0].end;
    data[0].end = data[0].start + 3;
    console.log(`FIX timing: 0AhpcCST5xY idx 0: end ${oldEnd} -> ${data[0].end}`);
    return data;
  }
  return null;
});

console.log(`\nTotal fixes applied: ${fixCount}`);
