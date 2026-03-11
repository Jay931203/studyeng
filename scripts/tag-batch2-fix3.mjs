import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TAGS_DIR = 'C:/Users/hyunj/studyeng/public/expression-tags';

function fixFile(videoId, fixes) {
  const filePath = join(TAGS_DIR, `${videoId}.json`);
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  for (const [idx, tags] of Object.entries(fixes)) {
    const i = parseInt(idx);
    if (i < data.sentences.length) data.sentences[i].tags = tags;
  }
  writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Fixed ${videoId} (${Object.keys(fixes).length} tags)`);
}

// 21Ki96Lsxhc - SNL Three Sad Virgins, sentences 47-58
fixFile("21Ki96Lsxhc", {
  47: { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X02"], vibe: "V13", power: [], grammar_intent: [], flags: [] },
  48: { functions: ["F11"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E07"], expression_types: ["X03"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  49: { functions: ["F27"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  50: { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  51: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E04"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  52: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E08"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  53: { functions: ["F01"], situation: "S14", cefr: "B2", register: "R5", emotions: ["E16"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  54: { functions: ["F43"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E15"], expression_types: ["X02"], vibe: "V13", power: [], grammar_intent: [], flags: [] },
  55: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E08"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  56: { functions: ["F06"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E08"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  57: { functions: ["F01"], situation: "S14", cefr: "B2", register: "R5", emotions: ["E16"], expression_types: ["X05"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  58: { functions: ["F53"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: ["is_fragment"] },
});

// TOq0dzxouts - SNL Rami Malek, sentences 30-37
fixFile("TOq0dzxouts", {
  30: { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  31: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  32: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  33: { functions: ["F38"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E02"], expression_types: ["X03"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  34: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E06"], expression_types: ["X03"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  35: { functions: ["F38"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E02"], expression_types: ["X03"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  36: { functions: ["F38"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E02"], expression_types: ["X03"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  37: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E04"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
});

// iBpgqRbEFVg - SNL JCPenney, sentences 29-33
fixFile("iBpgqRbEFVg", {
  29: { functions: ["F01"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X02"], vibe: "V13", power: [], grammar_intent: [], flags: [] },
  30: { functions: ["F01"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  31: { functions: ["F01"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  32: { functions: ["F01"], situation: "S01", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  33: { functions: ["F01"], situation: "S01", cefr: "A1", register: "R4", emotions: ["E01"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_fragment"] },
});

// Y6IUuxM_qlw - SNL Three Normal Goths, sentences 30-37
fixFile("Y6IUuxM_qlw", {
  30: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  31: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  32: { functions: ["F05"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E14"], expression_types: ["X06"], vibe: "V10", power: [], grammar_intent: [], flags: [] },
  33: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E02"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  34: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E09"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  35: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R5", emotions: ["E09"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  36: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R5", emotions: ["E09"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: ["is_lyrics"] },
  37: { functions: ["F53"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: ["is_fragment"] },
});

// AIuWQ41m7ys - SNL Angie, sentences 30-37
fixFile("AIuWQ41m7ys", {
  30: { functions: ["F05"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E07"], expression_types: ["X04"], vibe: "V06", power: [], grammar_intent: [], flags: [] },
  31: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E04"], expression_types: ["X05"], vibe: "V13", power: [], grammar_intent: [], flags: [] },
  32: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E02"], expression_types: ["X06"], vibe: "V05", power: [], grammar_intent: [], flags: [] },
  33: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  34: { functions: ["F01"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  35: { functions: ["F01"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: ["is_fragment"] },
  36: { functions: ["F01"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: ["is_fragment"] },
  37: { functions: ["F01"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: ["is_fragment"] },
});

// fYcDQ11vI0M - SNL Botox, sentences 28-32
fixFile("fYcDQ11vI0M", {
  28: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  29: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E08"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  30: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X03"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  31: { functions: ["F53"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  32: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E02"], expression_types: ["X03"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
});

// pT6It4rnh_o - SNL New Personality, sentences 27-34
fixFile("pT6It4rnh_o", {
  27: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  28: { functions: ["F25"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  29: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  30: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X04"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  31: { functions: ["F01"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E10"], expression_types: ["X04"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  32: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E12"], expression_types: ["X06"], vibe: "V10", power: [], grammar_intent: [], flags: [] },
  33: { functions: ["F01"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  34: { functions: ["F06"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
});

// kb60HrggbeQ - SNL Catwoman Cat, sentences 24-30
fixFile("kb60HrggbeQ", {
  24: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  25: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  26: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  27: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  28: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: [], flags: [] },
  29: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E14"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  30: { functions: ["F01"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: ["is_fragment"] },
});

// vvLZ2t5cm0Y - Gym Workout, sentences 15-17
fixFile("vvLZ2t5cm0Y", {
  15: { functions: ["F02"], situation: "S19", cefr: "B2", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: [], flags: [] },
  16: { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V17", power: [], grammar_intent: [], flags: [] },
  17: { functions: ["F02"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: [], flags: [] },
});

// 3ik6EwMNvXg - Simon Sinek, sentences 30-41
fixFile("3ik6EwMNvXg", {
  30: { functions: ["F02"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: [], flags: [] },
  31: { functions: ["F02"], situation: "S19", cefr: "B2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: ["G17"], flags: [] },
  32: { functions: ["F01"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: ["G04"], flags: [] },
  33: { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  34: { functions: ["F01"], situation: "S19", cefr: "A1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  35: { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E03"], expression_types: ["X04"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  36: { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  37: { functions: ["F02"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  38: { functions: ["F01"], situation: "S19", cefr: "B2", register: "R3", emotions: ["E15"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  39: { functions: ["F02"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  40: { functions: ["F01"], situation: "S19", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  41: { functions: ["F01"], situation: "S19", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
});

console.log('\nAll remaining fallback tags fixed!');
