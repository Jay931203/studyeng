#!/usr/bin/env python
"""
Expression matching script for batch-12.
Matches canonical expressions against subtitle sentences with flexible/aggressive rules.
"""

import json
import re
import os

# ── Lemma maps ──────────────────────────────────────────────────────────────
VERB_FORMS = {
    # be
    "be": ["is", "am", "are", "was", "were", "been", "being", "be", "'s", "'re", "'m"],
    # have
    "have": ["have", "has", "had", "having", "'ve", "'d"],
    # do
    "do": ["do", "does", "did", "done", "doing"],
    # go
    "go": ["go", "goes", "went", "gone", "going"],
    # get
    "get": ["get", "gets", "got", "gotten", "getting"],
    # make
    "make": ["make", "makes", "made", "making"],
    # take
    "take": ["take", "takes", "took", "taken", "taking"],
    # give
    "give": ["give", "gives", "gave", "given", "giving"],
    # come
    "come": ["come", "comes", "came", "coming"],
    # think
    "think": ["think", "thinks", "thought", "thinking"],
    # know
    "know": ["know", "knows", "knew", "known", "knowing"],
    # see
    "see": ["see", "sees", "saw", "seen", "seeing"],
    # say
    "say": ["say", "says", "said", "saying"],
    # tell
    "tell": ["tell", "tells", "told", "telling"],
    # feel
    "feel": ["feel", "feels", "felt", "feeling"],
    # run
    "run": ["run", "runs", "ran", "running"],
    # put
    "put": ["put", "puts", "putting"],
    # bring
    "bring": ["bring", "brings", "brought", "bringing"],
    # keep
    "keep": ["keep", "keeps", "kept", "keeping"],
    # hold
    "hold": ["hold", "holds", "held", "holding"],
    # find
    "find": ["find", "finds", "found", "finding"],
    # turn
    "turn": ["turn", "turns", "turned", "turning"],
    # set
    "set": ["set", "sets", "setting"],
    # break
    "break": ["break", "breaks", "broke", "broken", "breaking"],
    # fall
    "fall": ["fall", "falls", "fell", "fallen", "falling"],
    # call
    "call": ["call", "calls", "called", "calling"],
    # look
    "look": ["look", "looks", "looked", "looking"],
    # work
    "work": ["work", "works", "worked", "working"],
    # pick
    "pick": ["pick", "picks", "picked", "picking"],
    # pull
    "pull": ["pull", "pulls", "pulled", "pulling"],
    # cut
    "cut": ["cut", "cuts", "cutting"],
    # stand
    "stand": ["stand", "stands", "stood", "standing"],
    # move
    "move": ["move", "moves", "moved", "moving"],
    # pay
    "pay": ["pay", "pays", "paid", "paying"],
    # pass
    "pass": ["pass", "passes", "passed", "passing"],
    # catch
    "catch": ["catch", "catches", "caught", "catching"],
    # blow
    "blow": ["blow", "blows", "blew", "blown", "blowing"],
    # show
    "show": ["show", "shows", "showed", "shown", "showing"],
    # grow
    "grow": ["grow", "grows", "grew", "grown", "growing"],
    # throw
    "throw": ["throw", "throws", "threw", "thrown", "throwing"],
    # draw
    "draw": ["draw", "draws", "drew", "drawn", "drawing"],
    # carry
    "carry": ["carry", "carries", "carried", "carrying"],
    # hold
    "hold": ["hold", "holds", "held", "holding"],
    # drive
    "drive": ["drive", "drives", "drove", "driven", "driving"],
    # ride
    "ride": ["ride", "rides", "rode", "ridden", "riding"],
    # write
    "write": ["write", "writes", "wrote", "written", "writing"],
    # win
    "win": ["win", "wins", "won", "winning"],
    # lose
    "lose": ["lose", "loses", "lost", "losing"],
    # leave
    "leave": ["leave", "leaves", "left", "leaving"],
    # begin
    "begin": ["begin", "begins", "began", "begun", "beginning"],
    # start
    "start": ["start", "starts", "started", "starting"],
    # end
    "end": ["end", "ends", "ended", "ending"],
    # let
    "let": ["let", "lets", "letting"],
    # meet
    "meet": ["meet", "meets", "met", "meeting"],
    # sit
    "sit": ["sit", "sits", "sat", "sitting"],
    # lie
    "lie": ["lie", "lies", "lay", "lain", "lying"],
    # send
    "send": ["send", "sends", "sent", "sending"],
    # build
    "build": ["build", "builds", "built", "building"],
    # buy
    "buy": ["buy", "buys", "bought", "buying"],
    # spend
    "spend": ["spend", "spends", "spent", "spending"],
    # sell
    "sell": ["sell", "sells", "sold", "selling"],
    # raise
    "raise": ["raise", "raises", "raised", "raising"],
    # deal
    "deal": ["deal", "deals", "dealt", "dealing"],
    # play
    "play": ["play", "plays", "played", "playing"],
    # lead
    "lead": ["lead", "leads", "led", "leading"],
    # live
    "live": ["live", "lives", "lived", "living"],
    # die
    "die": ["die", "dies", "died", "dying"],
    # read
    "read": ["read", "reads", "reading"],
    # speak
    "speak": ["speak", "speaks", "spoke", "spoken", "speaking"],
    # hear
    "hear": ["hear", "hears", "heard", "hearing"],
    # help
    "help": ["help", "helps", "helped", "helping"],
    # learn
    "learn": ["learn", "learns", "learned", "learnt", "learning"],
    # hit
    "hit": ["hit", "hits", "hitting"],
    # drop
    "drop": ["drop", "drops", "dropped", "dropping"],
    # raise
    "raise": ["raise", "raises", "raised", "raising"],
    # save
    "save": ["save", "saves", "saved", "saving"],
    # try
    "try": ["try", "tries", "tried", "trying"],
    # open
    "open": ["open", "opens", "opened", "opening"],
    # close
    "close": ["close", "closes", "closed", "closing"],
    # stick
    "stick": ["stick", "sticks", "stuck", "sticking"],
    # push
    "push": ["push", "pushes", "pushed", "pushing"],
    # pull
    "pull": ["pull", "pulls", "pulled", "pulling"],
    # hang
    "hang": ["hang", "hangs", "hung", "hanging"],
    # lay
    "lay": ["lay", "lays", "laid", "laying"],
    # wake
    "wake": ["wake", "wakes", "woke", "woken", "waking"],
    # wear
    "wear": ["wear", "wears", "wore", "worn", "wearing"],
    # eat
    "eat": ["eat", "eats", "ate", "eaten", "eating"],
    # fight
    "fight": ["fight", "fights", "fought", "fighting"],
    # buy
    "buy": ["buy", "buys", "bought", "buying"],
    # stand
    "stand": ["stand", "stands", "stood", "standing"],
    # hit
    "hit": ["hit", "hits", "hitting"],
    # burn
    "burn": ["burn", "burns", "burned", "burnt", "burning"],
    # fill
    "fill": ["fill", "fills", "filled", "filling"],
    # fix
    "fix": ["fix", "fixes", "fixed", "fixing"],
    # mix
    "mix": ["mix", "mixes", "mixed", "mixing"],
    # miss
    "miss": ["miss", "misses", "missed", "missing"],
    # add
    "add": ["add", "adds", "added", "adding"],
    # hold
    "hold": ["hold", "holds", "held", "holding"],
    # blow
    "blow": ["blow", "blows", "blew", "blown", "blowing"],
    # throw
    "throw": ["throw", "throws", "threw", "thrown", "throwing"],
    # sweep
    "sweep": ["sweep", "sweeps", "swept", "sweeping"],
    # lend
    "lend": ["lend", "lends", "lent", "lending"],
    # rely
    "rely": ["rely", "relies", "relied", "relying"],
    # apply
    "apply": ["apply", "applies", "applied", "applying"],
    # come
    "come": ["come", "comes", "came", "coming"],
    # jump
    "jump": ["jump", "jumps", "jumped", "jumping"],
    # keep
    "keep": ["keep", "keeps", "kept", "keeping"],
    # fall
    "fall": ["fall", "falls", "fell", "fallen", "falling"],
    # roll
    "roll": ["roll", "rolls", "rolled", "rolling"],
    # step
    "step": ["step", "steps", "stepped", "stepping"],
    # break
    "break": ["break", "breaks", "broke", "broken", "breaking"],
    # reach
    "reach": ["reach", "reaches", "reached", "reaching"],
    # kick
    "kick": ["kick", "kicks", "kicked", "kicking"],
    # knock
    "knock": ["knock", "knocks", "knocked", "knocking"],
    # shoot
    "shoot": ["shoot", "shoots", "shot", "shooting"],
    # bring
    "bring": ["bring", "brings", "brought", "bringing"],
    # catch
    "catch": ["catch", "catches", "caught", "catching"],
    # push
    "push": ["push", "pushes", "pushed", "pushing"],
    # raise
    "raise": ["raise", "raises", "raised", "raising"],
    # spread
    "spread": ["spread", "spreads", "spreading"],
    # swing
    "swing": ["swing", "swings", "swung", "swinging"],
}

# Contraction map: canonical token -> list of possible forms
CONTRACTION_MAP = {
    "i am": ["i am", "i'm"],
    "i will": ["i will", "i'll"],
    "i have": ["i have", "i've"],
    "i had": ["i had", "i'd"],
    "i would": ["i would", "i'd"],
    "you are": ["you are", "you're"],
    "you will": ["you will", "you'll"],
    "you have": ["you have", "you've"],
    "you would": ["you would", "you'd"],
    "he is": ["he is", "he's"],
    "he will": ["he will", "he'll"],
    "he has": ["he has", "he's"],
    "he would": ["he would", "he'd"],
    "she is": ["she is", "she's"],
    "she will": ["she will", "she'll"],
    "she has": ["she has", "she's"],
    "she would": ["she would", "she'd"],
    "we are": ["we are", "we're"],
    "we will": ["we will", "we'll"],
    "we have": ["we have", "we've"],
    "we would": ["we would", "we'd"],
    "they are": ["they are", "they're"],
    "they will": ["they will", "they'll"],
    "they have": ["they have", "they've"],
    "they would": ["they would", "they'd"],
    "it is": ["it is", "it's"],
    "it has": ["it has", "it's"],
    "it will": ["it will", "it'll"],
    "it would": ["it would", "it'd"],
    "do not": ["do not", "don't"],
    "does not": ["does not", "doesn't"],
    "did not": ["did not", "didn't"],
    "will not": ["will not", "won't"],
    "would not": ["would not", "wouldn't"],
    "could not": ["could not", "couldn't"],
    "should not": ["should not", "shouldn't"],
    "cannot": ["cannot", "can't"],
    "have not": ["have not", "haven't"],
    "has not": ["has not", "hasn't"],
    "had not": ["had not", "hadn't"],
    "is not": ["is not", "isn't"],
    "are not": ["are not", "aren't"],
    "was not": ["was not", "wasn't"],
    "were not": ["were not", "weren't"],
    "that is": ["that is", "that's"],
    "that will": ["that will", "that'll"],
    "there is": ["there is", "there's"],
    "there are": ["there are", "there're"],
    "what is": ["what is", "what's"],
    "who is": ["who is", "who's"],
    "going to": ["going to", "gonna"],
    "want to": ["want to", "wanna"],
    "got to": ["got to", "gotta"],
}

def normalize(text):
    """Lowercase and strip punctuation for comparison."""
    text = text.lower()
    # Remove punctuation except apostrophes (needed for contractions)
    text = re.sub(r"[^\w\s']", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def expand_expression(expr):
    """
    Return a list of regex patterns that match the expression
    and its conjugated/contracted variants.
    """
    norm = normalize(expr)
    # Build word tokens
    tokens = norm.split()

    # Generate pattern pieces for each token
    def token_variants(tok):
        variants = {tok}
        # Check if it's a verb with multiple forms
        for base, forms in VERB_FORMS.items():
            if tok in forms or tok == base:
                variants.update(forms)
        # Determiners flexibility: "a" can also be "an", "the", "another", "my", "your", "his", "her", "its", "our", "their", "this", "that", "one"
        if tok in ("a", "an"):
            variants.update(["a", "an", "the", "another", "my", "your", "his", "her", "its", "our", "their", "this", "that", "one", "some", "any", "no", "each", "every"])
        if tok == "the":
            variants.update(["the", "a", "an", "this", "that", "my", "your", "his", "her", "its", "our", "their"])
        # Possessives: one's -> my, your, his, her, its, our, their, someone's
        if tok == "one's":
            variants.update(["one's", "my", "your", "his", "her", "its", "our", "their", "someone's"])
        if tok == "someone's":
            variants.update(["someone's", "one's", "my", "your", "his", "her", "its", "our", "their"])
        # Pronouns in object position: "someone" can be any pronoun
        if tok == "someone":
            variants.update(["someone", "him", "her", "them", "me", "you", "us", "it"])
        return variants

    # Build regex pattern
    # For phrasal verbs we allow gaps (up to a few words) between parts
    # For multi-word expressions we allow optional determiners and flexible conjugation

    # Strategy: build a regex where each token is a word-boundary-anchored alternation
    # and between tokens we allow 0-4 words for gap (for phrasal verbs)

    pieces = []
    for i, tok in enumerate(tokens):
        variants = token_variants(tok)
        # Escape each variant
        alt = "|".join(re.escape(v) for v in sorted(variants, key=len, reverse=True))
        pieces.append(f"(?:{alt})")

    # For phrasal verbs and expressions where particle can be separated,
    # allow up to 5 words between parts
    gap = r"(?:\s+\S+){0,5}\s+"
    tight = r"\s+"

    # Simple approach: join with flexible gap for known phrasal structures
    # We use tight join but also try gap join
    patterns = []

    # Tight pattern (words adjacent with optional articles/pronouns)
    tight_pattern = tight.join(pieces)
    patterns.append(r"\b" + tight_pattern + r"\b")

    # Gap pattern for phrasal verbs (when expression is 2 words)
    if len(pieces) == 2:
        gap_pattern = pieces[0] + gap + pieces[1]
        patterns.append(r"\b" + gap_pattern + r"\b")

    # Also handle contractions: expand the expression text
    norm_lower = norm
    for long_form, short_forms in CONTRACTION_MAP.items():
        for sf in short_forms:
            if sf in norm_lower:
                # Try replacing with other forms
                for other in short_forms:
                    if other != sf:
                        alt_norm = norm_lower.replace(sf, other)
                        if alt_norm != norm_lower:
                            alt_tokens = alt_norm.split()
                            alt_pieces = []
                            for tok in alt_tokens:
                                v = token_variants(tok)
                                alt = "|".join(re.escape(vv) for vv in sorted(v, key=len, reverse=True))
                                alt_pieces.append(f"(?:{alt})")
                            alt_tight = tight.join(alt_pieces)
                            patterns.append(r"\b" + alt_tight + r"\b")

    return patterns

def sentence_matches(sentence_norm, patterns):
    for pat in patterns:
        try:
            if re.search(pat, sentence_norm, re.IGNORECASE):
                return True
        except re.error:
            pass
    return False

def main():
    # Load canonical list
    canonical_path = "src/data/canonical-list.txt"
    with open(canonical_path, "r", encoding="utf-8") as f:
        canonical_expressions = [line.strip() for line in f if line.strip()]

    print(f"Loaded {len(canonical_expressions)} canonical expressions")

    # Load batch
    batch_path = "src/data/transcript-batches/batch-12.json"
    with open(batch_path, "r", encoding="utf-8") as f:
        batch_data = json.load(f)

    print(f"Loaded {len(batch_data)} videos")

    # Pre-compute patterns for all expressions
    print("Pre-computing expression patterns...")
    expr_patterns = {}
    for expr in canonical_expressions:
        expr_patterns[expr] = expand_expression(expr)
    print("Done pre-computing patterns")

    # Match
    results = {}

    for vid_idx, (video_id, sentences) in enumerate(batch_data.items()):
        print(f"Processing video {vid_idx+1}/{len(batch_data)}: {video_id} ({len(sentences)} sentences)")
        video_matches = []

        for sent_idx_str, sentence in sentences.items():
            sent_idx = int(sent_idx_str)
            sentence_norm = normalize(sentence)

            for expr in canonical_expressions:
                patterns = expr_patterns[expr]
                if sentence_matches(sentence_norm, patterns):
                    video_matches.append({
                        "canonical": expr,
                        "sentenceIdx": sent_idx
                    })

        if video_matches:
            results[video_id] = video_matches

    # Write results
    output_path = "src/data/match-results/batch-12.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    total_matches = sum(len(v) for v in results.values())
    print(f"\nDone! {len(results)} videos with matches, {total_matches} total matches")
    print(f"Results written to {output_path}")

if __name__ == "__main__":
    main()
