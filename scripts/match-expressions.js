const fs = require('fs');

// Load canonical list
const canonicalRaw = fs.readFileSync('C:/Users/hyunj/studyeng/src/data/canonical-list.txt', 'utf8');
const canonicals = canonicalRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
console.log(`Loaded ${canonicals.length} canonical expressions`);

// Load batch
const batchPath = process.argv[2] || 'C:/Users/hyunj/studyeng/src/data/transcript-batches/batch-0.json';
const outPath = process.argv[3] || 'C:/Users/hyunj/studyeng/src/data/match-results/batch-0.json';

const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const videoIds = Object.keys(batch);
console.log(`Loaded ${videoIds.length} videos`);

// ---- Helper functions ----

function expandContractions(text) {
  return text
    .replace(/\bi'm\b/gi, "i am")
    .replace(/\bi've\b/gi, "i have")
    .replace(/\bi'll\b/gi, "i will")
    .replace(/\bi'd\b/gi, "i would")
    .replace(/\byou're\b/gi, "you are")
    .replace(/\byou've\b/gi, "you have")
    .replace(/\byou'll\b/gi, "you will")
    .replace(/\byou'd\b/gi, "you would")
    .replace(/\bhe's\b/gi, "he is")
    .replace(/\bhe'll\b/gi, "he will")
    .replace(/\bhe'd\b/gi, "he would")
    .replace(/\bshe's\b/gi, "she is")
    .replace(/\bshe'll\b/gi, "she will")
    .replace(/\bshe'd\b/gi, "she would")
    .replace(/\bit's\b/gi, "it is")
    .replace(/\bit'll\b/gi, "it will")
    .replace(/\bwe're\b/gi, "we are")
    .replace(/\bwe've\b/gi, "we have")
    .replace(/\bwe'll\b/gi, "we will")
    .replace(/\bwe'd\b/gi, "we would")
    .replace(/\bthey're\b/gi, "they are")
    .replace(/\bthey've\b/gi, "they have")
    .replace(/\bthey'll\b/gi, "they will")
    .replace(/\bthey'd\b/gi, "they would")
    .replace(/\bthat's\b/gi, "that is")
    .replace(/\bthat'll\b/gi, "that will")
    .replace(/\bwhat's\b/gi, "what is")
    .replace(/\bwho's\b/gi, "who is")
    .replace(/\bwhere's\b/gi, "where is")
    .replace(/\bthere's\b/gi, "there is")
    .replace(/\bthere're\b/gi, "there are")
    .replace(/\bthere've\b/gi, "there have")
    .replace(/\bdon't\b/gi, "do not")
    .replace(/\bdoesn't\b/gi, "does not")
    .replace(/\bdidn't\b/gi, "did not")
    .replace(/\bcan't\b/gi, "cannot")
    .replace(/\bcouldn't\b/gi, "could not")
    .replace(/\bwon't\b/gi, "will not")
    .replace(/\bwouldn't\b/gi, "would not")
    .replace(/\bshouldn't\b/gi, "should not")
    .replace(/\bhasn't\b/gi, "has not")
    .replace(/\bhaven't\b/gi, "have not")
    .replace(/\bhadn't\b/gi, "had not")
    .replace(/\bisn't\b/gi, "is not")
    .replace(/\baren't\b/gi, "are not")
    .replace(/\bwasn't\b/gi, "was not")
    .replace(/\bweren't\b/gi, "were not")
    .replace(/\blet's\b/gi, "let us")
    .replace(/\bain't\b/gi, "am not")
    .replace(/\bgonna\b/gi, "going to")
    .replace(/\bwanna\b/gi, "want to")
    .replace(/\bgotta\b/gi, "got to")
    .replace(/\bkinda\b/gi, "kind of")
    .replace(/\bsorta\b/gi, "sort of");
}

function normalizeText(text) {
  return text.toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Build a regex pattern from a canonical expression
function buildPattern(canonical) {
  const norm = normalizeText(canonical);
  const expanded = expandContractions(norm);
  const tokens = expanded.split(/\s+/).filter(t => t.length > 0);
  if (tokens.length === 0) return null;

  const verbForms = {
    'be': 'be|is|am|are|was|were|been|being',
    'is': 'be|is|am|are|was|were|been|being',
    'am': 'be|is|am|are|was|were|been|being',
    'are': 'be|is|am|are|was|were|been|being',
    'was': 'be|is|am|are|was|were|been|being',
    'were': 'be|is|am|are|was|were|been|being',
    'have': 'have|has|had|having',
    'has': 'have|has|had|having',
    'had': 'have|has|had|having',
    'do': 'do|does|did|done|doing',
    'does': 'do|does|did|done|doing',
    'did': 'do|does|did|done|doing',
    'go': 'go|goes|went|gone|going',
    'get': 'get|gets|got|gotten|getting',
    'make': 'make|makes|made|making',
    'take': 'take|takes|took|taken|taking',
    'come': 'come|comes|came|coming',
    'give': 'give|gives|gave|given|giving',
    'know': 'know|knows|knew|known|knowing',
    'think': 'think|thinks|thought|thinking',
    'see': 'see|sees|saw|seen|seeing',
    'want': 'want|wants|wanted|wanting',
    'say': 'say|says|said|saying',
    'feel': 'feel|feels|felt|feeling',
    'leave': 'leave|leaves|left|leaving',
    'keep': 'keep|keeps|kept|keeping',
    'put': 'put|puts|putting',
    'bring': 'bring|brings|brought|bringing',
    'run': 'run|runs|ran|running',
    'hold': 'hold|holds|held|holding',
    'stand': 'stand|stands|stood|standing',
    'let': 'let|lets|letting',
    'find': 'find|finds|found|finding',
    'tell': 'tell|tells|told|telling',
    'break': 'break|breaks|broke|broken|breaking',
    'fall': 'fall|falls|fell|fallen|falling',
    'show': 'show|shows|showed|shown|showing',
    'hear': 'hear|hears|heard|hearing',
    'spend': 'spend|spends|spent|spending',
    'grow': 'grow|grows|grew|grown|growing',
    'send': 'send|sends|sent|sending',
    'build': 'build|builds|built|building',
    'catch': 'catch|catches|caught|catching',
    'blow': 'blow|blows|blew|blown|blowing',
    'throw': 'throw|throws|threw|thrown|throwing',
    'wear': 'wear|wears|wore|worn|wearing',
    'fight': 'fight|fights|fought|fighting',
    'deal': 'deal|deals|dealt|dealing',
    'buy': 'buy|buys|bought|buying',
    'lose': 'lose|loses|lost|losing',
    'win': 'win|wins|won|winning',
    'hit': 'hit|hits|hitting',
    'sit': 'sit|sits|sat|sitting',
    'meet': 'meet|meets|met|meeting',
    'pay': 'pay|pays|paid|paying',
    'try': 'try|tries|tried|trying',
    'turn': 'turn|turns|turned|turning',
    'move': 'move|moves|moved|moving',
    'call': 'call|calls|called|calling',
    'ask': 'ask|asks|asked|asking',
    'work': 'work|works|worked|working',
    'live': 'live|lives|lived|living',
    'play': 'play|plays|played|playing',
    'wait': 'wait|waits|waited|waiting',
    'walk': 'walk|walks|walked|walking',
    'talk': 'talk|talks|talked|talking',
    'remember': 'remember|remembers|remembered|remembering',
    'forget': 'forget|forgets|forgot|forgotten|forgetting',
    'believe': 'believe|believes|believed|believing',
    'decide': 'decide|decides|decided|deciding',
    'pick': 'pick|picks|picked|picking',
    'wake': 'wake|wakes|woke|woken|waking',
    'figure': 'figure|figures|figured|figuring',
    'stick': 'stick|sticks|stuck|sticking',
    'look': 'look|looks|looked|looking',
    'pull': 'pull|pulls|pulled|pulling',
    'push': 'push|pushes|pushed|pushing',
    'start': 'start|starts|started|starting',
    'stop': 'stop|stops|stopped|stopping',
    'help': 'help|helps|helped|helping',
    'open': 'open|opens|opened|opening',
    'close': 'close|closes|closed|closing',
    'use': 'use|uses|used|using',
    'change': 'change|changes|changed|changing',
    'learn': 'learn|learns|learned|learning',
    'become': 'become|becomes|became|becoming',
    'add': 'add|adds|added|adding',
    'care': 'care|cares|cared|caring',
    'move': 'move|moves|moved|moving',
    'turn': 'turn|turns|turned|turning',
    'read': 'read|reads|reading',
    'write': 'write|writes|wrote|written|writing',
    'speak': 'speak|speaks|spoke|spoken|speaking',
    'drive': 'drive|drives|drove|driven|driving',
    'sell': 'sell|sells|sold|selling',
    'eat': 'eat|eats|ate|eaten|eating',
    'drink': 'drink|drinks|drank|drunk|drinking',
    'sleep': 'sleep|sleeps|slept|sleeping',
    'die': 'die|dies|died|dying',
    'follow': 'follow|follows|followed|following',
    'happen': 'happen|happens|happened|happening',
    'set': 'set|sets|setting',
    'cut': 'cut|cuts|cutting',
    'draw': 'draw|draws|drew|drawn|drawing',
    'reach': 'reach|reaches|reached|reaching',
    'carry': 'carry|carries|carried|carrying',
    'bring': 'bring|brings|brought|bringing',
    'admit': 'admit|admits|admitted|admitting',
    'afford': 'afford|affords|afforded|affording',
    'allow': 'allow|allows|allowed|allowing',
    'accept': 'accept|accepts|accepted|accepting',
    'achieve': 'achieve|achieves|achieved|achieving',
    'act': 'act|acts|acted|acting',
    'apply': 'apply|applies|applied|applying',
    'avoid': 'avoid|avoids|avoided|avoiding',
    'beat': 'beat|beats|beaten|beating',
    'begin': 'begin|begins|began|begun|beginning',
    'bite': 'bite|bites|bit|bitten|biting',
    'carry': 'carry|carries|carried|carrying',
    'cause': 'cause|causes|caused|causing',
    'check': 'check|checks|checked|checking',
    'choose': 'choose|chooses|chose|chosen|choosing',
    'claim': 'claim|claims|claimed|claiming',
    'consider': 'consider|considers|considered|considering',
    'continue': 'continue|continues|continued|continuing',
    'create': 'create|creates|created|creating',
    'cross': 'cross|crosses|crossed|crossing',
    'count': 'count|counts|counted|counting',
    'cover': 'cover|covers|covered|covering',
    'deserve': 'deserve|deserves|deserved|deserving',
    'develop': 'develop|develops|developed|developing',
    'enjoy': 'enjoy|enjoys|enjoyed|enjoying',
    'enter': 'enter|enters|entered|entering',
    'expect': 'expect|expects|expected|expecting',
    'explain': 'explain|explains|explained|explaining',
    'face': 'face|faces|faced|facing',
    'fail': 'fail|fails|failed|failing',
    'fix': 'fix|fixes|fixed|fixing',
    'focus': 'focus|focuses|focused|focusing',
    'force': 'force|forces|forced|forcing',
    'form': 'form|forms|formed|forming',
    'gain': 'gain|gains|gained|gaining',
    'handle': 'handle|handles|handled|handling',
    'hate': 'hate|hates|hated|hating',
    'head': 'head|heads|headed|heading',
    'imagine': 'imagine|imagines|imagined|imagining',
    'include': 'include|includes|included|including',
    'involve': 'involve|involves|involved|involving',
    'join': 'join|joins|joined|joining',
    'jump': 'jump|jumps|jumped|jumping',
    'kill': 'kill|kills|killed|killing',
    'lead': 'lead|leads|led|leading',
    'like': 'like|likes|liked|liking',
    'listen': 'listen|listens|listened|listening',
    'love': 'love|loves|loved|loving',
    'manage': 'manage|manages|managed|managing',
    'matter': 'matter|matters|mattered|mattering',
    'mention': 'mention|mentions|mentioned|mentioning',
    'mind': 'mind|minds|minded|minding',
    'miss': 'miss|misses|missed|missing',
    'need': 'need|needs|needed|needing',
    'notice': 'notice|notices|noticed|noticing',
    'offer': 'offer|offers|offered|offering',
    'own': 'own|owns|owned|owning',
    'pass': 'pass|passes|passed|passing',
    'plan': 'plan|plans|planned|planning',
    'point': 'point|points|pointed|pointing',
    'prove': 'prove|proves|proved|proven|proving',
    'realize': 'realize|realises|realized|realised|realizing|realising',
    'refuse': 'refuse|refuses|refused|refusing',
    'repeat': 'repeat|repeats|repeated|repeating',
    'return': 'return|returns|returned|returning',
    'save': 'save|saves|saved|saving',
    'share': 'share|shares|shared|sharing',
    'sign': 'sign|signs|signed|signing',
    'solve': 'solve|solves|solved|solving',
    'spend': 'spend|spends|spent|spending',
    'split': 'split|splits|splitting',
    'stay': 'stay|stays|stayed|staying',
    'step': 'step|steps|stepped|stepping',
    'support': 'support|supports|supported|supporting',
    'suppose': 'suppose|supposes|supposed|supposing',
    'survive': 'survive|survives|survived|surviving',
    'throw': 'throw|throws|threw|thrown|throwing',
    'touch': 'touch|touches|touched|touching',
    'trust': 'trust|trusts|trusted|trusting',
    'understand': 'understand|understands|understood|understanding',
    'worry': 'worry|worries|worried|worrying',
  };

  const parts = tokens.map((token) => {
    // Flexible determiner
    if (['a', 'an', 'the'].includes(token)) {
      return '(?:a|an|the|my|your|his|her|its|our|their|this|that|these|those|some|any|every|no|one|another|each|much|many)?';
    }

    // Pronouns - flexible
    if (['i', 'you', 'he', 'she', 'it', 'we', 'they', 'one'].includes(token)) {
      return '(?:i|you|he|she|it|we|they|one|someone|anyone|everyone|nobody|somebody|anybody|everybody|people|this|that)?';
    }

    // Modal verbs
    if (token === 'will') return "(?:will|would|shall|should|may|might|can|could|must)";
    if (token === 'would') return "(?:would|will|should|could|might|may)";
    if (token === 'can') return "(?:can|could|may|might|will|would)";
    if (token === 'could') return "(?:could|can|would|might)";
    if (token === 'should') return "(?:should|would|could|must|shall)";
    if (token === 'must') return "(?:must|should|have to|need to)";
    if (token === 'may') return "(?:may|might|can|could)";
    if (token === 'might') return "(?:might|may|could|can)";

    // "not" - optional
    if (token === 'not') return '(?:not|never|no)?';

    // "to" - optional
    if (token === 'to') return '(?:to)?';

    // Known verb forms
    if (verbForms[token]) {
      return '(?:' + verbForms[token] + ')';
    }

    // Check if it's a known irregular past tense/participle and expand to base
    const reverseMap = {
      'went': 'go|goes|went|gone|going',
      'gone': 'go|goes|went|gone|going',
      'got': 'get|gets|got|gotten|getting',
      'gotten': 'get|gets|got|gotten|getting',
      'made': 'make|makes|made|making',
      'took': 'take|takes|took|taken|taking',
      'taken': 'take|takes|took|taken|taking',
      'came': 'come|comes|came|coming',
      'gave': 'give|gives|gave|given|giving',
      'given': 'give|gives|gave|given|giving',
      'knew': 'know|knows|knew|known|knowing',
      'known': 'know|knows|knew|known|knowing',
      'thought': 'think|thinks|thought|thinking',
      'saw': 'see|sees|saw|seen|seeing',
      'seen': 'see|sees|saw|seen|seeing',
      'said': 'say|says|said|saying',
      'felt': 'feel|feels|felt|feeling',
      'left': 'leave|leaves|left|leaving',
      'kept': 'keep|keeps|kept|keeping',
      'brought': 'bring|brings|brought|bringing',
      'ran': 'run|runs|ran|running',
      'held': 'hold|holds|held|holding',
      'stood': 'stand|stands|stood|standing',
      'found': 'find|finds|found|finding',
      'told': 'tell|tells|told|telling',
      'broke': 'break|breaks|broke|broken|breaking',
      'broken': 'break|breaks|broke|broken|breaking',
      'fell': 'fall|falls|fell|fallen|falling',
      'fallen': 'fall|falls|fell|fallen|falling',
      'shown': 'show|shows|showed|shown|showing',
      'heard': 'hear|hears|heard|hearing',
      'spent': 'spend|spends|spent|spending',
      'grew': 'grow|grows|grew|grown|growing',
      'grown': 'grow|grows|grew|grown|growing',
      'sent': 'send|sends|sent|sending',
      'built': 'build|builds|built|building',
      'caught': 'catch|catches|caught|catching',
      'blew': 'blow|blows|blew|blown|blowing',
      'blown': 'blow|blows|blew|blown|blowing',
      'threw': 'throw|throws|threw|thrown|throwing',
      'thrown': 'throw|throws|threw|thrown|throwing',
      'wore': 'wear|wears|wore|worn|wearing',
      'worn': 'wear|wears|wore|worn|wearing',
      'fought': 'fight|fights|fought|fighting',
      'dealt': 'deal|deals|dealt|dealing',
      'bought': 'buy|buys|bought|buying',
      'lost': 'lose|loses|lost|losing',
      'won': 'win|wins|won|winning',
      'sat': 'sit|sits|sat|sitting',
      'met': 'meet|meets|met|meeting',
      'paid': 'pay|pays|paid|paying',
      'tried': 'try|tries|tried|trying',
      'woke': 'wake|wakes|woke|woken|waking',
      'woken': 'wake|wakes|woke|woken|waking',
      'stuck': 'stick|sticks|stuck|sticking',
      'pulled': 'pull|pulls|pulled|pulling',
      'pushed': 'push|pushes|pushed|pushing',
      'beat': 'beat|beats|beaten|beating',
      'began': 'begin|begins|began|begun|beginning',
      'begun': 'begin|begins|began|begun|beginning',
      'bit': 'bite|bites|bit|bitten|biting',
      'bitten': 'bite|bites|bit|bitten|biting',
      'chose': 'choose|chooses|chose|chosen|choosing',
      'chosen': 'choose|chooses|chose|chosen|choosing',
      'led': 'lead|leads|led|leading',
      'read': 'read|reads|reading',
      'wrote': 'write|writes|wrote|written|writing',
      'written': 'write|writes|wrote|written|writing',
      'spoke': 'speak|speaks|spoke|spoken|speaking',
      'spoken': 'speak|speaks|spoke|spoken|speaking',
      'drove': 'drive|drives|drove|driven|driving',
      'driven': 'drive|drives|drove|driven|driving',
      'sold': 'sell|sells|sold|selling',
      'ate': 'eat|eats|ate|eaten|eating',
      'eaten': 'eat|eats|ate|eaten|eating',
      'drank': 'drink|drinks|drank|drunk|drinking',
      'drunk': 'drink|drinks|drank|drunk|drinking',
      'slept': 'sleep|sleeps|slept|sleeping',
      'died': 'die|dies|died|dying',
      'drew': 'draw|draws|drew|drawn|drawing',
      'drawn': 'draw|draws|drew|drawn|drawing',
      'reached': 'reach|reaches|reached|reaching',
      'carried': 'carry|carries|carried|carrying',
      'killed': 'kill|kills|killed|killing',
      'understood': 'understand|understands|understood|understanding',
      'worried': 'worry|worries|worried|worrying',
    };
    if (reverseMap[token]) {
      return '(?:' + reverseMap[token] + ')';
    }

    // Generic -ed ending: add base form variant
    if (token.endsWith('ed') && token.length > 4) {
      const base = token.slice(0, -2); // strip -ed
      const base2 = token.slice(0, -1); // strip -d (for "loved" -> "love")
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedBase2 = base2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return `(?:${escaped}|${escapedBase}|${escapedBase2}|${escapedBase}s|${escapedBase}ing|${escapedBase2}s|${escapedBase2}ing)`;
    }

    // Generic -ing ending: add base form variant
    if (token.endsWith('ing') && token.length > 5) {
      const base = token.slice(0, -3);
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return `(?:${escaped}|${escapedBase}|${escapedBase}s|${escapedBase}ed|${escapedBase}d)`;
    }

    // Generic -s/-es ending: add base form
    if (token.endsWith('es') && token.length > 4 && !['goes', 'does', 'says', 'makes', 'takes', 'gives', 'comes', 'leaves', 'tries'].includes(token)) {
      const base = token.slice(0, -2);
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return `(?:${escaped}|${escapedBase}|${escapedBase}ing|${escapedBase}ed)`;
    }

    // Escape and return literal
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped;
  });

  return parts;
}

// Precompile patterns for all canonicals
console.log('Precompiling patterns...');
const compiledPatterns = [];
const FILLER = '(?:\\s+\\S+){0,4}\\s+';
const TIGHT = '\\s+';

for (const canonical of canonicals) {
  const parts = buildPattern(canonical);
  if (!parts || parts.length === 0) {
    compiledPatterns.push({ canonical, regs: [] });
    continue;
  }

  const regs = [];

  // Single-word
  if (parts.length === 1) {
    try {
      regs.push(new RegExp('\\b' + parts[0] + '\\b', 'i'));
    } catch(e) {}
  } else {
    // Tight match
    try {
      regs.push(new RegExp('\\b' + parts.join(TIGHT) + '\\b', 'i'));
    } catch(e) {}
    // Filler match (for phrasal verbs with gaps) - only for short expressions
    if (parts.length <= 4) {
      try {
        regs.push(new RegExp('\\b' + parts.join(FILLER) + '\\b', 'i'));
      } catch(e) {}
    }
  }

  compiledPatterns.push({ canonical, regs });
}
console.log('Patterns compiled.');

function normalizeSentence(sentence) {
  const norm = sentence.toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return expandContractions(norm);
}

// Process all videos
const results = {};
let totalMatches = 0;
let videosWithMatches = 0;

for (const videoId of videoIds) {
  const sentences = batch[videoId];
  const videoMatches = [];

  for (const [sentenceKey, sentence] of Object.entries(sentences)) {
    const sentIdx = parseInt(sentenceKey, 10);
    const normSentence = normalizeSentence(sentence);

    for (const { canonical, regs } of compiledPatterns) {
      if (regs.length === 0) continue;
      let matched = false;
      for (const re of regs) {
        if (re.test(normSentence)) {
          matched = true;
          break;
        }
      }
      if (matched) {
        videoMatches.push({ canonical, sentenceIdx: sentIdx });
      }
    }
  }

  if (videoMatches.length > 0) {
    results[videoId] = videoMatches;
    videosWithMatches++;
    totalMatches += videoMatches.length;
  }
}

console.log(`\nResults: ${videosWithMatches} videos with matches, ${totalMatches} total matches`);

// Write output
fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
console.log(`Written to ${outPath}`);

// Print sample
const sampleVideos = Object.keys(results).slice(0, 5);
for (const vid of sampleVideos) {
  console.log(`\n${vid}: ${results[vid].length} matches`);
  for (const m of results[vid].slice(0, 5)) {
    console.log(`  [${m.sentenceIdx}] "${m.canonical}"`);
  }
}
