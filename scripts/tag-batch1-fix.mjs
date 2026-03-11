import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';

function hash(sentences) {
  const joined = sentences.map(s => s.en).join('|');
  return createHash('sha256').update(joined).digest('hex').slice(0, 16);
}

function fixFile(videoId, overrides) {
  const path = `C:/Users/hyunj/studyeng/public/expression-tags/${videoId}.json`;
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const transcript = JSON.parse(readFileSync(`C:/Users/hyunj/studyeng/public/transcripts/${videoId}.json`, 'utf8'));

  for (const [idx, tags] of Object.entries(overrides)) {
    const i = parseInt(idx);
    if (i < data.sentences.length) {
      data.sentences[i].tags = tags;
    }
  }
  data.transcriptHash = hash(transcript);
  writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`Fixed ${videoId}: ${Object.keys(overrides).length} sentences updated`);
}

// wXsNIFK8z7I - British Army Gamers, sentences 69-101 need fixing
// These are the latter half of the skit: more gamer soldier interviews, combat scenes, outro
fixFile('wXsNIFK8z7I', {
  69: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X05","X04"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] },
  70: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X04"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] },
  71: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X05"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] },
  72: { functions: ["F05"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X05","X04"], vibe: "V03", power: ["P04","P07"], grammar_intent: [], flags: [] },
  73: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X05"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] },
  74: { functions: ["F14"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E13"], expression_types: ["X05"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] },
  75: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X05"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] },
  76: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X05","X04"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] },
  77: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X04"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] },
  78: { functions: ["F06"], situation: "S14", cefr: "A2", register: "R3", emotions: ["E04"], expression_types: ["X02"], vibe: "V13", power: ["P01"], grammar_intent: ["G18"], flags: [] },
  79: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X02"], vibe: "V04", power: ["P08"], grammar_intent: ["G19"], flags: [] },
  80: { functions: ["F19"], situation: "S14", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V04", power: ["P01"], grammar_intent: ["G19"], flags: [] },
  81: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] },
  82: { functions: ["F02"], situation: "S14", cefr: "B2", register: "R3", emotions: ["E09"], expression_types: ["X05"], vibe: "V03", power: ["P04","P07"], grammar_intent: ["G22"], flags: ["is_narration"] },
  83: { functions: ["F02"], situation: "S14", cefr: "B2", register: "R3", emotions: ["E09"], expression_types: ["X05"], vibe: "V17", power: ["P07"], grammar_intent: [], flags: ["is_narration"] },
  84: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E14"], expression_types: ["X06"], vibe: "V11", power: ["P07"], grammar_intent: ["G13"], flags: [] },
  85: { functions: ["F02"], situation: "S14", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X08"], vibe: "V17", power: [], grammar_intent: [], flags: ["is_narration"] },
  86: { functions: ["F02"], situation: "S14", cefr: "B2", register: "R3", emotions: ["E09"], expression_types: ["X05"], vibe: "V03", power: ["P04"], grammar_intent: ["G22"], flags: ["is_narration"] },
  87: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X05"], vibe: "V03", power: ["P04","P11"], grammar_intent: [], flags: [] },
  88: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X05"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] },
  89: { functions: ["F01"], situation: "S14", cefr: "B2", register: "R3", emotions: ["E09"], expression_types: ["X05"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] },
  90: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R3", emotions: ["E11"], expression_types: ["X05"], vibe: "V03", power: ["P04","P11"], grammar_intent: [], flags: [] },
  91: { functions: ["F19"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X08"], vibe: "V04", power: ["P01"], grammar_intent: ["G19"], flags: [] },
  92: { functions: ["F06"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] },
  93: { functions: ["F19"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X02"], vibe: "V09", power: ["P01"], grammar_intent: ["G19"], flags: [] },
  94: { functions: ["F06"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E04"], expression_types: ["X02"], vibe: "V02", power: [], grammar_intent: [], flags: [] },
  95: { functions: ["F06"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E04"], expression_types: ["X02"], vibe: "V02", power: [], grammar_intent: [], flags: [] },
  96: { functions: ["F14"], situation: "S14", cefr: "B2", register: "R3", emotions: ["E13"], expression_types: ["X07"], vibe: "V04", power: ["P02"], grammar_intent: ["G01"], flags: [] },
  97: { functions: ["F01"], situation: "S14", cefr: "B1", register: "R3", emotions: ["E09"], expression_types: ["X07"], vibe: "V04", power: [], grammar_intent: [], flags: [] },
  98: { functions: ["F02"], situation: "S14", cefr: "B2", register: "R2", emotions: ["E09"], expression_types: ["X05","X04"], vibe: "V03", power: ["P04","P11"], grammar_intent: ["G22"], flags: ["is_narration"] },
  99: { functions: ["F25","F27"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X01"], vibe: "V01", power: ["P12"], grammar_intent: [], flags: [] },
  100: { functions: ["F27"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X01"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  101: { functions: ["F27"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E01"], expression_types: ["X01"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
});

// sdgvyJ7R23Y - Queen Victoria Christmas tree, sentences 18-20
fixFile('sdgvyJ7R23Y', {
  18: { functions: ["F06"], situation: "S01", cefr: "B1", register: "R2", emotions: ["E03"], expression_types: ["X05"], vibe: "V03", power: ["P04"], grammar_intent: ["G18"], flags: [] },
  19: { functions: ["F01"], situation: "S01", cefr: "B1", register: "R2", emotions: ["E03"], expression_types: ["X05"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] },
  20: { functions: ["F01"], situation: "S01", cefr: "A2", register: "R2", emotions: ["E03","E01"], expression_types: ["X03","X04"], vibe: "V03", power: ["P12"], grammar_intent: ["G20"], flags: [] },
});

// pYAnIBWl8z0 - stolen phone, sentence 15
fixFile('pYAnIBWl8z0', {
  15: { functions: ["F19"], situation: "S10", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X02"], vibe: "V02", power: ["P01"], grammar_intent: ["G19"], flags: [] },
});

// ZfaK6ncKynE - school lunchtime, sentences 48-94
// The remainder is about: cafeteria fights, freestyle rapping, staff lady incident, etc.
{
  const overrides = {};
  // 48-52: back to crazy stuff, chilling in cafeteria
  for (let i = 48; i <= 52; i++) {
    overrides[i] = { functions: ["F05"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E14"], expression_types: ["X06"], vibe: "V12", power: ["P07"], grammar_intent: [], flags: [] };
  }
  // 53-55: staff lady incident
  overrides[53] = { functions: ["F06"], situation: "S10", cefr: "B1", register: "R3", emotions: ["E04"], expression_types: ["X02"], vibe: "V13", power: ["P01"], grammar_intent: ["G19"], flags: [] };
  overrides[54] = { functions: ["F06"], situation: "S10", cefr: "A1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V06", power: [], grammar_intent: ["G18"], flags: [] };
  overrides[55] = { functions: ["F01"], situation: "S10", cefr: "B1", register: "R3", emotions: ["E04"], expression_types: ["X02"], vibe: "V13", power: ["P01"], grammar_intent: [], flags: [] };
  // 56-58: confusion, didn't know the kid
  overrides[56] = { functions: ["F01"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V06", power: ["P07"], grammar_intent: [], flags: [] };
  overrides[57] = { functions: ["F01"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V06", power: ["P07"], grammar_intent: [], flags: [] };
  overrides[58] = { functions: ["F05"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V06", power: ["P07"], grammar_intent: [], flags: [] };
  // 59: staff lady warning
  overrides[59] = { functions: ["F19"], situation: "S10", cefr: "A2", register: "R3", emotions: ["E04"], expression_types: ["X02"], vibe: "V02", power: ["P01"], grammar_intent: ["G23"], flags: [] };
  // 60-61: what just happened, embarrassment
  overrides[60] = { functions: ["F06"], situation: "S10", cefr: "A2", register: "R4", emotions: ["E03","E07"], expression_types: ["X06"], vibe: "V06", power: [], grammar_intent: ["G18"], flags: [] };
  overrides[61] = { functions: ["F06"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E07"], expression_types: ["X06"], vibe: "V06", power: ["P07"], grammar_intent: ["G18"], flags: [] };
  // 62-65: freestyling at lunch table
  overrides[62] = { functions: ["F19"], situation: "S10", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: ["G19"], flags: [] };
  overrides[63] = { functions: ["F01"], situation: "S10", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V03", power: ["P04"], grammar_intent: ["G18"], flags: [] };
  overrides[64] = { functions: ["F06"], situation: "S10", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V03", power: ["P04"], grammar_intent: ["G18"], flags: [] };
  // 65-68: lunch was lit, 200 kids making beats
  overrides[65] = { functions: ["F01"], situation: "S10", cefr: "A2", register: "R4", emotions: ["E10","E14"], expression_types: ["X06"], vibe: "V09", power: ["P07"], grammar_intent: [], flags: [] };
  overrides[66] = { functions: ["F01"], situation: "S10", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V09", power: ["P07"], grammar_intent: [], flags: [] };
  overrides[67] = { functions: ["F01"], situation: "S10", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V09", power: ["P07"], grammar_intent: [], flags: [] };
  overrides[68] = { functions: ["F05"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V09", power: ["P07"], grammar_intent: [], flags: [] };
  // 69: vice principal couldn't do anything
  overrides[69] = { functions: ["F01"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06","X04"], vibe: "V09", power: ["P04"], grammar_intent: [], flags: [] };
  // 70: smacking on tables
  overrides[70] = { functions: ["F05"], situation: "S10", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V09", power: ["P07"], grammar_intent: ["G21"], flags: [] };
  // 71: so funny
  overrides[71] = { functions: ["F01"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V03", power: ["P07"], grammar_intent: [], flags: [] };
  // 72: rapping over beat
  overrides[72] = { functions: ["F05"], situation: "S10", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V09", power: ["P07"], grammar_intent: [], flags: [] };
  // 73: get out the hood, teachers mad
  overrides[73] = { functions: ["F05"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V09", power: ["P07"], grammar_intent: [], flags: [] };
  // 74: everybody say, eggs bacon grits
  overrides[74] = { functions: ["F19"], situation: "S10", cefr: "A1", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: ["G19"], flags: [] };
  // 75: may I have your attention
  overrides[75] = { functions: ["F06"], situation: "S10", cefr: "A2", register: "R3", emotions: ["E09"], expression_types: ["X01"], vibe: "V12", power: ["P01"], grammar_intent: [], flags: [] };
  // 76: buddy Victor is single
  overrides[76] = { functions: ["F02"], situation: "S10", cefr: "A1", register: "R4", emotions: ["E01"], expression_types: ["X04","X06"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] };
  // 77: immature, one thing more attention
  overrides[77] = { functions: ["F05"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E14"], expression_types: ["X06"], vibe: "V12", power: ["P07"], grammar_intent: [], flags: [] };
  // 78: cafeteria fights
  overrides[78] = { functions: ["F01"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V11", power: ["P07"], grammar_intent: [], flags: [] };
  // 79: pay-per-view boxing
  overrides[79] = { functions: ["F05"], situation: "S10", cefr: "B2", register: "R4", emotions: ["E10"], expression_types: ["X06","X04"], vibe: "V11", power: ["P07","P04"], grammar_intent: [], flags: [] };
  // 80: ladies and gentlemen, Jamal
  overrides[80] = { functions: ["F25"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X04"], vibe: "V11", power: ["P04"], grammar_intent: [], flags: [] };
  // 81: let's go Jamal
  overrides[81] = { functions: ["F38"], situation: "S10", cefr: "A1", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V11", power: ["P10"], grammar_intent: ["G19"], flags: [] };
  // 82: in this corner, Marcus
  overrides[82] = { functions: ["F25"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X04"], vibe: "V11", power: ["P04"], grammar_intent: [], flags: [] };
  // 83: why you talk to my girl
  overrides[83] = { functions: ["F06"], situation: "S10", cefr: "A2", register: "R5", emotions: ["E04"], expression_types: ["X02","X06"], vibe: "V13", power: ["P02"], grammar_intent: ["G18"], flags: [] };
  // 84: Ooh. fight fight fight
  overrides[84] = { functions: ["F01"], situation: "S10", cefr: "A1", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: ["G19"], flags: [] };
  // 85: let's get ready to rumble
  overrides[85] = { functions: ["F19"], situation: "S10", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06","X04"], vibe: "V11", power: ["P04"], grammar_intent: ["G19"], flags: [] };
  // 86: Jamal threw milk carton
  overrides[86] = { functions: ["F05"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V11", power: ["P07"], grammar_intent: [], flags: [] };
  // 87: getting messy, better view
  overrides[87] = { functions: ["F05"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V11", power: ["P07"], grammar_intent: ["G21"], flags: [] };
  // 88: shout out cameramen
  overrides[88] = { functions: ["F27"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06","X04"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] };
  // 89: phone aiming at floor
  overrides[89] = { functions: ["F05"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06","X04"], vibe: "V03", power: ["P04","P07"], grammar_intent: [], flags: [] };
  // 90: bell rings, run to class
  overrides[90] = { functions: ["F05"], situation: "S10", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V09", power: ["P07"], grammar_intent: [], flags: [] };
  // 91: everybody run, can't be late
  overrides[91] = { functions: ["F19"], situation: "S10", cefr: "A1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: ["G19"], flags: [] };
  // 92: leave the crime scene
  overrides[92] = { functions: ["F01"], situation: "S10", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06","X04"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] };
  // 93: good times, cling cling
  overrides[93] = { functions: ["F01"], situation: "S10", cefr: "A2", register: "R4", emotions: ["E14"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] };
  // 94: subscribe, downstairs neighbors pissed
  overrides[94] = { functions: ["F02"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06","X04"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] };

  fixFile('ZfaK6ncKynE', overrides);
}

// sNrBSslS5RE - Walmart COVID, sentences 46-52
fixFile('sNrBSslS5RE', {
  46: { functions: ["F05"], situation: "S14", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V01", power: ["P07"], grammar_intent: [], flags: [] },
  47: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  48: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  49: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E04"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] },
  50: { functions: ["F01"], situation: "S14", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  51: { functions: ["F01"], situation: "S14", cefr: "A1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V01", power: [], grammar_intent: [], flags: [] },
  52: { functions: ["F02"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: ["G01","G19"], flags: [] },
});

// HwW0RdDjqks - Six Flags vlog, sentences 79-143
// These cover: Superman ride nervousness, ride reaction, phone lost, buying new phone, surprise
{
  const overrides = {};
  // 79-83: Superman nervousness & ride approach
  overrides[79] = { functions: ["F01"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V02", power: ["P07"], grammar_intent: ["G22"], flags: [] };
  overrides[80] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V02", power: [], grammar_intent: [], flags: [] };
  overrides[81] = { functions: ["F06"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X03"], vibe: "V02", power: ["P05"], grammar_intent: ["G19"], flags: [] };
  overrides[82] = { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: ["P07"], grammar_intent: [], flags: [] };
  overrides[83] = { functions: ["F53"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] };
  // 84-86: Cisco doesn't want to ride
  overrides[84] = { functions: ["F43"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V06", power: [], grammar_intent: [], flags: [] };
  overrides[85] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V06", power: [], grammar_intent: [], flags: [] };
  // 86: flying feeling
  overrides[86] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E10","E01"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: ["G20"], flags: [] };
  // 87: would never buy a picture
  overrides[87] = { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V12", power: ["P07"], grammar_intent: ["G01"], flags: [] };
  // 88: gonna hang it up
  overrides[88] = { functions: ["F34"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: ["G23"], flags: [] };
  // 89: decided to mic up again
  overrides[89] = { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V12", power: ["P07"], grammar_intent: [], flags: [] };
  // 90: I'm an idiot, always wanted to do
  overrides[90] = { functions: ["F06"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06","X04"], vibe: "V03", power: ["P04"], grammar_intent: ["G18"], flags: [] };
  // 91: front row Superman
  overrides[91] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] };
  // 92: Cisco bailed, it's okay
  overrides[92] = { functions: ["F43"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V10", power: ["P09"], grammar_intent: [], flags: [] };
  // 93: life is like a rollercoaster
  overrides[93] = { functions: ["F01"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V07", power: ["P10"], grammar_intent: [], flags: [] };
  // 94: ups and downs, extreme person
  overrides[94] = { functions: ["F01"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V07", power: ["P10"], grammar_intent: [], flags: [] };
  // 95: didn't think straight, front row
  overrides[95] = { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06","X04"], vibe: "V11", power: ["P07","P04"], grammar_intent: [], flags: [] };
  // 96: trying to act calm, tell a story
  overrides[96] = { functions: ["F01"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: ["P07"], grammar_intent: ["G21"], flags: [] };
  // 97: really quiet, feels like POV
  overrides[97] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V10", power: [], grammar_intent: ["G18"], flags: [] };
  // 98: POV from six flags videos
  overrides[98] = { functions: ["F01"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V10", power: [], grammar_intent: [], flags: [] };
  // 99: second time riding, close to drop
  overrides[99] = { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: ["P07"], grammar_intent: ["G21"], flags: [] };
  // 100: drop is insane
  overrides[100] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E05","E10"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: [], flags: [] };
  // 101: story time as going up
  overrides[101] = { functions: ["F34"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V11", power: [], grammar_intent: ["G23"], flags: [] };
  // 102: oh boy, life rollercoaster, drops
  overrides[102] = { functions: ["F01"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V07", power: ["P10"], grammar_intent: [], flags: [] };
  // 103: Oh! Woo!
  overrides[103] = { functions: ["F01"], situation: "S19", cefr: "A1", register: "R4", emotions: ["E10","E05"], expression_types: ["X06"], vibe: "V09", power: [], grammar_intent: ["G20"], flags: [] };
  // 104: able to do this as kid
  overrides[104] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: [], flags: [] };
  // 105: trying to see Cisco
  overrides[105] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: ["G21"], flags: [] };
  // 106: don't know if anyone can hear
  overrides[106] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] };
  // 107: felt a rush
  overrides[107] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V10", power: [], grammar_intent: [], flags: [] };
  // 108: something was missing
  overrides[108] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V16", power: [], grammar_intent: [], flags: [] };
  // 109: think I dropped my phone
  overrides[109] = { functions: ["F06"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V02", power: [], grammar_intent: [], flags: [] };
  // 110: on your seat?
  overrides[110] = { functions: ["F06"], situation: "S19", cefr: "A1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V02", power: [], grammar_intent: [], flags: [] };
  // 111: I swear to you
  overrides[111] = { functions: ["F34"], situation: "S19", cefr: "A1", register: "R4", emotions: ["E05"], expression_types: ["X02"], vibe: "V02", power: [], grammar_intent: [], flags: [] };
  // 112: phone lost on Superman
  overrides[112] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V11", power: ["P07"], grammar_intent: ["G03"], flags: [] };
  // 113: wasn't my phone, Cisco's
  overrides[113] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V11", power: ["P07"], grammar_intent: [], flags: [] };
  // 114: you're probably wondering
  overrides[114] = { functions: ["F06"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: ["P07"], grammar_intent: ["G18"], flags: [] };
  // 115: gave him my phone for recording
  overrides[115] = { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: ["P07"], grammar_intent: [], flags: [] };
  // 116: needed flash pass
  overrides[116] = { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: ["P07"], grammar_intent: [], flags: [] };
  // 117: held his phone in pocket
  overrides[117] = { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: ["P07"], grammar_intent: [], flags: [] };
  // 118: lost some footage
  overrides[118] = { functions: ["F01"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] };
  // 119: going through footage
  overrides[119] = { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: ["P07"], grammar_intent: [], flags: [] };
  // 120: did you catch it?
  overrides[120] = { functions: ["F06"], situation: "S19", cefr: "A1", register: "R4", emotions: ["E10"], expression_types: ["X06"], vibe: "V03", power: [], grammar_intent: ["G18"], flags: [] };
  // 121: worth losing the phone
  overrides[121] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E01"], expression_types: ["X06","X04"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] };
  // 122: can't make this up
  overrides[122] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V03", power: ["P07"], grammar_intent: [], flags: [] };
  // 123: hard feeling, gonna lose my phone
  overrides[123] = { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E05"], expression_types: ["X06"], vibe: "V02", power: ["P07"], grammar_intent: [], flags: [] };
  // 124: heart sank, where's phone
  overrides[124] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E05","E06"], expression_types: ["X06"], vibe: "V11", power: ["P07"], grammar_intent: [], flags: [] };
  // 125: phone destroyed, lost and found
  overrides[125] = { functions: ["F14"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E06"], expression_types: ["X06"], vibe: "V02", power: [], grammar_intent: ["G01"], flags: [] };
  // 126: why was he so chill
  overrides[126] = { functions: ["F06"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E03"], expression_types: ["X06"], vibe: "V06", power: [], grammar_intent: ["G18"], flags: [] };
  // 127: gonna buy him new phone
  overrides[127] = { functions: ["F34"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X03"], vibe: "V01", power: ["P05"], grammar_intent: ["G23"], flags: [] };
  // 128: backed up on iCloud
  overrides[128] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E12"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] };
  // 129: laughing at footage, shout out Cisco
  overrides[129] = { functions: ["F27"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V01", power: ["P05"], grammar_intent: [], flags: [] };
  // 130: real one for not getting mad
  overrides[130] = { functions: ["F01"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E01"], expression_types: ["X06"], vibe: "V01", power: ["P05"], grammar_intent: [], flags: [] };
  // 131: nice lady at lost and found
  overrides[131] = { functions: ["F05"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] };
  // 132: filed claim, headed to car
  overrides[132] = { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: ["P07"], grammar_intent: [], flags: [] };
  // 133: back in car, one phone
  overrides[133] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E06"], expression_types: ["X06","X04"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] };
  // 134: only one phone, not mine
  overrides[134] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E06"], expression_types: ["X06","X04"], vibe: "V03", power: ["P04"], grammar_intent: [], flags: [] };
  // 135: went to get new phone, Best Buy
  overrides[135] = { functions: ["F05"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] };
  // 136: weird Best Buy, no iPhone 12
  overrides[136] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E15"], expression_types: ["X06"], vibe: "V06", power: [], grammar_intent: [], flags: [] };
  // 137: have 13 Pro Max, good upgrade
  overrides[137] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E09"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: ["G18"], flags: [] };
  // 138: getting phone harder than expected
  overrides[138] = { functions: ["F01"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E15"], expression_types: ["X06"], vibe: "V06", power: ["P07"], grammar_intent: [], flags: [] };
  // 139: plan B
  overrides[139] = { functions: ["F01"], situation: "S19", cefr: "A1", register: "R4", emotions: ["E15"], expression_types: ["X06"], vibe: "V06", power: [], grammar_intent: [], flags: [] };
  // 140: T-Mobile, not authorized
  overrides[140] = { functions: ["F05"], situation: "S19", cefr: "B1", register: "R4", emotions: ["E15"], expression_types: ["X06"], vibe: "V06", power: ["P07"], grammar_intent: [], flags: [] };
  // 141: legally can't take it
  overrides[141] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E15"], expression_types: ["X06"], vibe: "V06", power: [], grammar_intent: [], flags: [] };
  // 142: going to Target, still open
  overrides[142] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E12"], expression_types: ["X06"], vibe: "V12", power: [], grammar_intent: [], flags: [] };
  // 143: Target doesn't have unlocked iPhones
  overrides[143] = { functions: ["F01"], situation: "S19", cefr: "A2", register: "R4", emotions: ["E15"], expression_types: ["X05"], vibe: "V06", power: [], grammar_intent: [], flags: [] };

  fixFile('HwW0RdDjqks', overrides);
}

console.log('All fixes applied.');
