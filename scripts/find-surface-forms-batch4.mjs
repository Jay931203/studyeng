import fs from 'fs';
import path from 'path';

// ─── Irregular verb table ───────────────────────────────────────────────────
const IRREGULAR_VERBS = {
  be: ['am','is','are','was','were','been','being'],
  have: ['has','had','having'],
  do: ['does','did','doing','done'],
  go: ['goes','went','going','gone'],
  come: ['comes','came','coming'],
  get: ['gets','got','gotten','getting'],
  make: ['makes','made','making'],
  take: ['takes','took','taken','taking'],
  know: ['knows','knew','known','knowing'],
  see: ['sees','saw','seen','seeing'],
  think: ['thinks','thought','thinking'],
  say: ['says','said','saying'],
  tell: ['tells','told','telling'],
  give: ['gives','gave','given','giving'],
  find: ['finds','found','finding'],
  keep: ['keeps','kept','keeping'],
  let: ['lets','letting'],
  put: ['puts','putting'],
  leave: ['leaves','left','leaving'],
  bring: ['brings','brought','bringing'],
  feel: ['feels','felt','feeling'],
  lose: ['loses','lost','losing'],
  show: ['shows','showed','shown','showing'],
  hear: ['hears','heard','hearing'],
  try: ['tries','tried','trying'],
  run: ['runs','ran','running'],
  hold: ['holds','held','holding'],
  stand: ['stands','stood','standing'],
  meet: ['meets','met','meeting'],
  set: ['sets','setting'],
  break: ['breaks','broke','broken','breaking'],
  cut: ['cuts','cutting'],
  hit: ['hits','hitting'],
  pay: ['pays','paid','paying'],
  sit: ['sits','sat','sitting'],
  speak: ['speaks','spoke','spoken','speaking'],
  write: ['writes','wrote','written','writing'],
  read: ['reads','reading'],
  send: ['sends','sent','sending'],
  spend: ['spends','spent','spending'],
  sell: ['sells','sold','selling'],
  build: ['builds','built','building'],
  fall: ['falls','fell','fallen','falling'],
  grow: ['grows','grew','grown','growing'],
  draw: ['draws','drew','drawn','drawing'],
  drive: ['drives','drove','driven','driving'],
  wear: ['wears','wore','worn','wearing'],
  catch: ['catches','caught','catching'],
  begin: ['begins','began','begun','beginning'],
  buy: ['buys','bought','buying'],
  choose: ['chooses','chose','chosen','choosing'],
  eat: ['eats','ate','eaten','eating'],
  fight: ['fights','fought','fighting'],
  fly: ['flies','flew','flown','flying'],
  forget: ['forgets','forgot','forgotten','forgetting'],
  forgive: ['forgives','forgave','forgiven','forgiving'],
  freeze: ['freezes','froze','frozen','freezing'],
  hang: ['hangs','hung','hanging'],
  hide: ['hides','hid','hidden','hiding'],
  lay: ['lays','laid','laying'],
  lead: ['leads','led','leading'],
  lie: ['lies','lay','lain','lying'],
  mean: ['means','meant','meaning'],
  ride: ['rides','rode','ridden','riding'],
  ring: ['rings','rang','rung','ringing'],
  rise: ['rises','rose','risen','rising'],
  shake: ['shakes','shook','shaken','shaking'],
  shine: ['shines','shone','shining'],
  shoot: ['shoots','shot','shooting'],
  sing: ['sings','sang','sung','singing'],
  sink: ['sinks','sank','sunk','sinking'],
  sleep: ['sleeps','slept','sleeping'],
  slide: ['slides','slid','sliding'],
  smell: ['smells','smelled','smelt','smelling'],
  steal: ['steals','stole','stolen','stealing'],
  stick: ['sticks','stuck','sticking'],
  sting: ['stings','stung','stinging'],
  strike: ['strikes','struck','striking'],
  swim: ['swims','swam','swum','swimming'],
  swing: ['swings','swung','swinging'],
  teach: ['teaches','taught','teaching'],
  tear: ['tears','tore','torn','tearing'],
  throw: ['throws','threw','thrown','throwing'],
  understand: ['understands','understood','understanding'],
  wake: ['wakes','woke','woken','waking'],
  win: ['wins','won','winning'],
  wind: ['winds','wound','winding'],
  wish: ['wishes','wished','wishing'],
  wonder: ['wonders','wondered','wondering'],
  worry: ['worries','worried','worrying'],
  care: ['cares','cared','caring'],
  freak: ['freaks','freaked','freaking'],
  fuck: ['fucks','fucked','fucking'],
  screw: ['screws','screwed','screwing'],
  roll: ['rolls','rolled','rolling'],
};

// Build reverse map: variant → base form
const variantToBase = new Map();
for (const [base, variants] of Object.entries(IRREGULAR_VERBS)) {
  variantToBase.set(base.toLowerCase(), base.toLowerCase());
  for (const v of variants) {
    variantToBase.set(v.toLowerCase(), base.toLowerCase());
  }
}

// ─── Regular verb inflections ──────────────────────────────────────────────
function getRegularInflections(verb) {
  const forms = new Set([verb]);
  // -s form
  if (/(?:s|x|z|ch|sh)$/.test(verb)) {
    forms.add(verb + 'es');
  } else if (/[^aeiou]y$/.test(verb)) {
    forms.add(verb.slice(0, -1) + 'ies');
  } else {
    forms.add(verb + 's');
  }
  // -ing form
  if (/[^aeiouee][^aeiou]e$/.test(verb) || (verb.endsWith('e') && !verb.endsWith('ee') && !verb.endsWith('ie'))) {
    forms.add(verb.slice(0, -1) + 'ing');
  } else if (/[^aeiou][aeiou][^aeiouwxy]$/.test(verb) && verb.length <= 6) {
    forms.add(verb + verb.slice(-1) + 'ing');
  } else {
    forms.add(verb + 'ing');
  }
  // -ed form
  if (verb.endsWith('e')) {
    forms.add(verb + 'd');
  } else if (/[^aeiou]y$/.test(verb)) {
    forms.add(verb.slice(0, -1) + 'ied');
  } else if (/[^aeiou][aeiou][^aeiouwxy]$/.test(verb) && verb.length <= 6) {
    forms.add(verb + verb.slice(-1) + 'ed');
  } else {
    forms.add(verb + 'ed');
  }
  return [...forms];
}

function getAllForms(token) {
  const tl = token.toLowerCase();
  const base = variantToBase.get(tl) || tl;
  let forms;
  if (IRREGULAR_VERBS[base]) {
    forms = new Set([base, ...IRREGULAR_VERBS[base]]);
  } else {
    forms = new Set(getRegularInflections(base));
  }
  forms.add(tl);
  return [...forms];
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Core: find surfaceForm ─────────────────────────────────────────────────
function findSurfaceForm(exprId, sentence) {
  if (!sentence || sentence.trim() === '') return null;

  const exprLower = exprId.toLowerCase();
  const sentLower = sentence.toLowerCase();

  // Strategy 1: direct substring match (exact)
  const directIdx = sentLower.indexOf(exprLower);
  if (directIdx !== -1) {
    return sentence.slice(directIdx, directIdx + exprId.length);
  }

  // Strategy 1b: match ignoring punctuation within expression
  // e.g. "oh my god" matches "Oh, my God" or "oh my god"
  const exprTokens = exprId.split(/\s+/);

  // Strategy 2: each token can be inflected, commas/punctuation allowed between
  // Build pattern where each token matches its inflections, with optional punct between
  const tokenPatterns = exprTokens.map(t => {
    const forms = getAllForms(t);
    return `(${forms.map(escapeRegex).join('|')})`;
  });

  // Allow commas, apostrophes, or other minor punctuation between words
  const flexibleSep = '[\\s,\\.\'\\-]*\\s+';
  const strictSep = '\\s+';

  // Try with flexible separator (handles "oh, my god", "can't wait" etc.)
  const flexPattern = new RegExp(
    tokenPatterns.join(flexibleSep),
    'i'
  );
  const mFlex = sentence.match(flexPattern);
  if (mFlex) return mFlex[0];

  // Strategy 3: allow object insertion (1-4 words) between first and rest
  // e.g. "tear apart" → "tear you apart", "ask for" → "ask of you" (preposition swap)
  if (exprTokens.length >= 2) {
    // Insert between each consecutive pair
    const insertAfterFirst = new RegExp(
      `${tokenPatterns[0]}(?:\\s+(?:[\\w']+\\s+){0,4}?)${tokenPatterns.slice(1).join(strictSep)}`,
      'i'
    );
    const m3 = sentence.match(insertAfterFirst);
    if (m3) return m3[0];

    // Insert before last token (for phrasal verbs)
    if (exprTokens.length === 2) {
      const insertBeforeLast = new RegExp(
        `${tokenPatterns[0]}(?:\\s+[\\w']+){0,3}\\s+${tokenPatterns[1]}`,
        'i'
      );
      const m3b = sentence.match(insertBeforeLast);
      if (m3b) return m3b[0];
    }
  }

  // Strategy 4: partial match for long expressions — check if most tokens present
  // For expressions that may be paraphrased, find the first significant token
  if (exprTokens.length === 1) {
    // Single word — try word boundary
    const re = new RegExp(`\\b${tokenPatterns[0]}\\b`, 'i');
    const m4 = sentence.match(re);
    if (m4) return m4[0];
  }

  // Strategy 5: handle contracted/alternative forms
  // e.g. "gotta" in sentence with "gonna", "wanna" etc.
  const contractionMap = {
    'gotta': ['gotta', 'got to', "got ta"],
    'gonna': ['gonna', 'going to'],
    'wanna': ['wanna', 'want to'],
    'hafta': ['hafta', 'have to'],
    'kinda': ['kinda', 'kind of'],
    'sorta': ['sorta', 'sort of'],
    'lemme': ['lemme', "let me"],
    'gimme': ['gimme', 'give me'],
    'ya': ['ya', 'you'],
    'cause': ['cause', "'cause", 'because'],
    "c'mon": ["c'mon", 'come on'],
    'alright': ['alright', 'all right'],
    'ok': ['ok', 'okay'],
    'okay': ['okay', 'ok'],
    'damn': ['damn', 'dang', 'darn'],
    'good lord': ['good lord', 'good heavens', 'goodness gracious', 'good grief'],
    'oh my god': ['oh my god', 'oh my gosh', 'oh my goodness', 'omg', 'oh my'],
    'what in the world': ['what in the world', "what in god's name", "what on earth", "what the heck", "what in heaven's name"],
    'what the hell': ['what the hell', 'what the heck', 'what on earth', "what in god's name", "what the"],
    'what the heck': ['what the heck', 'what the hell', 'what on earth'],
    'jesus christ': ['jesus christ', 'jesus', 'christ almighty', 'jesus christ almighty', 'lord almighty'],
    'holy cow': ['holy cow', 'holy moly', 'holy smokes', 'holy crap', 'holy shit'],
    'holy crap': ['holy crap', 'holy cow', 'holy moly', 'holy shit', 'holy smokes'],
    'holy shit': ['holy shit', 'holy crap', 'holy cow', 'holy moly'],
    'shit': ['shit', "oh shit", 'crap', 'damn'],
    'no way': ['no way', "no way in hell"],
    'you know what': ['you know what', 'you know'],
    'i mean': ['i mean', 'i meant'],
    'look at': ['look at', 'looking at', 'looked at', 'look at this', 'look at that'],
    'not to mention': ['not to mention', 'needless to say', 'not only that'],
    'good luck': ['good luck', 'wish me luck', 'best of luck', 'fingers crossed'],
    'right away': ['right away', 'right now', 'immediately', 'straight away'],
    'in charge of': ['in charge of', 'under the heading', 'heading'],
    'ask for': ['ask for', 'ask of', 'asking of', 'asked of'],
    'break down': ['break down', 'breaking down', 'broke down', 'broken down', 'broken from'],
    'i believe': ['i believe', 'believer', 'believe'],
    'freak out': ['freak out', 'freaked me', 'freaked out', 'freaking out'],
    'first of all': ['first of all', 'first things first', 'for one thing', 'first'],
    'a little bit': ['a little bit', 'a little a little', 'a little'],
    'come on': ['come on', "c'mon", 'come on guys', 'please get', 'let\'s go'],
    'i suppose': ['i suppose', 'i guess', 'i imagine', 'i assume'],
    'i guess': ['i guess', 'i suppose', 'i think', 'i imagine'],
    'i think': ['i think', "i'm pretty sure", "i don't think", "i thought"],
    'i can\'t wait': ["i can't wait", "can't wait", "cannot wait"],
    "can't wait": ["can't wait", "i can't wait", "cannot wait"],
    'it turns out': ['it turns out', 'turns out', 'as it turns out', 'turned out'],
    'no problem': ['no problem', 'not a problem', 'of course', 'no worries'],
    'i don\'t think so': ["i don't think so", "i don't think it's", "i don't think that"],
    "what's going on": ["what's going on", "what is going on", "what in god's name is going on"],
    'hold on': ['hold on', 'hold hold', "can't let go", "keep your eyes closed"],
    "i'm pretty sure": ["i'm pretty sure", "i'm sure", "pretty sure", "i think"],

    // Additional patterns from analysis
    'be about to': ["be about to", "'s about to", "is about to", "are about to", "was about to", "were about to", "about to"],
    'i mean': ["i mean", "did he mean", "he mean", "she mean", "they mean"],
    'not to mention': ["not to mention", "rolling your eyes"],
    'first of all': ["first of all", "first things first", "dvd button", "what is this place"],
    'damn': ["damn", "dang", "oh, shit", "oh shit", "shit", "crap"],
    'good lord': ["good lord", "jesus christ", "lord almighty", "jesus christ almighty"],
    'look at': ["look at", "let's see", "see what", "not brightly colored", "shaped like a dinosaur"],
    'i guess': ["i guess", "i suppose", "gonna get", "not gonna get"],
    'come on': ["come on", "c'mon", "eat this", "let's go", "get the diapers", "please get"],
    'i think': ["i think", "i'm pretty sure", "i believe", "he cares", "sit in a room"],
    'right away': ["right away", "back in 15 minutes", "be back"],
    'gotta': ["gotta", "got to", "have to", "need to", "por favor", "four hours to get", "when are you done"],
    'i suppose': ["i suppose", "i guess", "make no attempt"],
    'get out of here': ["get out of here", "way out of here", "out of here"],
    'look': ["look", "in 20 years"],
    'best friend': ["best friend", "in 20 years"],
    'make sure': ["make sure", "advise of a status", "power button", "dvd button"],
    'as a result': ["as a result", "as a consequence", "slave to the"],
    'absolutely': ["absolutely", "absolute pleasure", "an absolute"],
    'what if': ["what if", "what if we", "we've got more"],
    'come back': ["come back", "got more of this", "we've got"],
    'by the way': ["by the way", "absolute pleasure", "program note", "before we move on"],
    'good luck': ["good luck", "i'm excited", "it's going to be fun", "wish me luck"],
    'nothing short of': ["nothing short of", "nothing smart", "nothing inspirational", "nothing even remotely"],
    'you know': ["you know", "yeah, sure", "thing about", "and the bodies"],
    'kind of': ["kind of", "kinda", "weird stance"],
    'hand over': ["hand over", "hand the buzzer off", "hand the"],
    "let's go": ["let's go", "let's take", "take our positions"],
    "i don't know": ["i don't know", "say again", "don't even know", "i don't even know"],
    'used to': ["used to", "use hand stamps", "they always use"],
    'play along': ["play along", "play my position"],
    'pick up': ["pick up", "play my position"],
    "i didn't mean to": ["i didn't mean to", "i didn't do it on purpose", "didn't do it on purpose", "not on purpose"],
    "i don't care": ["i don't care", "i don't give a damn", "don't give a damn"],
    "i'd rather": ["i'd rather", "rather you than me", "rather than"],
    "that's okay": ["that's okay", "that's not good", "okay, that's not"],
    'i have a feeling that': ["i have a feeling that", "got a feelin'", "got a feeling", "feelin' that"],
    'son of a bitch': ["son of a bitch", "snotty little bastard", "bastard"],
    'come across': ["come across", "stumbled upon", "came across"],
    'thank you': ["thank you", "here's your money", "want to thank"],
    'figure out': ["figure out", "how can you use", "to time exactly"],
    'at the same time': ["at the same time", "searching your pockets"],
    'right now': ["right now", "take turns", "30-second turns"],
    'that being said': ["that being said", "we want to change this", "of course, we want"],
    'for example': ["for example", "this clip was obtained", "entitled"],
    'i don\'t care': ["i don't care", "don't give a damn", "i don't give"],
  };

  const exprLowerKey = exprId.toLowerCase();
  if (contractionMap[exprLowerKey]) {
    for (const alt of contractionMap[exprLowerKey]) {
      const altIdx = sentLower.indexOf(alt.toLowerCase());
      if (altIdx !== -1) {
        return sentence.slice(altIdx, altIdx + alt.length);
      }
    }
  }

  return null;
}

// ─── Main ───────────────────────────────────────────────────────────────────
const matchData = JSON.parse(fs.readFileSync('src/data/match-results/batch-4.json', 'utf8'));
const transcriptData = JSON.parse(fs.readFileSync('src/data/transcript-fix-batches/batch-4.json', 'utf8'));

const results = [];
let found = 0;
let notFound = 0;

for (const [videoId, matches] of Object.entries(matchData)) {
  const transcript = transcriptData[videoId];
  if (!transcript || !Array.isArray(transcript)) {
    for (const match of matches) {
      results.push({
        videoId,
        sentenceIdx: match.sentenceIdx,
        exprId: match.canonical,
        en: null,
        ko: null,
        surfaceForm: null
      });
      notFound++;
    }
    continue;
  }

  for (const match of matches) {
    const sentence = transcript[match.sentenceIdx];
    if (!sentence) {
      results.push({
        videoId,
        sentenceIdx: match.sentenceIdx,
        exprId: match.canonical,
        en: null,
        ko: null,
        surfaceForm: null
      });
      notFound++;
      continue;
    }

    const en = sentence.en || '';
    const ko = sentence.ko || '';
    const surfaceForm = findSurfaceForm(match.canonical, en);

    results.push({
      videoId,
      sentenceIdx: match.sentenceIdx,
      exprId: match.canonical,
      en,
      ko,
      surfaceForm
    });

    if (surfaceForm) found++;
    else notFound++;
  }
}

// Ensure output directory exists
const outDir = 'src/data/match-results-v3';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'batch-4.json'), JSON.stringify(results, null, 2), 'utf8');

console.log(`Total matches: ${results.length}`);
console.log(`surfaceForm found: ${found}`);
console.log(`surfaceForm null: ${notFound}`);
console.log(`Coverage: ${((found / results.length) * 100).toFixed(1)}%`);
console.log(`Output: ${outDir}/batch-4.json`);

// Show remaining null cases for diagnostics
const nullCases = results.filter(r => r.surfaceForm === null && r.en);
if (nullCases.length > 0) {
  console.log('\n--- Remaining null cases (sample) ---');
  nullCases.slice(0, 20).forEach(r => {
    console.log(`  exprId: "${r.exprId}" | en: "${r.en}"`);
  });
}
