/**
 * Expression matching script for batch-5
 * Matches canonical expressions against subtitle sentences aggressively.
 */

import fs from 'fs';

// ─── Load data ───────────────────────────────────────────────────────────────

const canonicalRaw = fs.readFileSync('./src/data/canonical-list.txt', 'utf8');
const canonicals = canonicalRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

const batch = JSON.parse(fs.readFileSync('./src/data/transcript-batches/batch-5.json', 'utf8'));

// ─── Normalization helpers ────────────────────────────────────────────────────

// Expand contractions both ways so we can match in both directions
const CONTRACTION_MAP = {
  "i'm": "i am",
  "i've": "i have",
  "i'll": "i will",
  "i'd": "i would",
  "you're": "you are",
  "you've": "you have",
  "you'll": "you will",
  "you'd": "you would",
  "he's": "he is",
  "he'd": "he would",
  "he'll": "he will",
  "she's": "she is",
  "she'd": "she would",
  "she'll": "she will",
  "it's": "it is",
  "it'll": "it will",
  "we're": "we are",
  "we've": "we have",
  "we'll": "we will",
  "we'd": "we would",
  "they're": "they are",
  "they've": "they have",
  "they'll": "they will",
  "they'd": "they would",
  "that's": "that is",
  "that'd": "that would",
  "that'll": "that will",
  "who's": "who is",
  "who'd": "who would",
  "who'll": "who will",
  "what's": "what is",
  "what'd": "what would",
  "what'll": "what will",
  "where's": "where is",
  "when's": "when is",
  "how's": "how is",
  "there's": "there is",
  "there're": "there are",
  "there'll": "there will",
  "don't": "do not",
  "doesn't": "does not",
  "didn't": "did not",
  "can't": "cannot",
  "couldn't": "could not",
  "won't": "will not",
  "wouldn't": "would not",
  "shouldn't": "should not",
  "mustn't": "must not",
  "isn't": "is not",
  "aren't": "are not",
  "wasn't": "was not",
  "weren't": "were not",
  "haven't": "have not",
  "hasn't": "has not",
  "hadn't": "had not",
  "needn't": "need not",
  "daren't": "dare not",
  "let's": "let us",
  "gonna": "going to",
  "wanna": "want to",
  "gotta": "got to",
  "kinda": "kind of",
  "sorta": "sort of",
  "lotsa": "lots of",
  "lemme": "let me",
  "gimme": "give me",
  "ain't": "am not",
};

function expandContractions(text) {
  let result = text;
  for (const [contracted, expanded] of Object.entries(CONTRACTION_MAP)) {
    // Replace whole-word contractions
    result = result.replace(new RegExp('\\b' + contracted.replace(/'/g, "'?") + '\\b', 'gi'), expanded);
  }
  return result;
}

function normalize(text) {
  // Lowercase
  let t = text.toLowerCase();
  // Replace smart quotes / apostrophes
  t = t.replace(/[\u2018\u2019\u02bc]/g, "'");
  t = t.replace(/[\u201c\u201d]/g, '"');
  // Expand contractions
  t = expandContractions(t);
  // Remove punctuation except apostrophes within words
  t = t.replace(/[^\w\s']/g, ' ');
  // Collapse whitespace
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

// ─── Verb lemmatization (simple) ─────────────────────────────────────────────

// Map inflected forms -> base form  (one-direction: inflected => base)
const VERB_MAP = {};

function addVerb(base, forms) {
  for (const f of forms) {
    VERB_MAP[f] = base;
  }
}

// Common irregular verbs
addVerb('be',    ['is','am','are','was','were','been','being','be']);
addVerb('have',  ['has','had','having','have']);
addVerb('do',    ['does','did','done','doing','do']);
addVerb('go',    ['goes','went','gone','going','go']);
addVerb('make',  ['makes','made','making','make']);
addVerb('take',  ['takes','took','taken','taking','take']);
addVerb('get',   ['gets','got','gotten','getting','get']);
addVerb('come',  ['comes','came','coming','come']);
addVerb('see',   ['sees','saw','seen','seeing','see']);
addVerb('know',  ['knows','knew','known','knowing','know']);
addVerb('think', ['thinks','thought','thinking','think']);
addVerb('give',  ['gives','gave','given','giving','give']);
addVerb('find',  ['finds','found','finding','find']);
addVerb('tell',  ['tells','told','telling','tell']);
addVerb('feel',  ['feels','felt','feeling','feel']);
addVerb('keep',  ['keeps','kept','keeping','keep']);
addVerb('say',   ['says','said','saying','say']);
addVerb('let',   ['lets','letting','let']);
addVerb('put',   ['puts','putting','put']);
addVerb('mean',  ['means','meant','meaning','mean']);
addVerb('leave', ['leaves','left','leaving','leave']);
addVerb('bring', ['brings','brought','bringing','bring']);
addVerb('hear',  ['hears','heard','hearing','hear']);
addVerb('meet',  ['meets','met','meeting','meet']);
addVerb('hold',  ['holds','held','holding','hold']);
addVerb('run',   ['runs','ran','running','run']);
addVerb('break', ['breaks','broke','broken','breaking','break']);
addVerb('fall',  ['falls','fell','fallen','falling','fall']);
addVerb('stand', ['stands','stood','standing','stand']);
addVerb('lose',  ['loses','lost','losing','lose']);
addVerb('build', ['builds','built','building','build']);
addVerb('set',   ['sets','setting','set']);
addVerb('show',  ['shows','showed','shown','showing','show']);
addVerb('buy',   ['buys','bought','buying','buy']);
addVerb('speak', ['speaks','spoke','spoken','speaking','speak']);
addVerb('spend', ['spends','spent','spending','spend']);
addVerb('grow',  ['grows','grew','grown','growing','grow']);
addVerb('turn',  ['turns','turned','turning','turn']);
addVerb('write', ['writes','wrote','written','writing','write']);
addVerb('send',  ['sends','sent','sending','send']);
addVerb('pay',   ['pays','paid','paying','pay']);
addVerb('call',  ['calls','called','calling','call']);
addVerb('ask',   ['asks','asked','asking','ask']);
addVerb('seem',  ['seems','seemed','seeming','seem']);
addVerb('play',  ['plays','played','playing','play']);
addVerb('pick',  ['picks','picked','picking','pick']);
addVerb('look',  ['looks','looked','looking','look']);
addVerb('start', ['starts','started','starting','start']);
addVerb('try',   ['tries','tried','trying','try']);
addVerb('need',  ['needs','needed','needing','need']);
addVerb('move',  ['moves','moved','moving','move']);
addVerb('work',  ['works','worked','working','work']);
addVerb('live',  ['lives','lived','living','live']);
addVerb('pull',  ['pulls','pulled','pulling','pull']);
addVerb('cut',   ['cuts','cutting','cut']);
addVerb('open',  ['opens','opened','opening','open']);
addVerb('end',   ['ends','ended','ending','end']);
addVerb('walk',  ['walks','walked','walking','walk']);
addVerb('talk',  ['talks','talked','talking','talk']);
addVerb('read',  ['reads','reading','read']);
addVerb('use',   ['uses','used','using','use']);
addVerb('stop',  ['stops','stopped','stopping','stop']);
addVerb('watch', ['watches','watched','watching','watch']);
addVerb('help',  ['helps','helped','helping','help']);
addVerb('pass',  ['passes','passed','passing','pass']);
addVerb('carry', ['carries','carried','carrying','carry']);
addVerb('happen',['happens','happened','happening','happen']);
addVerb('change',['changes','changed','changing','change']);
addVerb('throw', ['throws','threw','thrown','throwing','throw']);
addVerb('catch', ['catches','caught','catching','catch']);
addVerb('hit',   ['hits','hitting','hit']);
addVerb('drive', ['drives','drove','driven','driving','drive']);
addVerb('sit',   ['sits','sat','sitting','sit']);
addVerb('count', ['counts','counted','counting','count']);
addVerb('figure',['figures','figured','figuring','figure']);
addVerb('deal',  ['deals','dealt','dealing','deal']);
addVerb('blow',  ['blows','blew','blown','blowing','blow']);
addVerb('freak', ['freaks','freaked','freaking','freak']);
addVerb('wind',  ['winds','wound','winding','wind']);
addVerb('pull',  ['pulls','pulled','pulling','pull']);
addVerb('wrap',  ['wraps','wrapped','wrapping','wrap']);
addVerb('step',  ['steps','stepped','stepping','step']);
addVerb('beat',  ['beats','beaten','beating','beat']);
addVerb('bite',  ['bites','bit','bitten','biting','bite']);
addVerb('face',  ['faces','faced','facing','face']);
addVerb('push',  ['pushes','pushed','pushing','push']);
addVerb('fight', ['fights','fought','fighting','fight']);
addVerb('stick', ['sticks','stuck','sticking','stick']);
addVerb('stand', ['stands','stood','standing','stand']);
addVerb('learn', ['learns','learned','learnt','learning','learn']);
addVerb('believe',['believes','believed','believing','believe']);
addVerb('decide',['decides','decided','deciding','decide']);
addVerb('follow',['follows','followed','following','follow']);
addVerb('point', ['points','pointed','pointing','point']);
addVerb('consider',['considers','considered','considering','consider']);
addVerb('add',   ['adds','added','adding','add']);
addVerb('manage',['manages','managed','managing','manage']);
addVerb('love',  ['loves','loved','loving','love']);
addVerb('hope',  ['hopes','hoped','hoping','hope']);
addVerb('hate',  ['hates','hated','hating','hate']);
addVerb('remember',['remembers','remembered','remembering','remember']);
addVerb('miss',  ['misses','missed','missing','miss']);
addVerb('care',  ['cares','cared','caring','care']);
addVerb('mind',  ['minds','minded','minding','mind']);
addVerb('expect',['expects','expected','expecting','expect']);
addVerb('suppose',['supposes','supposed','supposing','suppose']);
addVerb('wonder',['wonders','wondered','wondering','wonder']);
addVerb('realize',['realizes','realized','realizing','realize']);
addVerb('wish',  ['wishes','wished','wishing','wish']);
addVerb('imagine',['imagines','imagined','imagining','imagine']);
addVerb('understand',['understands','understood','understanding','understand']);
addVerb('admit', ['admits','admitted','admitting','admit']);
addVerb('agree', ['agrees','agreed','agreeing','agree']);
addVerb('accept', ['accepts','accepted','accepting','accept']);
addVerb('appreciate',['appreciates','appreciated','appreciating','appreciate']);
addVerb('afford', ['affords','afforded','affording','afford']);
addVerb('allow', ['allows','allowed','allowing','allow']);
addVerb('avoid', ['avoids','avoided','avoiding','avoid']);
addVerb('choose',['chooses','chose','chosen','choosing','choose']);
addVerb('claim', ['claims','claimed','claiming','claim']);
addVerb('create',['creates','created','creating','create']);
addVerb('cross', ['crosses','crossed','crossing','cross']);
addVerb('drop',  ['drops','dropped','dropping','drop']);
addVerb('earn',  ['earns','earned','earning','earn']);
addVerb('eat',   ['eats','ate','eaten','eating','eat']);
addVerb('exist', ['exists','existed','existing','exist']);
addVerb('explain',['explains','explained','explaining','explain']);
addVerb('forget',['forgets','forgot','forgotten','forgetting','forget']);
addVerb('hide',  ['hides','hid','hidden','hiding','hide']);
addVerb('include',['includes','included','including','include']);
addVerb('jump',  ['jumps','jumped','jumping','jump']);
addVerb('kill',  ['kills','killed','killing','kill']);
addVerb('lay',   ['lays','laid','laying','lay']);
addVerb('lead',  ['leads','led','leading','lead']);
addVerb('lie',   ['lies','lay','lain','lying','lie']);
addVerb('listen',['listens','listened','listening','listen']);
addVerb('matter',['matters','mattered','mattering','matter']);
addVerb('notice',['notices','noticed','noticing','notice']);
addVerb('offer', ['offers','offered','offering','offer']);
addVerb('plan',  ['plans','planned','planning','plan']);
addVerb('prepare',['prepares','prepared','preparing','prepare']);
addVerb('pretend',['pretends','pretended','pretending','pretend']);
addVerb('prove', ['proves','proved','proven','proving','prove']);
addVerb('reach', ['reaches','reached','reaching','reach']);
addVerb('remain',['remains','remained','remaining','remain']);
addVerb('return',['returns','returned','returning','return']);
addVerb('save',  ['saves','saved','saving','save']);
addVerb('share', ['shares','shared','sharing','share']);
addVerb('sleep', ['sleeps','slept','sleeping','sleep']);
addVerb('smell', ['smells','smelled','smelt','smelling','smell']);
addVerb('solve', ['solves','solved','solving','solve']);
addVerb('stay',  ['stays','stayed','staying','stay']);
addVerb('suggest',['suggests','suggested','suggesting','suggest']);
addVerb('support',['supports','supported','supporting','support']);
addVerb('swim',  ['swims','swam','swum','swimming','swim']);
addVerb('test',  ['tests','tested','testing','test']);
addVerb('thank', ['thanks','thanked','thanking','thank']);
addVerb('touch', ['touches','touched','touching','touch']);
addVerb('trust', ['trusts','trusted','trusting','trust']);
addVerb('wait',  ['waits','waited','waiting','wait']);
addVerb('want',  ['wants','wanted','wanting','want']);
addVerb('waste', ['wastes','wasted','wasting','waste']);
addVerb('worry', ['worries','worried','worrying','worry']);

// Lemmatize a single token
function lemmatize(token) {
  const t = token.toLowerCase();
  if (VERB_MAP[t]) return VERB_MAP[t];
  // Simple suffix rules for regular verbs
  if (t.endsWith('ies')) return t.slice(0, -3) + 'y';
  if (t.endsWith('ied')) return t.slice(0, -3) + 'y';
  if (t.endsWith('ing')) {
    const stem = t.slice(0, -3);
    // doubled consonant: running -> run
    if (stem.length > 2 && stem[stem.length-1] === stem[stem.length-2]) {
      return stem.slice(0, -1);
    }
    return stem;
  }
  if (t.endsWith('ed')) {
    const stem = t.slice(0, -2);
    if (stem.length > 2 && stem[stem.length-1] === stem[stem.length-2]) {
      return stem.slice(0, -1);
    }
    return stem;
  }
  if (t.endsWith('es') && t.length > 3) return t.slice(0, -2);
  if (t.endsWith('s') && t.length > 2 && !['us','is','as','ss','ous','ious','ious','ness','less','ess'].some(s => t.endsWith(s))) {
    return t.slice(0, -1);
  }
  return t;
}

// Tokenize normalized text into words
function tokenize(text) {
  return text.toLowerCase().split(/\s+/).filter(t => t.length > 0);
}

// Lemmatize all tokens
function lemmatizeAll(tokens) {
  return tokens.map(lemmatize);
}

// ─── Matching logic ───────────────────────────────────────────────────────────

// Pre-process canonical expressions for matching
function preprocessCanonical(expr) {
  const norm = normalize(expr);
  const tokens = tokenize(norm);
  const lemmas = lemmatizeAll(tokens);
  return { expr, norm, tokens, lemmas };
}

const preparedCanonicals = canonicals.map(preprocessCanonical);

// Pre-process a sentence for matching
function preprocessSentence(sentence) {
  const norm = normalize(sentence);
  const tokens = tokenize(norm);
  const lemmas = lemmatizeAll(tokens);
  return { norm, tokens, lemmas };
}

/**
 * Check if canonical expression matches in a sentence.
 *
 * Strategy:
 * 1. Try subsequence-lemma matching (all words of the expression appear in order
 *    in the sentence as lemmas, allowing gaps for phrasal verbs).
 * 2. For short expressions (1-2 words), require contiguous match to avoid noise.
 * 3. For expressions with "a/an/the", use flexible determiner matching.
 */
function matchesInSentence(canonical, sentence) {
  const { tokens: cTokens, lemmas: cLemmas } = canonical;
  const { tokens: sTokens, lemmas: sLemmas } = sentence;

  if (cLemmas.length === 0 || sLemmas.length === 0) return false;

  // For single-word expressions, require exact lemma match as whole word
  if (cLemmas.length === 1) {
    return sLemmas.includes(cLemmas[0]) || sTokens.includes(cTokens[0]);
  }

  // For 2+ word expressions: try subsequence match with lemmas
  // But for short (2-word) common phrases, also check contiguous

  // Strip leading/trailing articles/determiners for flexible matching
  const DETERMINERS = new Set(['a','an','the','this','that','these','those','my','your','his','her','its','our','their','some','any']);

  // Build a version of canonical lemmas without leading/trailing determiners for flexible match
  let flexLemmas = [...cLemmas];
  // Replace determiners in expression with wildcard
  const cLemmasNoArticle = cLemmas.map(l => DETERMINERS.has(l) ? '__DET__' : l);

  // Try: contiguous subsequence match (with gaps allowed up to window size)
  // For phrasal verbs like "figure out", words can have particles/pronouns between them

  // Strategy: find the key content words of the expression and check they appear
  // in the sentence in order

  // Remove stop words that are determiners from canonical for the "skeleton"
  // But keep them for contiguous match

  // First try: contiguous n-gram match in lemma space
  if (contigMatch(cLemmas, sLemmas) || contigMatch(cLemmasNoArticle, sLemmas)) {
    return true;
  }

  // Also try original tokens (non-lemmatized) contiguous match
  if (contigMatch(cTokens, sTokens) || contigMatch(cTokens.map(t=>t.toLowerCase()), sTokens)) {
    return true;
  }

  // Second try: subsequence match (allows gaps of up to maxGap words between words)
  // This handles phrasal verbs with inserted pronouns/objects
  const maxGap = cLemmas.length <= 3 ? 3 : 5;
  if (subsequenceMatch(cLemmas, sLemmas, maxGap)) {
    return true;
  }
  if (subsequenceMatch(cLemmasNoArticle, sLemmas, maxGap)) {
    return true;
  }

  return false;
}

// Check if pattern appears as a contiguous subsequence in text
// Pattern and text are arrays of strings
// Both are lowercased already
// __DET__ in pattern matches any determiner/article
function contigMatch(pattern, text) {
  const DETERMINERS = new Set(['a','an','the','this','that','these','those','my','your','his','her','its','our','their','some','any','another','every','each','no','neither','either']);
  if (pattern.length > text.length) return false;
  outer: for (let i = 0; i <= text.length - pattern.length; i++) {
    for (let j = 0; j < pattern.length; j++) {
      const p = pattern[j];
      const t = text[i + j];
      if (p === '__DET__') {
        if (!DETERMINERS.has(t)) continue outer;
      } else {
        if (p !== t) continue outer;
      }
    }
    return true;
  }
  return false;
}

// Check if all pattern tokens appear in text in order, with gaps allowed
function subsequenceMatch(pattern, text, maxGap) {
  const DETERMINERS = new Set(['a','an','the','this','that','these','those','my','your','his','her','its','our','their','some','any','another','every','each','no','neither','either']);

  // Filter out purely determiner pattern tokens for "skeleton" check
  // But we'll try with all tokens for strictness
  let pi = 0;
  let ti = 0;
  let lastTi = -1;

  while (pi < pattern.length && ti < text.length) {
    const p = pattern[pi];
    const t = text[ti];

    if (p === '__DET__') {
      if (DETERMINERS.has(t)) {
        if (lastTi !== -1 && ti - lastTi - 1 > maxGap) break;
        lastTi = ti;
        pi++;
        ti++;
        continue;
      }
      // __DET__ is optional - skip it in pattern
      pi++;
      continue;
    }

    if (p === t) {
      if (lastTi !== -1 && ti - lastTi - 1 > maxGap) break;
      lastTi = ti;
      pi++;
    }
    ti++;
  }

  return pi === pattern.length;
}

// ─── Main matching loop ───────────────────────────────────────────────────────

const results = {};

const videoIds = Object.keys(batch);
let processedVideos = 0;

for (const videoId of videoIds) {
  const sentences = batch[videoId];
  const videoMatches = [];

  for (const [idxStr, sentence] of Object.entries(sentences)) {
    const sentenceIdx = parseInt(idxStr, 10);
    const prepSentence = preprocessSentence(sentence);

    for (const canonical of preparedCanonicals) {
      if (matchesInSentence(canonical, prepSentence)) {
        videoMatches.push({
          canonical: canonical.expr,
          sentenceIdx,
        });
      }
    }
  }

  if (videoMatches.length > 0) {
    results[videoId] = videoMatches;
  }

  processedVideos++;
  if (processedVideos % 10 === 0) {
    process.stderr.write(\`Processed \${processedVideos}/\${videoIds.length} videos...\n\`);
  }
}

// ─── Write output ─────────────────────────────────────────────────────────────

const outDir = './src/data/match-results';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(\`\${outDir}/batch-5.json\`, JSON.stringify(results, null, 2), 'utf8');

const totalMatches = Object.values(results).reduce((s, v) => s + v.length, 0);
console.log(\`Done! \${Object.keys(results).length}/\${videoIds.length} videos matched, \${totalMatches} total matches.\`);
