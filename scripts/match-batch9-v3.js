const fs = require('fs');
const path = require('path');

// Load data
const canonicalRaw = fs.readFileSync(path.join(__dirname, '../src/data/canonical-list.txt'), 'utf8');
const canonicals = canonicalRaw.split('\n').map(l => l.trim()).filter(Boolean);
const batch = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/transcript-batches/batch-9.json'), 'utf8'));

function norm(s) {
  return s.toLowerCase().replace(/['']/g, "'").replace(/\s+/g, ' ').trim();
}

const contractionPairs = [
  ["i'm","i am"],["i've","i have"],["i'll","i will"],["i'd","i would"],
  ["you're","you are"],["you've","you have"],["you'll","you will"],["you'd","you would"],
  ["he's","he is"],["he'll","he will"],["he'd","he would"],
  ["she's","she is"],["she'll","she will"],["she'd","she would"],
  ["it's","it is"],["it'll","it will"],
  ["we're","we are"],["we've","we have"],["we'll","we will"],["we'd","we would"],
  ["they're","they are"],["they've","they have"],["they'll","they will"],["they'd","they would"],
  ["that's","that is"],["that'd","that would"],["there's","there is"],
  ["what's","what is"],["who's","who is"],["how's","how is"],["where's","where is"],
  ["don't","do not"],["doesn't","does not"],["didn't","did not"],
  ["can't","cannot"],["couldn't","could not"],["won't","will not"],["wouldn't","would not"],
  ["isn't","is not"],["aren't","are not"],["wasn't","was not"],["weren't","were not"],
  ["hasn't","has not"],["haven't","have not"],["hadn't","had not"],
  ["shouldn't","should not"],["let's","let us"],["ain't","am not"],
  ["gonna","going to"],["wanna","want to"],["gotta","got to"],
  ["here's","here is"],["that'll","that will"],["there'll","there will"],
  ["who'll","who will"],["who'd","who would"],["who've","who have"],
];

function expand(s) {
  let r = s;
  for (const [c, e] of contractionPairs) r = r.split(c).join(e);
  return r;
}

const conjugations = {
  'be': ['is','am','are','was','were','been','being','be'],
  'go': ['goes','went','gone','going','go'],
  'have': ['has','had','having','have'],
  'do': ['does','did','doing','do'],
  'make': ['makes','made','making','make'],
  'take': ['takes','took','taken','taking','take'],
  'get': ['gets','got','gotten','getting','get'],
  'give': ['gives','gave','given','giving','give'],
  'come': ['comes','came','coming','come'],
  'think': ['thinks','thought','thinking','think'],
  'know': ['knows','knew','known','knowing','know'],
  'see': ['sees','saw','seen','seeing','see'],
  'find': ['finds','found','finding','find'],
  'say': ['says','said','saying','say'],
  'tell': ['tells','told','telling','tell'],
  'feel': ['feels','felt','feeling','feel'],
  'keep': ['keeps','kept','keeping','keep'],
  'hold': ['holds','held','holding','hold'],
  'run': ['runs','ran','running','run'],
  'bring': ['brings','brought','bringing','bring'],
  'put': ['puts','putting','put'],
  'set': ['sets','setting','set'],
  'turn': ['turns','turned','turning','turn'],
  'call': ['calls','called','calling','call'],
  'try': ['tries','tried','trying','try'],
  'leave': ['leaves','left','leaving','leave'],
  'pull': ['pulls','pulled','pulling','pull'],
  'break': ['breaks','broke','broken','breaking','break'],
  'fall': ['falls','fell','fallen','falling','fall'],
  'blow': ['blows','blew','blown','blowing','blow'],
  'grow': ['grows','grew','grown','growing','grow'],
  'show': ['shows','showed','shown','showing','show'],
  'throw': ['throws','threw','thrown','throwing','throw'],
  'stand': ['stands','stood','standing','stand'],
  'build': ['builds','built','building','build'],
  'hit': ['hits','hitting','hit'],
  'sit': ['sits','sat','sitting','sit'],
  'cut': ['cuts','cutting','cut'],
  'let': ['lets','letting','let'],
  'pay': ['pays','paid','paying','pay'],
  'hear': ['hears','heard','hearing','hear'],
  'play': ['plays','played','playing','play'],
  'pick': ['picks','picked','picking','pick'],
  'look': ['looks','looked','looking','look'],
  'catch': ['catches','caught','catching','catch'],
  'lose': ['loses','lost','losing','lose'],
  'pass': ['passes','passed','passing','pass'],
  'sell': ['sells','sold','selling','sell'],
  'send': ['sends','sent','sending','send'],
  'buy': ['buys','bought','buying','buy'],
  'win': ['wins','won','winning','win'],
  'lead': ['leads','led','leading','lead'],
  'carry': ['carries','carried','carrying','carry'],
  'speak': ['speaks','spoke','spoken','speaking','speak'],
  'fill': ['fills','filled','filling','fill'],
  'lay': ['lays','laid','laying','lay'],
  'raise': ['raises','raised','raising','raise'],
  'hang': ['hangs','hung','hanging','hang'],
  'burn': ['burns','burned','burnt','burning','burn'],
  'meet': ['meets','met','meeting','meet'],
  'fight': ['fights','fought','fighting','fight'],
  'stick': ['sticks','stuck','sticking','stick'],
  'drop': ['drops','dropped','dropping','drop'],
  'step': ['steps','stepped','stepping','step'],
  'walk': ['walks','walked','walking','walk'],
  'talk': ['talks','talked','talking','talk'],
  'roll': ['rolls','rolled','rolling','roll'],
  'deal': ['deals','dealt','dealing','deal'],
  'mean': ['means','meant','meaning','mean'],
  'miss': ['misses','missed','missing','miss'],
  'reach': ['reaches','reached','reaching','reach'],
  'save': ['saves','saved','saving','save'],
  'learn': ['learns','learned','learnt','learning','learn'],
  'eat': ['eats','ate','eaten','eating','eat'],
  'drink': ['drinks','drank','drunk','drinking','drink'],
  'check': ['checks','checked','checking','check'],
  'stop': ['stops','stopped','stopping','stop'],
  'figure': ['figures','figured','figuring','figure'],
  'crack': ['cracks','cracked','cracking','crack'],
  'settle': ['settles','settled','settling','settle'],
  'snap': ['snaps','snapped','snapping','snap'],
  'face': ['faces','faced','facing','face'],
  'sign': ['signs','signed','signing','sign'],
  'draw': ['draws','drew','drawn','drawing','draw'],
  'write': ['writes','wrote','written','writing','write'],
  'ride': ['rides','rode','ridden','riding','ride'],
  'shed': ['sheds','shedding','shed'],
  'wrap': ['wraps','wrapped','wrapping','wrap'],
  'lock': ['locks','locked','locking','lock'],
  'cross': ['crosses','crossed','crossing','cross'],
  'clear': ['clears','cleared','clearing','clear'],
  'shake': ['shakes','shook','shaken','shaking','shake'],
  'cover': ['covers','covered','covering','cover'],
  'land': ['lands','landed','landing','land'],
  'open': ['opens','opened','opening','open'],
  'move': ['moves','moved','moving','move'],
  'work': ['works','worked','working','work'],
  'spend': ['spends','spent','spending','spend'],
  'read': ['reads','reading','read'],
  'ask': ['asks','asked','asking','ask'],
  'need': ['needs','needed','needing','need'],
  'seem': ['seems','seemed','seeming','seem'],
  'change': ['changes','changed','changing','change'],
  'gain': ['gains','gained','gaining','gain'],
  'close': ['closes','closed','closing','close'],
  'clean': ['cleans','cleaned','cleaning','clean'],
  'end': ['ends','ended','ending','end'],
  'kick': ['kicks','kicked','kicking','kick'],
  'jump': ['jumps','jumped','jumping','jump'],
  'head': ['heads','headed','heading','head'],
  'help': ['helps','helped','helping','help'],
};

const wordToBase = {};
for (const [base, forms] of Object.entries(conjugations)) {
  for (const f of forms) if (!wordToBase[f]) wordToBase[f] = base;
  wordToBase[base] = base;
}

function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function phraseInText(words, text) {
  const pattern = '\\b' + words.map(esc).join('\\s+') + '\\b';
  try { return new RegExp(pattern, 'i').test(text); } catch(e) { return false; }
}

function wordInText(word, text) {
  try { return new RegExp('\\b' + esc(word) + '\\b', 'i').test(text); } catch(e) { return false; }
}

// Pre-compile canonical patterns
const canonicalPatterns = canonicals.map(canonical => {
  const normC = norm(canonical);
  const expandC = expand(normC);
  // IMPORTANT: words are from the EXPANDED form, not the contracted form
  // This ensures word counts are consistent
  const expandedWords = expandC.split(' ');
  const normWords = normC.split(' ');  // for direct substring checks only
  const isSingleWord = expandedWords.length === 1 && normWords.length === 1;

  return { canonical, normC, expandC, expandedWords, normWords, isSingleWord };
});

function matches(cp, sentence) {
  const ns = norm(sentence);
  const es = expand(ns);

  const { normC, expandC, expandedWords, normWords, isSingleWord } = cp;

  // Single word (both norm and expanded are 1 word): word boundary match
  if (isSingleWord) {
    return wordInText(normC, ns) || wordInText(normC, es) || wordInText(expandC, ns) || wordInText(expandC, es);
  }

  // Multi-word: try phrase match first using normWords (preserves contractions)
  if (phraseInText(normWords, ns)) return true;
  if (phraseInText(normWords, es)) return true;

  // Try with expanded form
  if (expandC !== normC) {
    if (phraseInText(expandedWords, ns)) return true;
    if (phraseInText(expandedWords, es)) return true;
  }

  // Possessive flex: "one's" -> any possessive
  if (normC.includes("one's") || normC.includes("someone's")) {
    const flexed = expandC
      .replace(/\bone's\b/g, "(?:his|her|their|my|your|its|our|someone's|[a-z]+'s)")
      .replace(/\bsomeone's\b/g, "(?:his|her|their|my|your|its|our|someone's|[a-z]+'s)");
    try {
      const r = new RegExp(flexed, 'i');
      if (r.test(ns) || r.test(es)) return true;
    } catch(e) {}
  }

  // be-form expansion (when canonical starts with "be")
  if (expandedWords[0] === 'be') {
    const beForms = ['is','am','are','was','were','been','being'];
    const rest = expandedWords.slice(1).map(esc).join('\\s+');
    for (const bf of beForms) {
      try {
        const r = new RegExp('\\b' + bf + (rest ? '\\s+' + rest : '') + '\\b', 'i');
        if (r.test(ns) || r.test(es)) return true;
      } catch(e) {}
    }
  }

  // Verb conjugation of first word (using expandedWords for consistency)
  const base0 = wordToBase[expandedWords[0]];
  if (base0 && conjugations[base0]) {
    const forms = conjugations[base0];
    const rest = expandedWords.slice(1).map(esc).join('\\s+');
    for (const form of forms) {
      try {
        const r = new RegExp('\\b' + esc(form) + (rest ? '\\s+' + rest : '') + '\\b', 'i');
        if (r.test(ns) || r.test(es)) return true;
      } catch(e) {}
    }
  }

  // 2-word phrasal verb gap patterns: ONLY for truly 2-word expressions (expandedWords.length === 2)
  // This prevents contractions like "i'm done" (expanded to 3 words) from using this path wrongly
  if (expandedWords.length === 2) {
    const [w0, w1] = expandedWords;
    // Phrasal verb with object in between: "pick up" matches "picked the phone up"
    try {
      const r = new RegExp('\\b' + esc(w0) + '\\s+(?:\\S+\\s+){0,4}' + esc(w1) + '\\b', 'i');
      if (r.test(ns) || r.test(es)) return true;
    } catch(e) {}

    // Conjugated first word + gap
    if (base0 && conjugations[base0]) {
      for (const form of conjugations[base0]) {
        try {
          const r = new RegExp('\\b' + esc(form) + '\\s+(?:\\S+\\s+){0,3}' + esc(w1) + '\\b', 'i');
          if (r.test(ns) || r.test(es)) return true;
        } catch(e) {}
      }
    }
  }

  // 3-word phrasal verb gap patterns: ONLY for truly 3-word expressions (expandedWords.length === 3)
  if (expandedWords.length === 3) {
    const [w0, w1, w2] = expandedWords;
    try {
      const r = new RegExp('\\b' + esc(w0) + '\\s+(?:\\S+\\s+){0,5}' + esc(w2) + '\\b', 'i');
      if ((r.test(ns) || r.test(es)) && (wordInText(w1, ns) || wordInText(w1, es))) return true;
    } catch(e) {}

    if (base0 && conjugations[base0]) {
      for (const form of conjugations[base0]) {
        try {
          const r = new RegExp('\\b' + esc(form) + '\\s+(?:\\S+\\s+){0,5}' + esc(w2) + '\\b', 'i');
          if ((r.test(ns) || r.test(es)) && (wordInText(w1, ns) || wordInText(w1, es))) return true;
        } catch(e) {}
      }
    }
  }

  // For contractions that expand to more words, also try the normWords gap patterns
  // if normWords.length === 2 (e.g. "i'm supposed" type patterns - but we won't gap-match those)
  // We do NOT apply gap patterns to contraction-expanded multi-word phrases

  return false;
}

console.error('Processing ' + Object.keys(batch).length + ' videos with ' + canonicals.length + ' expressions...');
const results = {};
let total = 0;

for (const [videoId, sentences] of Object.entries(batch)) {
  const videoMatches = [];
  for (const [idxStr, sentence] of Object.entries(sentences)) {
    const idx = parseInt(idxStr);
    for (const cp of canonicalPatterns) {
      if (matches(cp, sentence)) {
        videoMatches.push({ canonical: cp.canonical, sentenceIdx: idx });
      }
    }
  }
  if (videoMatches.length > 0) {
    results[videoId] = videoMatches;
    total += videoMatches.length;
  }
}

console.error('Done. Videos: ' + Object.keys(results).length + '/' + Object.keys(batch).length);
console.error('Total matches: ' + total);

const outPath = path.join(__dirname, '../src/data/match-results/batch-9.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(results));
console.error('Saved to ' + outPath);
