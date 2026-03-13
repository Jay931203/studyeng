import json
import re

with open(r'C:\Users\hyunj\studyeng\src\data\transcript-batches\batch-13.json', 'r', encoding='utf-8') as f:
    batch = json.load(f)

with open(r'C:\Users\hyunj\studyeng\src\data\canonical-list.txt', 'r', encoding='utf-8') as f:
    canonical = [line.strip() for line in f if line.strip()]

def normalize(s):
    return re.sub(r"[''']", "'", s.lower().strip())

IRREGULARS = {
    'went':'go','gone':'go','going':'go','goes':'go',
    'thought':'think','thinking':'think','thinks':'think',
    'was':'be','were':'be','been':'be','being':'be','is':'be','am':'be','are':'be',
    'had':'have','having':'have','has':'have',
    'did':'do','done':'do','doing':'do','does':'do',
    'said':'say','saying':'say','says':'say',
    'got':'get','gotten':'get','getting':'get','gets':'get',
    'came':'come','coming':'come','comes':'come',
    'took':'take','taken':'take','taking':'take','takes':'take',
    'gave':'give','given':'give','giving':'give','gives':'give',
    'made':'make','making':'make','makes':'make',
    'knew':'know','known':'know','knowing':'know','knows':'know',
    'saw':'see','seen':'see','seeing':'see','sees':'see',
    'ran':'run','running':'run','runs':'run',
    'kept':'keep','keeping':'keep','keeps':'keep',
    'fell':'fall','fallen':'fall','falling':'fall','falls':'fall',
    'broke':'break','broken':'break','breaking':'break','breaks':'break',
    'told':'tell','telling':'tell','tells':'tell',
    'felt':'feel','feeling':'feel','feels':'feel',
    'left':'leave','leaving':'leave','leaves':'leave',
    'lost':'lose','losing':'lose','loses':'lose',
    'brought':'bring','bringing':'bring','brings':'bring',
    'found':'find','finding':'find','finds':'find',
    'stood':'stand','standing':'stand','stands':'stand',
    'sat':'sit','sitting':'sit','sits':'sit',
    'held':'hold','holding':'hold','holds':'hold',
    'heard':'hear','hearing':'hear','hears':'hear',
    'caught':'catch','catching':'catch','catches':'catch',
    'threw':'throw','thrown':'throw','throwing':'throw','throws':'throw',
    'sent':'send','sending':'send','sends':'send',
    'met':'meet','meeting':'meet','meets':'meet',
    'let':'let','letting':'let','lets':'let',
    'hit':'hit','hitting':'hit','hits':'hit',
    'cut':'cut','cutting':'cut','cuts':'cut',
    'led':'lead','leading':'lead','leads':'lead',
    'wore':'wear','worn':'wear','wearing':'wear','wears':'wear',
    'lit':'light','lighting':'light','lights':'light',
    'hung':'hang','hanging':'hang','hangs':'hang',
    'dug':'dig','digging':'dig','digs':'dig',
    'shot':'shoot','shooting':'shoot','shoots':'shoot',
    'shook':'shake','shaken':'shake','shaking':'shake',
    'blew':'blow','blown':'blow','blowing':'blow','blows':'blow',
    'grew':'grow','grown':'grow','growing':'grow','grows':'grow',
    'wrote':'write','written':'write','writing':'write','writes':'write',
    'bought':'buy','buying':'buy','buys':'buy',
    'built':'build','building':'build','builds':'build',
    'paid':'pay','paying':'pay','pays':'pay',
    'laid':'lay','laying':'lay','lays':'lay',
    'drew':'draw','drawn':'draw','drawing':'draw','draws':'draw',
    'drove':'drive','driven':'drive','driving':'drive','drives':'drive',
    'rode':'ride','ridden':'ride','riding':'ride','rides':'ride',
    'rose':'rise','risen':'rise','rising':'rise','rises':'rise',
    'woke':'wake','woken':'wake','waking':'wake','wakes':'wake',
    'chose':'choose','chosen':'choose','choosing':'choose','chooses':'choose',
    'fought':'fight','fighting':'fight','fights':'fight',
    'won':'win','winning':'win','wins':'win',
    'meant':'mean','meaning':'mean','means':'mean',
    'dealt':'deal','dealing':'deal','deals':'deal',
    'spoke':'speak','spoken':'speak','speaking':'speak','speaks':'speak',
    'wound':'wind','winding':'wind','winds':'wind',
    'picked':'pick','picking':'pick','picks':'pick',
    'figured':'figure','figuring':'figure','figures':'figure',
    'turned':'turn','turning':'turn','turns':'turn',
    'looked':'look','looking':'look','looks':'look',
}

def get_forms(word):
    forms = {word}
    if word in IRREGULARS:
        forms.add(IRREGULARS[word])
    if word.endswith('ed'):
        forms.add(word[:-2])
        forms.add(word[:-1])
        if word.endswith('ied') and len(word) > 4:
            forms.add(word[:-3]+'y')
    if word.endswith('ing'):
        forms.add(word[:-3])
        forms.add(word[:-3]+'e')
        if len(word) > 5 and word[-4] == word[-5]:
            forms.add(word[:-4])
    if word.endswith('s') and not word.endswith('ss') and len(word) > 3:
        forms.add(word[:-1])
        if word.endswith('ies') and len(word) > 4:
            forms.add(word[:-3]+'y')
    return forms

CONTRACTION_MAP = [
    ("i'm","i am"),("i've","i have"),("i'll","i will"),("i'd","i would"),
    ("you're","you are"),("you've","you have"),("you'll","you will"),("you'd","you would"),
    ("he's","he is"),("he'll","he will"),("he'd","he would"),
    ("she's","she is"),("she'll","she will"),("she'd","she would"),
    ("it's","it is"),("it'll","it will"),
    ("we're","we are"),("we've","we have"),("we'll","we will"),("we'd","we would"),
    ("they're","they are"),("they've","they have"),("they'll","they will"),("they'd","they would"),
    ("that's","that is"),("there's","there is"),("here's","here is"),
    ("who's","who is"),("what's","what is"),("where's","where is"),("how's","how is"),
    ("isn't","is not"),("aren't","are not"),("wasn't","was not"),("weren't","were not"),
    ("haven't","have not"),("hasn't","has not"),("hadn't","had not"),
    ("won't","will not"),("wouldn't","would not"),("can't","cannot"),("couldn't","could not"),
    ("shouldn't","should not"),("don't","do not"),("doesn't","does not"),("didn't","did not"),
    ("let's","let us"),
    ("gonna","going to"),("wanna","want to"),("gotta","got to"),
    ("'ve"," have"),("'ll"," will"),("'re"," are"),("'d"," would"),("'m"," am"),
    ("'s"," is"),
]

def expand(text):
    t = normalize(text)
    for c, e in CONTRACTION_MAP:
        t = t.replace(c, e)
    return t

DETERMINERS = {'a','an','the','my','your','his','her','its','our','their','this','that','another','some','any','one'}
FUNCTION_WORDS = {'a','an','the','in','on','at','to','for','of','with','by','from','up','out','off',
                  'is','am','are','be','my','your','his','her','its','our','their',
                  'i','you','he','she','it','we','they','this','that','these','those',
                  'and','or','but','not','no','do','does','did','have','has','had',
                  'will','would','could','should','may','might','must','one',"s","one's","over","down"}

def words_of(text):
    return [re.sub(r"[^\w']", '', w) for w in text.split()]

def words_match(ew, sw):
    ef = get_forms(ew)
    sf = get_forms(sw)
    return bool(ef & sf) or ew in sf or sw in ef

def sentence_matches(sentence, expr):
    s_norm = normalize(sentence)
    e_norm = normalize(expr)

    # Direct substring
    if e_norm in s_norm:
        return True

    s_exp = expand(sentence)
    e_exp = expand(expr)

    if e_norm in s_exp or e_exp in s_norm or e_exp in s_exp:
        return True

    e_words = words_of(e_norm)
    e_words_exp = words_of(e_exp)
    s_words = words_of(s_exp)
    s_words_norm = words_of(s_norm)
    all_s_words = list(set(s_words + s_words_norm))

    if len(e_words) == 0:
        return False

    # Single word match
    if len(e_words) == 1:
        w = e_words[0]
        for sw in all_s_words:
            if words_match(w, sw):
                return True
        return False

    # Multi-word: try consecutive window with lemmatization (allow determiners to flex)
    for e_wds in [e_words, e_words_exp]:
        for s_wds in [s_words, s_words_norm]:
            n = len(e_wds)
            for i in range(len(s_wds) - n + 1):
                window = s_wds[i:i+n]
                ok = True
                for ew, sw in zip(e_wds, window):
                    if not words_match(ew, sw):
                        if ew in DETERMINERS or sw in DETERMINERS:
                            continue
                        ok = False
                        break
                if ok:
                    return True

    # Gap matching for phrasal verbs: all content words present in sentence
    key_words = [w for w in e_words_exp if w not in FUNCTION_WORDS and len(w) > 2]
    if len(key_words) >= 2:
        all_found = True
        for kw in key_words:
            found = False
            for sw in all_s_words:
                if words_match(kw, sw):
                    found = True
                    break
            if not found:
                all_found = False
                break
        if all_found:
            return True

    return False

import os
os.makedirs(r'C:\Users\hyunj\studyeng\src\data\match-results', exist_ok=True)

results = {}
for video_id, sentences in batch.items():
    matches = []
    seen = set()
    for sent_idx_str, sentence in sentences.items():
        sent_idx = int(sent_idx_str)
        for expr in canonical:
            if sentence_matches(sentence, expr):
                key = (expr, sent_idx)
                if key not in seen:
                    seen.add(key)
                    matches.append({"canonical": expr, "sentenceIdx": sent_idx})
    if matches:
        results[video_id] = matches

print(f"Videos with matches: {len(results)}/{len(batch)}")
print(f"Total matches: {sum(len(v) for v in results.values())}")

with open(r'C:\Users\hyunj\studyeng\src\data\match-results\batch-13.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("Written to match-results/batch-13.json")
