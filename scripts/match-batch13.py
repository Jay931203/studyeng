import json, re, sys

def normalize_str(s):
    s = s.lower().strip()
    replacements = [
        ("can't",'cannot'),("can\u2019t",'cannot'),
        ("don't",'do not'),("don\u2019t",'do not'),
        ("doesn't",'does not'),("doesn\u2019t",'does not'),
        ("won't",'will not'),("won\u2019t",'will not'),
        ("didn't",'did not'),("didn\u2019t",'did not'),
        ("wouldn't",'would not'),("wouldn\u2019t",'would not'),
        ("couldn't",'could not'),("couldn\u2019t",'could not'),
        ("shouldn't",'should not'),("shouldn\u2019t",'should not'),
        ("isn't",'is not'),("isn\u2019t",'is not'),
        ("aren't",'are not'),("aren\u2019t",'are not'),
        ("wasn't",'was not'),("wasn\u2019t",'was not'),
        ("weren't",'were not'),("weren\u2019t",'were not'),
        ("i'm",'i am'),("i\u2019m",'i am'),
        ("i've",'i have'),("i\u2019ve",'i have'),
        ("i'll",'i will'),("i\u2019ll",'i will'),
        ("i'd",'i would'),("i\u2019d",'i would'),
        ("it's",'it is'),("it\u2019s",'it is'),
        ("that's",'that is'),("that\u2019s",'that is'),
        ("one's",'ones'),("one\u2019s",'ones'),
        ("you're",'you are'),("you\u2019re",'you are'),
        ("you've",'you have'),("you\u2019ve",'you have'),
        ("you'll",'you will'),("you\u2019ll",'you will'),
        ("you'd",'you would'),("you\u2019d",'you would'),
        ("he's",'he is'),("he\u2019s",'he is'),
        ("she's",'she is'),("she\u2019s",'she is'),
        ("they're",'they are'),("they\u2019re",'they are'),
        ("they've",'they have'),("they\u2019ve",'they have'),
        ("we're",'we are'),("we\u2019re",'we are'),
        ("we've",'we have'),("we\u2019ve",'we have'),
        ("there's",'there is'),("there\u2019s",'there is'),
        ("here's",'here is'),("here\u2019s",'here is'),
        ("let's",'let us'),("let\u2019s",'let us'),
        ("they'll",'they will'),("they\u2019ll",'they will'),
        ("we'll",'we will'),("we\u2019ll",'we will'),
        ("he'll",'he will'),("he\u2019ll",'he will'),
        ("she'll",'she will'),("she\u2019ll",'she will'),
    ]
    for c, exp in replacements:
        s = s.replace(c, exp)
    return s

def contains_expr(sentence, expr):
    s = normalize_str(sentence)
    e = normalize_str(expr)
    words = e.split()
    n = len(words)

    if n == 1:
        return bool(re.search(r'\b' + re.escape(words[0]) + r'\b', s))

    # Direct contiguous match
    direct = r'\b' + r'\s+'.join(re.escape(w) for w in words) + r'\b'
    if bool(re.search(direct, s)):
        return True

    if n == 2:
        # Phrasal verb: allow up to 2 words between particles
        # e.g. 'keep spirits up', 'keep his spirits up'
        spaced = r'\b' + re.escape(words[0]) + r'\b(?:\s+\S+){1,2}\s+\b' + re.escape(words[1]) + r'\b'
        return bool(re.search(spaced, s))

    if n >= 3:
        # Allow ONE word gap between each adjacent word pair
        # Handles flexible determiners: 'have a blast' -> 'had the blast'
        pattern = r'\b' + re.escape(words[0])
        for w in words[1:]:
            pattern += r'\b(?:\s+\S+)?\s+\b' + re.escape(w)
        pattern += r'\b'
        return bool(re.search(pattern, s))

# Load canonical
canonical = []
with open('src/data/canonical-list.txt', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line:
            canonical.append(line)

# Load batch
with open('src/data/transcript-batches/batch-13.json', 'r', encoding='utf-8') as f:
    batch = json.load(f)

print(f'Canonical: {len(canonical)}, Videos: {len(batch)}', flush=True)
sys.stdout.flush()

results = {}
total_matches = 0

for video_id, sentences in batch.items():
    video_matches = []
    for sent_idx_str, sentence in sentences.items():
        sent_idx = int(sent_idx_str)
        if len(sentence.strip()) < 3:
            continue
        for expr in canonical:
            if contains_expr(sentence, expr):
                video_matches.append({'canonical': expr, 'sentenceIdx': sent_idx})
    if video_matches:
        results[video_id] = video_matches
        total_matches += len(video_matches)
    print(f'  {video_id}: {len(video_matches)} matches', flush=True)

print(f'Total: {total_matches} matches across {len(results)} videos', flush=True)

with open('src/data/match-results/batch-13.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print('Written successfully.', flush=True)
