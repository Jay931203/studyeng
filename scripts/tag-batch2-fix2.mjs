import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TAGS_DIR = 'C:/Users/hyunj/studyeng/public/expression-tags';

function fixFile(videoId, fixes) {
  const filePath = join(TAGS_DIR, `${videoId}.json`);
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));

  for (const [idx, tags] of Object.entries(fixes)) {
    const i = parseInt(idx);
    if (i < data.sentences.length) {
      data.sentences[i].tags = tags;
    }
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Fixed ${videoId} (${Object.keys(fixes).length} tags updated)`);
}

// Fix 4hX9o6ghEGI - last 3 sentences
fixFile("4hX9o6ghEGI", {
  9: { functions: ["F43"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E15"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  10: { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  11: { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E08"], expression_types: ["X06"], vibe: "V06", power: [], grammar_intent: [], flags: [] },
});

// Fix qCzWL9OPpwE - sentences 64-81 (the ending of the Newark flight skit)
fixFile("qCzWL9OPpwE", {
  64: { functions: ["F01"], situation: "S14", cefr: "B2", register: "R4", emotions: ["E06"], expression_types: ["X05"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  65: { functions: ["F01"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  66: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  67: { functions: ["F34"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E13"], expression_types: ["X02"], vibe: "V07", power: [], grammar_intent: [], flags: [] },
  68: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  69: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V16", power: [], grammar_intent: [], flags: [] },
  70: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E13"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  71: { functions: ["F02"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E13"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  72: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E13"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  73: { functions: ["F02"], situation: "S14", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V16", power: ["P01"], grammar_intent: [], flags: [] },
  74: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E12"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] },
  75: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  76: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  77: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  78: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V15", power: [], grammar_intent: [], flags: [] },
  79: { functions: ["F01"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  80: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E13"], expression_types: ["X07"], vibe: "V07", power: [], grammar_intent: [], flags: [] },
  81: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E13"], expression_types: ["X07"], vibe: "V07", power: [], grammar_intent: [], flags: [] },
});

console.log('\nAll fixes applied!');
