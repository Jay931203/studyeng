import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const entries = JSON.parse(readFileSync('C:/Users/hyunj/studyeng/src/data/word-entries.json', 'utf8'));
const wordIndex = JSON.parse(readFileSync('C:/Users/hyunj/studyeng/src/data/word-index.json', 'utf8'));

const allWords = Object.values(entries);
const issues = [];

function getExamples(wordId, max = 3) {
  const examples = [];
  for (const [videoId, wordList] of Object.entries(wordIndex)) {
    for (const w of wordList) {
      if (w.wordId === wordId) {
        examples.push(w.en);
        if (examples.length >= max) return examples;
      }
    }
  }
  return examples;
}

// ===== CAT 1: A1/A2 words marked supplementary =====
const essentialA1A2 = allWords.filter(w =>
  (w.cefr === 'A1' || w.cefr === 'A2') && w.learner_value === 'supplementary'
);
for (const word of essentialA1A2) {
  issues.push({
    word: word.id,
    current_meaning_ko: word.meaning_ko,
    current_pos: word.pos,
    current_register: word.register,
    transcript_examples: getExamples(word.id),
    issue: "A1/A2 word marked as 'supplementary' learner_value - basic words should be 'essential' or 'useful'",
    fix: { meaning_ko: word.meaning_ko, pos: word.pos, register: word.register, learner_value: 'useful' }
  });
}

// ===== CAT 2: POS mismatches for common words =====
// Only words where POS is clearly wrong (not dual-use)
const posExpectations = {
  'wait': 'verb', 'listen': 'verb', 'read': 'verb', 'write': 'verb',
  'speak': 'verb', 'eat': 'verb', 'sit': 'verb',
  'bring': 'verb', 'spend': 'verb',
  'teach': 'verb', 'believe': 'verb', 'remember': 'verb', 'forget': 'verb',
  'happen': 'verb', 'follow': 'verb',
  'allow': 'verb', 'decide': 'verb', 'explain': 'verb',
  'die': 'verb', 'learn': 'verb',
  'house': 'noun', 'school': 'noun', 'family': 'noun', 'friend': 'noun',
  'water': 'noun', 'food': 'noun', 'money': 'noun', 'world': 'noun',
  'mother': 'noun', 'father': 'noun', 'child': 'noun', 'woman': 'noun',
  'man': 'noun', 'dog': 'noun', 'cat': 'noun', 'car': 'noun',
  'door': 'noun', 'table': 'noun', 'chair': 'noun', 'window': 'noun',
  'city': 'noun', 'country': 'noun', 'street': 'noun', 'room': 'noun',
  'number': 'noun', 'color': 'noun', 'question': 'noun',
  'problem': 'noun', 'idea': 'noun', 'story': 'noun',
  'happy': 'adjective', 'sad': 'adjective', 'big': 'adjective',
  'small': 'adjective', 'old': 'adjective', 'young': 'adjective',
  'good': 'adjective', 'bad': 'adjective', 'new': 'adjective',
  'beautiful': 'adjective', 'important': 'adjective',
  'different': 'adjective',
  'easy': 'adjective', 'strong': 'adjective',
  'hot': 'adjective', 'cold': 'adjective',
  'dark': 'adjective', 'empty': 'adjective',
  'crazy': 'adjective', 'stupid': 'adjective', 'angry': 'adjective',
  'afraid': 'adjective', 'alone': 'adjective', 'alive': 'adjective',
  'sick': 'adjective', 'tired': 'adjective', 'proud': 'adjective',
  'scared': 'adjective', 'serious': 'adjective',
  'terrible': 'adjective', 'horrible': 'adjective',
  'perfect': 'adjective', 'amazing': 'adjective', 'awesome': 'adjective',
  'wonderful': 'adjective', 'incredible': 'adjective',
  'weird': 'adjective', 'strange': 'adjective',
  'always': 'adverb', 'never': 'adverb', 'sometimes': 'adverb',
  'already': 'adverb', 'again': 'adverb',
  'together': 'adverb', 'away': 'adverb', 'forever': 'adverb',
  'finally': 'adverb', 'maybe': 'adverb', 'actually': 'adverb',
  'probably': 'adverb', 'exactly': 'adverb', 'definitely': 'adverb',
  'absolutely': 'adverb', 'literally': 'adverb', 'honestly': 'adverb',
  'anyway': 'adverb', 'basically': 'adverb',
};

for (const word of allWords) {
  const expectedPos = posExpectations[word.id];
  if (expectedPos && word.pos !== expectedPos) {
    issues.push({
      word: word.id,
      current_meaning_ko: word.meaning_ko,
      current_pos: word.pos,
      current_register: word.register,
      transcript_examples: getExamples(word.id),
      issue: `POS mismatch: listed as "${word.pos}" but most commonly used as "${expectedPos}"`,
      fix: { meaning_ko: word.meaning_ko, pos: expectedPos, register: word.register }
    });
  }
}

// ===== CAT 3: A1 words tagged casual/slang =====
const casualOkA1 = new Set([
  'hey', 'yeah', 'okay', 'ok', 'bye', 'hi', 'wow', 'oops', 'yep',
  'nah', 'gonna', 'wanna', 'gotta', 'um', 'uh', 'hmm', 'nope', 'yay',
  'thanks', 'fun', 'kid', 'dad', 'mom', 'mama', 'daddy', 'mum', 'papa',
  'bike', 'lots', 'burger', 'fridge', 'fries',
]);
for (const word of allWords) {
  if (word.cefr === 'A1' && word.register === 'slang') {
    issues.push({
      word: word.id,
      current_meaning_ko: word.meaning_ko,
      current_pos: word.pos,
      current_register: word.register,
      transcript_examples: getExamples(word.id),
      issue: "A1-level word tagged as 'slang' - A1 words should typically have neutral register",
      fix: { meaning_ko: word.meaning_ko, pos: word.pos, register: 'neutral' }
    });
  }
  if (word.cefr === 'A1' && word.register === 'casual' && !casualOkA1.has(word.id)) {
    issues.push({
      word: word.id,
      current_meaning_ko: word.meaning_ko,
      current_pos: word.pos,
      current_register: word.register,
      transcript_examples: getExamples(word.id),
      issue: "A1-level word tagged as 'casual' - verify this is appropriate for a basic vocabulary word",
      fix: { meaning_ko: word.meaning_ko, pos: word.pos, register: 'neutral' }
    });
  }
}

// ===== CAT 4: Inflected forms tagged differently from base =====
const independentInflectedForms = new Set([
  'hooked', 'loaded', 'wasted', 'stoned', 'baked', 'twisted', 'smashed',
  'burned', 'played', 'pissed', 'hammered', 'freaking', 'fucking',
  'blessed', 'wicked', 'busted', 'jacked', 'ripped', 'stacked',
  'whipped', 'tripping', 'vibing', 'chilling', 'rolling',
]);

for (const word of allWords) {
  if ((word.register === 'slang' || word.register === 'casual') && !independentInflectedForms.has(word.id)) {
    let checked = false;
    if (word.id.endsWith('ed')) {
      const bases = [
        word.id.slice(0, -2),
        word.id.slice(0, -1),
        word.id.replace(/ied$/, 'y'),
        word.id.replace(/([a-z])\1ed$/, '$1'),
      ];
      for (const base of bases) {
        if (entries[base] && entries[base].register !== word.register) {
          issues.push({
            word: word.id,
            current_meaning_ko: word.meaning_ko,
            current_pos: word.pos,
            current_register: word.register,
            transcript_examples: getExamples(word.id),
            issue: `Inflected form of "${base}" (register: ${entries[base].register}) but tagged as "${word.register}" - register should match base word unless meaning diverged`,
            fix: { meaning_ko: word.meaning_ko, pos: word.pos, register: entries[base].register }
          });
          checked = true;
          break;
        }
      }
    }
    if (!checked && word.id.endsWith('ing')) {
      const bases = [
        word.id.slice(0, -3),
        word.id.slice(0, -3) + 'e',
        word.id.replace(/([a-z])\1ing$/, '$1'),
      ];
      for (const base of bases) {
        if (entries[base] && entries[base].register !== word.register) {
          issues.push({
            word: word.id,
            current_meaning_ko: word.meaning_ko,
            current_pos: word.pos,
            current_register: word.register,
            transcript_examples: getExamples(word.id),
            issue: `Inflected form of "${base}" (register: ${entries[base].register}) but tagged as "${word.register}" - register should match base word unless meaning diverged`,
            fix: { meaning_ko: word.meaning_ko, pos: word.pos, register: entries[base].register }
          });
          break;
        }
      }
    }
  }
}

// ===== CAT 5: Missing primary meanings for common words =====
const primaryMeaningChecks = [
  { id: 'bag', must: '\uAC00\uBC29', desc: '\uAC00\uBC29 (bag)' },
  { id: 'cap', must: '\uBAA8\uC790', desc: '\uBAA8\uC790 (hat/cap)' },
  { id: 'cake', must: '\uCF00\uC774\uD06C', desc: '\uCF00\uC774\uD06C (cake)' },
  { id: 'tea', must: '\uCC28', desc: '\uCC28 (tea)' },
  { id: 'weed', must: '\uC7A1\uCD08', desc: '\uC7A1\uCD08 (weed/plant)' },
  { id: 'joint', must: '\uAD00\uC808', desc: '\uAD00\uC808 (joint/body)' },
  { id: 'pipe', must: '\uD30C\uC774\uD504', desc: '\uD30C\uC774\uD504 (pipe)' },
  { id: 'pot', must: '\uB0A8\uBE44', desc: '\uB0A8\uBE44 (pot/cookware)' },
  { id: 'blow', must: '\uBD88\uB2E4', desc: '\uBD88\uB2E4 (to blow)' },
  { id: 'stick', must: '\uB9C9\uB300', desc: '\uB9C9\uB300 (stick/rod) as noun' },
  // crack: '\uADE0\uC5F4' is valid translation - skip
  { id: 'cold', must: '\uCC28\uAC00\uC6B4', desc: '\uCC28\uAC00\uC6B4 (cold)' },
  { id: 'hot', must: '\uB728\uAC70\uC6B4', desc: '\uB728\uAC70\uC6B4 (hot)' },
  { id: 'flat', must: '\uD3C9\uD3C9', desc: '\uD3C9\uD3C9\uD55C (flat)' },
  { id: 'straight', must: '\uB611\uBC14', desc: '\uB611\uBC14\uB85C (straight)' },
  { id: 'bear', must: '\uACF0', desc: '\uACF0 (bear/animal)' },
  { id: 'train', must: '\uAE30\uCC28', desc: '\uAE30\uCC28 (train)' },
  { id: 'pool', must: '\uC218\uC601\uC7A5', desc: '\uC218\uC601\uC7A5 (pool)' },
  { id: 'fan', must: '\uD32C', desc: '\uD32C (fan)' },
  { id: 'spring', must: '\uBD04', desc: '\uBD04 (spring/season)' },
  { id: 'wave', must: '\uD30C\uB3C4', desc: '\uD30C\uB3C4 (wave)' },
  // beat: '\uB450\uB4DC\uB9AC\uB2E4' is valid translation - skip
  { id: 'brick', must: '\uBCBD\uB3CC', desc: '\uBCBD\uB3CC (brick)' },
  { id: 'buck', must: '\uB2EC\uB7EC', desc: '\uB2EC\uB7EC (dollar)' },
  { id: 'chain', must: '\uC0AC\uC2AC', desc: '\uC0AC\uC2AC/\uCCB4\uC778 (chain)' },
  { id: 'dust', must: '\uBA3C\uC9C0', desc: '\uBA3C\uC9C0 (dust)' },
  { id: 'tool', must: '\uB3C4\uAD6C', desc: '\uB3C4\uAD6C (tool)' },
  { id: 'figure', must: '\uC778\uBB3C', desc: '\uC778\uBB3C/\uC22B\uC790 (figure)' },
  { id: 'crash', must: '\uCDA9\uB3CC', desc: '\uCDA9\uB3CC (crash)' },
  { id: 'charge', must: '\uCDA9\uC804', desc: '\uCDA9\uC804/\uCCAD\uAD6C (charge)' },
  { id: 'mark', must: '\uD45C\uC2DC', desc: '\uD45C\uC2DC (mark)' },
  { id: 'match', must: '\uACBD\uAE30', desc: '\uACBD\uAE30/\uC77C\uCE58 (match)' },
  { id: 'shot', must: '\uBC1C\uC0AC', desc: '\uBC1C\uC0AC/\uAE30\uD68C (shot)' },
];

for (const check of primaryMeaningChecks) {
  const entry = entries[check.id];
  if (entry && !entry.meaning_ko.includes(check.must)) {
    if (!issues.find(i => i.word === check.id)) {
      issues.push({
        word: check.id,
        current_meaning_ko: entry.meaning_ko,
        current_pos: entry.pos,
        current_register: entry.register,
        transcript_examples: getExamples(check.id),
        issue: `Primary meaning "${check.desc}" not found in meaning_ko - current meaning may be secondary/incomplete`,
        fix: { meaning_ko: null, pos: entry.pos, register: entry.register }
      });
    }
  }
}

// ===== CAT 6: Korean meaning contains slang indicators for neutral A1/A2 words =====
const slangIndicators = ['\uC18D\uC5B4', '\uBE44\uC18D\uC5B4', '\uC740\uC5B4'];
for (const word of allWords) {
  if ((word.cefr === 'A1' || word.cefr === 'A2') && word.register === 'neutral') {
    for (const ind of slangIndicators) {
      if (word.meaning_ko.includes(ind)) {
        if (!issues.find(i => i.word === word.id)) {
          issues.push({
            word: word.id,
            current_meaning_ko: word.meaning_ko,
            current_pos: word.pos,
            current_register: word.register,
            transcript_examples: getExamples(word.id),
            issue: `A1/A2 neutral word has slang indicator "${ind}" in meaning_ko - register/meaning mismatch`,
            fix: { meaning_ko: null, pos: word.pos, register: word.register }
          });
        }
      }
    }
  }
}

// ===== CAT 7: C1/C2 words marked as essential =====
const highCefrEssential = allWords.filter(w =>
  (w.cefr === 'C1' || w.cefr === 'C2') && w.learner_value === 'essential'
);
for (const word of highCefrEssential) {
  issues.push({
    word: word.id,
    current_meaning_ko: word.meaning_ko,
    current_pos: word.pos,
    current_register: word.register,
    transcript_examples: getExamples(word.id),
    issue: "C1/C2 word marked as 'essential' learner_value - advanced words are rarely essential for beginner/intermediate learners",
    fix: { meaning_ko: word.meaning_ko, pos: word.pos, register: word.register, learner_value: 'useful' }
  });
}

// ===== CAT 8: Redundant inflected-form entries (same POS as base, just past tense/plural) =====
// These are entries that exist as separate words but also appear in forms[] of their base word
// with the same POS and no independent meaning -- they should not be separate entries
const superlativeComparative = new Set(['worst', 'best', 'most', 'least', 'better', 'worse', 'more', 'less', 'further', 'elder', 'eldest']);

for (const word of allWords) {
  if (word.forms) {
    for (const form of word.forms) {
      if (entries[form] && form !== word.id) {
        const formEntry = entries[form];
        // Skip if different POS (legitimately independent)
        if (formEntry.pos !== word.pos) continue;
        // Skip superlatives/comparatives (legitimately independent)
        if (superlativeComparative.has(form)) continue;
        // Skip if form has very different meaning (check first meaning token)
        const baseMeaning1 = word.meaning_ko.split(',')[0].trim();
        const formMeaning1 = formEntry.meaning_ko.split(',')[0].trim();
        // Simple plurals (just adding \uB4E4) are redundant
        const isSimplePlural = formEntry.meaning_ko === word.meaning_ko.split(',')[0].trim() + '\uB4E4'
          || formEntry.meaning_ko.endsWith('\uB4E4');
        // Past tenses (meaning ends with \uC558\uB2E4/\uC5C8\uB2E4/\uD588\uB2E4 etc)
        const isPastTense = formEntry.meaning_ko.match(/[았었했]/) && form.endsWith('ed');
        // -ing forms that are just progressive
        const isProgressive = form.endsWith('ing') && formEntry.pos === 'verb';
        // -s forms (3rd person singular)
        const isThirdPerson = form.endsWith('s') && formEntry.pos === 'verb' && form === word.id + 's';

        if (isSimplePlural || isPastTense || isProgressive || isThirdPerson) {
          if (!issues.find(i => i.word === form && i.issue.includes('Redundant'))) {
            issues.push({
              word: form,
              current_meaning_ko: formEntry.meaning_ko,
              current_pos: formEntry.pos,
              current_register: formEntry.register,
              transcript_examples: getExamples(form),
              issue: `Redundant inflected-form entry: "${form}" is a simple inflection of "${word.id}" (${word.meaning_ko}) and already in its forms[] array. Consider removing as separate entry.`,
              fix: { meaning_ko: formEntry.meaning_ko, pos: formEntry.pos, register: formEntry.register }
            });
          }
        }
      }
    }
  }
}

// ===== CAT 9: Words with meaning_ko containing slang annotation markers =====
for (const word of allWords) {
  if (word.cefr === 'A1' || word.cefr === 'A2') {
    const m = word.meaning_ko;
    if (m.includes('(\uC18D)') || m.includes('(\uC740)') || m.includes('(\uBE44\uC18D)') || m.includes('(\uC18D\uC5B4)')) {
      if (!issues.find(i => i.word === word.id)) {
        issues.push({
          word: word.id,
          current_meaning_ko: word.meaning_ko,
          current_pos: word.pos,
          current_register: word.register,
          transcript_examples: getExamples(word.id),
          issue: "A1/A2 word meaning_ko contains slang annotation markers - primary meaning may be missing or secondary",
          fix: { meaning_ko: null, pos: word.pos, register: word.register }
        });
      }
    }
  }
}

// Deduplicate
const seen = new Set();
const deduped = [];
for (const issue of issues) {
  const key = issue.word + '||' + issue.issue.substring(0, 60);
  if (!seen.has(key)) {
    seen.add(key);
    deduped.push(issue);
  }
}

// Sort by severity
const severityOrder = [
  'Primary meaning',
  'POS mismatch',
  'A1-level word tagged as',
  'A1/A2 neutral word',
  'A1/A2 word meaning_ko',
  'Inflected form of',
  'Redundant inflected-form',
  "A1/A2 word marked as",
  "C1/C2 word marked as",
];

deduped.sort((a, b) => {
  const getSev = (iss) => {
    for (let i = 0; i < severityOrder.length; i++) {
      if (iss.startsWith(severityOrder[i])) return i;
    }
    return 99;
  };
  return getSev(a.issue) - getSev(b.issue);
});

const report = {
  total_checked: allWords.length,
  issues_found: deduped,
  summary: `Audited all ${allWords.length} word entries systematically across 9 categories. Found ${deduped.length} potential issues. Categories: (1) Missing primary meanings for common words where secondary/slang meaning may be listed instead, (2) POS mismatches where tagged POS does not match most common usage, (3) A1-level words incorrectly tagged as slang/casual register, (4) Inflected forms with register inconsistent with base word, (5) Redundant inflected-form entries that duplicate base words, (6) A1/A2 words undervalued as 'supplementary', (7) C1/C2 words overvalued as 'essential'. Issues are sorted by severity (most critical first).`
};

mkdirSync('C:/Users/hyunj/studyeng/output', { recursive: true });
writeFileSync('C:/Users/hyunj/studyeng/output/word-audit-meanings.json', JSON.stringify(report, null, 2), 'utf8');
console.log('Report written. Total issues found:', deduped.length);
console.log('');
console.log('Category breakdown:');
const catCounts = {};
for (const i of deduped) {
  let cat = 'Other';
  if (i.issue.startsWith('Primary meaning')) cat = 'Missing primary meaning';
  else if (i.issue.startsWith('POS mismatch')) cat = 'POS mismatch';
  else if (i.issue.includes("tagged as 'slang'")) cat = 'A1 word tagged slang';
  else if (i.issue.includes("tagged as 'casual'")) cat = 'A1 word tagged casual (verify)';
  else if (i.issue.startsWith('Inflected form of')) cat = 'Inflected form register mismatch';
  else if (i.issue.startsWith('Redundant inflected')) cat = 'Redundant inflected-form entry';
  else if (i.issue.includes('supplementary')) cat = 'A1/A2 undervalued (supplementary)';
  else if (i.issue.includes('C1/C2')) cat = 'C1/C2 overvalued (essential)';
  else if (i.issue.includes('slang indicator')) cat = 'Slang indicator in neutral word';
  else if (i.issue.includes('slang annotation')) cat = 'Slang annotation in A1/A2';
  catCounts[cat] = (catCounts[cat] || 0) + 1;
}
for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  [${count}] ${cat}`);
}
