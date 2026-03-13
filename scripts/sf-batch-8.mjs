import fs from 'fs';

// ──────────────────────────────────────────────
// 1. Irregular verb table (base → [inflected forms])
// ──────────────────────────────────────────────
const IRREGULAR_VERBS = {
  "be": ["am","is","are","was","were","been","being"],
  "have": ["has","had","having"],
  "do": ["does","did","done","doing"],
  "go": ["goes","went","gone","going"],
  "get": ["gets","got","gotten","getting"],
  "make": ["makes","made","making"],
  "take": ["takes","took","taken","taking"],
  "come": ["comes","came","coming"],
  "see": ["sees","saw","seen","seeing"],
  "know": ["knows","knew","known","knowing"],
  "think": ["thinks","thought","thinking"],
  "feel": ["feels","felt","feeling"],
  "give": ["gives","gave","given","giving"],
  "find": ["finds","found","finding"],
  "tell": ["tells","told","telling"],
  "say": ["says","said","saying"],
  "leave": ["leaves","left","leaving"],
  "put": ["puts","putting"],
  "keep": ["keeps","kept","keeping"],
  "let": ["lets","letting"],
  "begin": ["begins","began","begun","beginning"],
  "show": ["shows","showed","shown","showing"],
  "hear": ["hears","heard","hearing"],
  "play": ["plays","played","playing"],
  "run": ["runs","ran","run","running"],
  "move": ["moves","moved","moving"],
  "live": ["lives","lived","living"],
  "believe": ["believes","believed","believing"],
  "hold": ["holds","held","holding"],
  "bring": ["brings","brought","bringing"],
  "write": ["writes","wrote","written","writing"],
  "stand": ["stands","stood","standing"],
  "lose": ["loses","lost","losing"],
  "pay": ["pays","paid","paying"],
  "meet": ["meets","met","meeting"],
  "include": ["includes","included","including"],
  "set": ["sets","setting"],
  "learn": ["learns","learned","learnt","learning"],
  "change": ["changes","changed","changing"],
  "lead": ["leads","led","leading"],
  "understand": ["understands","understood","understanding"],
  "watch": ["watches","watched","watching"],
  "follow": ["follows","followed","following"],
  "stop": ["stops","stopped","stopping"],
  "create": ["creates","created","creating"],
  "speak": ["speaks","spoke","spoken","speaking"],
  "read": ["reads","reading"],
  "spend": ["spends","spent","spending"],
  "grow": ["grows","grew","grown","growing"],
  "open": ["opens","opened","opening"],
  "walk": ["walks","walked","walking"],
  "win": ["wins","won","winning"],
  "offer": ["offers","offered","offering"],
  "remember": ["remembers","remembered","remembering"],
  "love": ["loves","loved","loving"],
  "consider": ["considers","considered","considering"],
  "appear": ["appears","appeared","appearing"],
  "buy": ["buys","bought","buying"],
  "wait": ["waits","waited","waiting"],
  "serve": ["serves","served","serving"],
  "die": ["dies","died","dying"],
  "send": ["sends","sent","sending"],
  "build": ["builds","built","building"],
  "fall": ["falls","fell","fallen","falling"],
  "cut": ["cuts","cutting"],
  "reach": ["reaches","reached","reaching"],
  "kill": ["kills","killed","killing"],
  "remain": ["remains","remained","remaining"],
  "suggest": ["suggests","suggested","suggesting"],
  "raise": ["raises","raised","raising"],
  "pass": ["passes","passed","passing"],
  "sell": ["sells","sold","selling"],
  "require": ["requires","required","requiring"],
  "drive": ["drives","drove","driven","driving"],
  "break": ["breaks","broke","broken","breaking"],
  "sit": ["sits","sat","sitting"],
  "carry": ["carries","carried","carrying"],
  "throw": ["throws","threw","thrown","throwing"],
  "fight": ["fights","fought","fighting"],
  "catch": ["catches","caught","catching"],
  "choose": ["chooses","chose","chosen","choosing"],
  "draw": ["draws","drew","drawn","drawing"],
  "drink": ["drinks","drank","drunk","drinking"],
  "eat": ["eats","ate","eaten","eating"],
  "fall apart": ["fell apart","fallen apart","falling apart"],
  "give up": ["gives up","gave up","given up","giving up"],
  "give in": ["gives in","gave in","given in","giving in"],
  "give out": ["gives out","gave out","given out","giving out"],
  "take off": ["takes off","took off","taken off","taking off"],
  "take on": ["takes on","took on","taken on","taking on"],
  "take out": ["takes out","took out","taken out","taking out"],
  "take over": ["takes over","took over","taken over","taking over"],
  "take up": ["takes up","took up","taken up","taking up"],
  "bring up": ["brings up","brought up","bringing up"],
  "bring back": ["brings back","brought back","bringing back"],
  "come back": ["comes back","came back","coming back"],
  "come out": ["comes out","came out","coming out"],
  "come up": ["comes up","came up","coming up"],
  "go back": ["goes back","went back","gone back","going back"],
  "go on": ["goes on","went on","gone on","going on"],
  "go out": ["goes out","went out","gone out","going out"],
  "go through": ["goes through","went through","gone through","going through"],
  "go up": ["goes up","went up","gone up","going up"],
  "find out": ["finds out","found out","finding out"],
  "figure out": ["figures out","figured out","figuring out"],
  "work out": ["works out","worked out","working out"],
  "look at": ["looks at","looked at","looking at"],
  "look for": ["looks for","looked for","looking for"],
  "look up": ["looks up","looked up","looking up"],
  "look out": ["looks out","looked out","looking out"],
  "look back": ["looks back","looked back","looking back"],
  "look like": ["looks like","looked like","looking like"],
  "make up": ["makes up","made up","making up"],
  "make out": ["makes out","made out","making out"],
  "make sense": ["makes sense","made sense","making sense"],
  "put up": ["puts up","put up","putting up"],
  "put on": ["puts on","put on","putting on"],
  "put off": ["puts off","put off","putting off"],
  "put down": ["puts down","put down","putting down"],
  "run out": ["runs out","ran out","run out","running out"],
  "run away": ["runs away","ran away","run away","running away"],
  "end up": ["ends up","ended up","ending up"],
  "pick up": ["picks up","picked up","picking up"],
  "set up": ["sets up","set up","setting up"],
  "show up": ["shows up","showed up","shown up","showing up"],
  "stand up": ["stands up","stood up","standing up"],
  "turn up": ["turns up","turned up","turning up"],
  "turn out": ["turns out","turned out","turning out"],
  "turn off": ["turns off","turned off","turning off"],
  "turn on": ["turns on","turned on","turning on"],
  "keep up": ["keeps up","kept up","keeping up"],
  "keep on": ["keeps on","kept on","keeping on"],
  "hold on": ["holds on","held on","holding on"],
  "hold back": ["holds back","held back","holding back"],
  "hold up": ["holds up","held up","holding up"],
  "break up": ["breaks up","broke up","broken up","breaking up"],
  "break down": ["breaks down","broke down","broken down","breaking down"],
  "break out": ["breaks out","broke out","broken out","breaking out"],
  "tear apart": ["tears apart","tore apart","torn apart","tearing apart"],
  "wake": ["wakes","woke","woken","waking"],
  "wake up": ["wakes up","woke up","woken up","waking up"],
  "press": ["presses","pressed","pressing"],
  "sleep": ["sleeps","slept","sleeping"],
  "sing": ["sings","sang","sung","singing"],
  "swim": ["swims","swam","swum","swimming"],
  "hit": ["hits","hitting"],
  "hurt": ["hurts","hurting"],
  "let go": ["lets go","let go","letting go"],
  "wear out": ["wears out","wore out","worn out","wearing out"],
  "think about": ["thinks about","thought about","thinking about"],
  "think of": ["thinks of","thought of","thinking of"],
  "care about": ["cares about","cared about","caring about"],
  "care for": ["cares for","cared for","caring for"],
  "talk about": ["talks about","talked about","talking about"],
  "talk to": ["talks to","talked to","talking to"],
  "wait for": ["waits for","waited for","waiting for"],
  "ask for": ["asks for","asked for","asking for"],
  "pay for": ["pays for","paid for","paying for"],
  "fight for": ["fights for","fought for","fighting for"],
  "fall for": ["falls for","fell for","fallen for","falling for"],
  "fall in love": ["falls in love","fell in love","fallen in love","falling in love"],
  "give a damn": ["gives a damn","gave a damn","giving a damn"],
  "make a difference": ["makes a difference","made a difference","making a difference"],
  "make a mistake": ["makes a mistake","made a mistake","making a mistake"],
  "take a look": ["takes a look","took a look","taking a look"],
  "take a break": ["takes a break","took a break","taking a break"],
  "take a chance": ["takes a chance","took a chance","taking a chance"],
  "take care": ["takes care","took care","taken care","taking care"],
  "go wrong": ["goes wrong","went wrong","gone wrong","going wrong"],
};

// Build reverse lookup: inflected form → base form
const INFLECTION_MAP = new Map();
for (const [base, forms] of Object.entries(IRREGULAR_VERBS)) {
  for (const form of forms) {
    if (!INFLECTION_MAP.has(form)) INFLECTION_MAP.set(form, []);
    INFLECTION_MAP.get(form).push(base);
  }
}

// Build forward lookup: base → all forms (including base itself)
const BASE_TO_FORMS = new Map();
for (const [base, forms] of Object.entries(IRREGULAR_VERBS)) {
  BASE_TO_FORMS.set(base, [base, ...forms]);
}

// ──────────────────────────────────────────────
// 2. Helper: normalize text for matching
// ──────────────────────────────────────────────
function normalize(s) {
  return s.toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[^a-z0-9' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ──────────────────────────────────────────────
// 3. Get all forms of an expression
// ──────────────────────────────────────────────
function getExprForms(expr) {
  const forms = new Set([expr]);

  // Add irregular verb forms for the whole expression
  if (IRREGULAR_VERBS[expr]) {
    for (const f of IRREGULAR_VERBS[expr]) forms.add(f);
  }

  // Try replacing first word with its inflections
  const words = expr.split(' ');
  const firstWord = words[0];

  if (IRREGULAR_VERBS[firstWord]) {
    for (const inflected of IRREGULAR_VERBS[firstWord]) {
      const newExpr = [inflected, ...words.slice(1)].join(' ');
      forms.add(newExpr);
    }
  }

  // Regular verb forms for first word (simple -s, -ed, -ing)
  if (words.length >= 1) {
    const w = firstWord;
    // -s form
    if (!w.endsWith('s')) forms.add([w + 's', ...words.slice(1)].join(' '));
    // -ing form
    if (w.endsWith('e') && !w.endsWith('ee')) {
      forms.add([w.slice(0, -1) + 'ing', ...words.slice(1)].join(' '));
    } else if (w.length > 3 && 'aeiou'.includes(w[w.length-2]) && !'aeiou'.includes(w[w.length-1])) {
      forms.add([w + w[w.length-1] + 'ing', ...words.slice(1)].join(' '));
    } else {
      forms.add([w + 'ing', ...words.slice(1)].join(' '));
    }
    // -ed form
    if (w.endsWith('e')) {
      forms.add([w + 'd', ...words.slice(1)].join(' '));
    } else if (w.length > 3 && 'aeiou'.includes(w[w.length-2]) && !'aeiou'.includes(w[w.length-1])) {
      forms.add([w + w[w.length-1] + 'ed', ...words.slice(1)].join(' '));
    } else {
      forms.add([w + 'ed', ...words.slice(1)].join(' '));
    }
  }

  return [...forms];
}

// ──────────────────────────────────────────────
// 4. Find surfaceForm in sentence
// ──────────────────────────────────────────────
function findSurfaceForm(exprId, en) {
  const normSent = normalize(en);
  const words = normSent.split(' ');
  const exprNorm = normalize(exprId);
  const exprWords = exprNorm.split(' ');

  // For single-word expressions, try direct match and inflections
  if (exprWords.length === 1) {
    return findSingleWord(exprId, en, normSent, words);
  }

  // For multi-word expressions, try various approaches
  return findMultiWord(exprId, en, normSent, words, exprWords);
}

function findSingleWord(exprId, en, normSent, sentWords) {
  const exprNorm = normalize(exprId);

  // Direct match (case insensitive)
  const directIdx = sentWords.indexOf(exprNorm);
  if (directIdx !== -1) {
    return extractOriginalToken(en, exprNorm, directIdx);
  }

  // Build all forms: base → inflected AND inflected → base → all forms
  const allForms = getAllWordForms(exprNorm);

  for (const form of allForms) {
    const idx = sentWords.indexOf(form);
    if (idx !== -1) {
      return extractOriginalToken(en, form, idx);
    }
  }

  return null;
}

function getAllWordForms(word) {
  const forms = new Set([word]);
  if (IRREGULAR_VERBS[word]) {
    for (const f of IRREGULAR_VERBS[word]) forms.add(f);
  }
  // Check if word is an inflected form of some base
  if (INFLECTION_MAP.has(word)) {
    for (const base of INFLECTION_MAP.get(word)) {
      forms.add(base);
      if (IRREGULAR_VERBS[base]) {
        for (const f of IRREGULAR_VERBS[base]) forms.add(f);
      }
    }
  }
  // Regular forms
  forms.add(word + 's');
  forms.add(word + 'ed');
  forms.add(word + 'd');
  forms.add(word + 'ing');
  if (word.endsWith('e')) {
    forms.add(word.slice(0,-1) + 'ing');
    forms.add(word + 'd');
  }
  if (word.endsWith('y') && word.length > 2) {
    forms.add(word.slice(0,-1) + 'ies');
    forms.add(word.slice(0,-1) + 'ied');
  }
  return forms;
}

function findMultiWord(exprId, en, normSent, sentWords, exprWords) {
  // Strategy 1: exact phrase match
  const exactMatch = tryPhraseMatch(exprWords, sentWords, en);
  if (exactMatch) return exactMatch;

  // Strategy 2: try all inflected forms of first word
  const firstWord = exprWords[0];
  const firstWordForms = getAllWordForms(firstWord);

  for (const inflectedFirst of firstWordForms) {
    const inflectedExpr = [inflectedFirst, ...exprWords.slice(1)];
    const match = tryPhraseMatch(inflectedExpr, sentWords, en);
    if (match) return match;
  }

  // Strategy 3: try inflecting ALL words in the expression (for "I think" → "I thought")
  // For each word position, try all its forms
  const allWordForms = exprWords.map(w => getAllWordForms(w));
  const multiInflectMatch = tryMultiInflectMatch(exprWords, allWordForms, sentWords, en);
  if (multiInflectMatch) return multiInflectMatch;

  // Strategy 4: allow optional words insertion between expr words (for object insertion)
  // e.g. "take it off" matches "take off"
  const insertMatch = tryInsertionMatch(exprWords, sentWords, en, firstWordForms);
  if (insertMatch) return insertMatch;

  // Strategy 5: whole-expression irregular lookup
  if (IRREGULAR_VERBS[exprId]) {
    for (const form of IRREGULAR_VERBS[exprId]) {
      const formWords = form.split(' ');
      const match = tryPhraseMatch(formWords, sentWords, en);
      if (match) return match;
    }
  }

  // Strategy 6: if exprId itself is an inflected form, try base forms
  if (INFLECTION_MAP.has(exprId)) {
    for (const base of INFLECTION_MAP.get(exprId)) {
      const baseWords = base.split(' ');
      const match = tryPhraseMatch(baseWords, sentWords, en);
      if (match) return match;
      // Also try inflected forms of the base
      if (IRREGULAR_VERBS[base]) {
        for (const f of IRREGULAR_VERBS[base]) {
          const fWords = f.split(' ');
          const m2 = tryPhraseMatch(fWords, sentWords, en);
          if (m2) return m2;
        }
      }
    }
  }

  return null;
}

function tryMultiInflectMatch(exprWords, allWordForms, sentWords, en) {
  // Try replacing each word with its forms, up to 1 substitution per word
  // Special handling for common patterns like "I think" → "I thought"
  for (let i = 0; i <= sentWords.length - exprWords.length; i++) {
    let allMatch = true;
    for (let j = 0; j < exprWords.length; j++) {
      if (!allWordForms[j].has(sentWords[i+j])) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) {
      return extractOriginalPhrase(en, exprWords, i);
    }
  }
  return null;
}

// Try to match exprWords as consecutive sequence in sentWords (exact)
function tryPhraseMatch(exprWords, sentWords, origSent) {
  for (let i = 0; i <= sentWords.length - exprWords.length; i++) {
    let match = true;
    for (let j = 0; j < exprWords.length; j++) {
      if (sentWords[i+j] !== exprWords[j]) { match = false; break; }
    }
    if (match) {
      return extractOriginalPhrase(origSent, exprWords, i);
    }
  }
  return null;
}

// Try matching with up to 3 inserted words between expr components
function tryInsertionMatch(exprWords, sentWords, origSent, firstWordForms) {
  if (exprWords.length < 2) return null;

  // Try each position for first word (including inflections)
  for (let i = 0; i < sentWords.length; i++) {
    if (!firstWordForms.has(sentWords[i])) continue;

    // Try to find remaining words after position i, allowing insertions
    const result = matchRemainingWithInsertions(exprWords, sentWords, i, origSent);
    if (result) return result;
  }
  return null;
}

function matchRemainingWithInsertions(exprWords, sentWords, startIdx, origSent) {
  // Try to match exprWords[1..] after startIdx, with up to 3 words gap between each pair
  let positions = [startIdx];
  let searchStart = startIdx + 1;

  for (let ei = 1; ei < exprWords.length; ei++) {
    let found = false;
    for (let si = searchStart; si < Math.min(searchStart + 4, sentWords.length); si++) {
      if (sentWords[si] === exprWords[ei]) {
        positions.push(si);
        searchStart = si + 1;
        found = true;
        break;
      }
    }
    if (!found) return null;
  }

  // Extract surface form from original sentence spanning positions[0] to positions[last]
  return extractOriginalRange(origSent, positions[0], positions[positions.length-1]);
}

// ──────────────────────────────────────────────
// 5. Extract original casing from sentence
// ──────────────────────────────────────────────
function tokenizeOriginal(en) {
  // Split into tokens preserving non-word chars as separators
  // Return array of {token, isWord, start, end}
  const tokens = [];
  const re = /[a-zA-Z0-9']+|[^a-zA-Z0-9']+/g;
  let m;
  while ((m = re.exec(en)) !== null) {
    tokens.push({ text: m[0], isWord: /[a-zA-Z0-9']/.test(m[0]), start: m.index, end: m.index + m[0].length });
  }
  return tokens;
}

function getWordTokens(en) {
  const allTokens = tokenizeOriginal(en);
  return allTokens.filter(t => t.isWord);
}

function extractOriginalToken(en, normForm, wordIdx) {
  const wordTokens = getWordTokens(en);
  if (wordIdx < wordTokens.length) {
    return wordTokens[wordIdx].text;
  }
  return null;
}

function extractOriginalPhrase(en, normExprWords, startWordIdx) {
  const wordTokens = getWordTokens(en);
  const endWordIdx = startWordIdx + normExprWords.length - 1;
  if (endWordIdx >= wordTokens.length) return null;

  const startChar = wordTokens[startWordIdx].start;
  const endChar = wordTokens[endWordIdx].end;
  return en.slice(startChar, endChar);
}

function extractOriginalRange(en, startWordIdx, endWordIdx) {
  const wordTokens = getWordTokens(en);
  if (endWordIdx >= wordTokens.length) return null;

  const startChar = wordTokens[startWordIdx].start;
  const endChar = wordTokens[endWordIdx].end;
  return en.slice(startChar, endChar);
}

// ──────────────────────────────────────────────
// 6. Main: build input data from match-results + transcripts
// ──────────────────────────────────────────────
const PROJECT = 'C:/Users/hyunj/studyeng';

const matchResults = JSON.parse(fs.readFileSync(`${PROJECT}/src/data/match-results/batch-8.json`, 'utf8'));
const transcripts = JSON.parse(fs.readFileSync(`${PROJECT}/src/data/transcript-batches/batch-8.json`, 'utf8'));

// Load Korean translations from transcript-fix-batches
const fixBatch = JSON.parse(fs.readFileSync(`${PROJECT}/src/data/transcript-fix-batches/batch-8.json`, 'utf8'));

// Build ko lookup: videoId -> sentenceIdx -> ko
const koLookup = {};
for (const [videoId, segs] of Object.entries(fixBatch)) {
  koLookup[videoId] = {};
  for (let i = 0; i < segs.length; i++) {
    koLookup[videoId][i] = segs[i].ko || '';
  }
}

// Build items
const items = [];
for (const [videoId, matches] of Object.entries(matchResults)) {
  const transcript = transcripts[videoId];
  if (!transcript) continue;
  const koMap = koLookup[videoId] || {};

  for (const m of matches) {
    const en = transcript[m.sentenceIdx];
    if (en === undefined) continue;
    const ko = koMap[m.sentenceIdx] || '';
    items.push({ videoId, exprId: m.canonical, sentenceIdx: m.sentenceIdx, en, ko });
  }
}

console.log(`Built ${items.length} items from match-results/batch-8`);

// ──────────────────────────────────────────────
// 7. Find surfaceForm for each item
// ──────────────────────────────────────────────
let found = 0;
let notFound = 0;

const results = items.map(item => {
  const sf = findSurfaceForm(item.exprId, item.en);
  if (sf !== null) found++;
  else notFound++;
  return { ...item, surfaceForm: sf };
});

// ──────────────────────────────────────────────
// 8. Write output
// ──────────────────────────────────────────────
const outDir = `${PROJECT}/src/data/match-results-v3`;
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(`${outDir}/batch-8.json`, JSON.stringify(results, null, 2));

console.log(`\n=== RESULTS ===`);
console.log(`Total matches: ${results.length}`);
console.log(`surfaceForm found: ${found} (${Math.round(found/results.length*100)}%)`);
console.log(`surfaceForm null: ${notFound} (${Math.round(notFound/results.length*100)}%)`);
console.log(`\nOutput written to: ${outDir}/batch-8.json`);

// Show some not-found examples for debugging
const nullSamples = results.filter(r => r.surfaceForm === null).slice(0, 10);
console.log('\nSample null cases:');
for (const s of nullSamples) {
  console.log(`  exprId="${s.exprId}" | en="${s.en.slice(0,60)}"`);
}
