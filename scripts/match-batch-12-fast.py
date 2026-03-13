#!/usr/bin/env python
"""
Fast expression matching for batch-12.
Uses lemmatization + contraction expansion for aggressive matching.
"""

import json
import re
import os
import sys

def normalize(text):
    """Lowercase, expand contractions, strip non-alpha."""
    t = text.lower()
    # Expand contractions
    t = re.sub(r"\bi'm\b", "i am", t)
    t = re.sub(r"\bi've\b", "i have", t)
    t = re.sub(r"\bi'll\b", "i will", t)
    t = re.sub(r"\bi'd\b", "i would", t)
    t = re.sub(r"\byou're\b", "you are", t)
    t = re.sub(r"\byou've\b", "you have", t)
    t = re.sub(r"\byou'll\b", "you will", t)
    t = re.sub(r"\byou'd\b", "you would", t)
    t = re.sub(r"\bhe's\b", "he is", t)
    t = re.sub(r"\bhe'll\b", "he will", t)
    t = re.sub(r"\bhe'd\b", "he would", t)
    t = re.sub(r"\bshe's\b", "she is", t)
    t = re.sub(r"\bshe'll\b", "she will", t)
    t = re.sub(r"\bshe'd\b", "she would", t)
    t = re.sub(r"\bwe're\b", "we are", t)
    t = re.sub(r"\bwe've\b", "we have", t)
    t = re.sub(r"\bwe'll\b", "we will", t)
    t = re.sub(r"\bwe'd\b", "we would", t)
    t = re.sub(r"\bthey're\b", "they are", t)
    t = re.sub(r"\bthey've\b", "they have", t)
    t = re.sub(r"\bthey'll\b", "they will", t)
    t = re.sub(r"\bthey'd\b", "they would", t)
    t = re.sub(r"\bit's\b", "it is", t)
    t = re.sub(r"\bit'll\b", "it will", t)
    t = re.sub(r"\bit'd\b", "it would", t)
    t = re.sub(r"\bthat's\b", "that is", t)
    t = re.sub(r"\bthat'll\b", "that will", t)
    t = re.sub(r"\bthere's\b", "there is", t)
    t = re.sub(r"\bwhat's\b", "what is", t)
    t = re.sub(r"\bwho's\b", "who is", t)
    t = re.sub(r"\bdon't\b", "do not", t)
    t = re.sub(r"\bdoesn't\b", "does not", t)
    t = re.sub(r"\bdidn't\b", "did not", t)
    t = re.sub(r"\bwon't\b", "will not", t)
    t = re.sub(r"\bwouldn't\b", "would not", t)
    t = re.sub(r"\bcouldn't\b", "could not", t)
    t = re.sub(r"\bshouldn't\b", "should not", t)
    t = re.sub(r"\bcan't\b", "cannot", t)
    t = re.sub(r"\bcannot\b", "cannot", t)
    t = re.sub(r"\bhaven't\b", "have not", t)
    t = re.sub(r"\bhasn't\b", "has not", t)
    t = re.sub(r"\bhadn't\b", "had not", t)
    t = re.sub(r"\bisn't\b", "is not", t)
    t = re.sub(r"\baren't\b", "are not", t)
    t = re.sub(r"\bwasn't\b", "was not", t)
    t = re.sub(r"\bweren't\b", "were not", t)
    t = re.sub(r"\bgonna\b", "going to", t)
    t = re.sub(r"\bwanna\b", "want to", t)
    t = re.sub(r"\bgotta\b", "got to", t)
    # Remove punctuation except spaces
    t = re.sub(r"[^\w\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t

# Map each canonical base form to its inflected forms for matching
VERB_INFLECTIONS = {
    "be": r"(?:be|is|am|are|was|were|been|being)",
    "have": r"(?:have|has|had|having)",
    "do": r"(?:do|does|did|done|doing)",
    "go": r"(?:go|goes|went|gone|going)",
    "get": r"(?:get|gets|got|gotten|getting)",
    "make": r"(?:make|makes|made|making)",
    "take": r"(?:take|takes|took|taken|taking)",
    "give": r"(?:give|gives|gave|given|giving)",
    "come": r"(?:come|comes|came|coming)",
    "think": r"(?:think|thinks|thought|thinking)",
    "know": r"(?:know|knows|knew|known|knowing)",
    "see": r"(?:see|sees|saw|seen|seeing)",
    "say": r"(?:say|says|said|saying)",
    "tell": r"(?:tell|tells|told|telling)",
    "feel": r"(?:feel|feels|felt|feeling)",
    "run": r"(?:run|runs|ran|running)",
    "put": r"(?:put|puts|putting)",
    "bring": r"(?:bring|brings|brought|bringing)",
    "keep": r"(?:keep|keeps|kept|keeping)",
    "hold": r"(?:hold|holds|held|holding)",
    "find": r"(?:find|finds|found|finding)",
    "turn": r"(?:turn|turns|turned|turning)",
    "set": r"(?:set|sets|setting)",
    "break": r"(?:break|breaks|broke|broken|breaking)",
    "fall": r"(?:fall|falls|fell|fallen|falling)",
    "call": r"(?:call|calls|called|calling)",
    "look": r"(?:look|looks|looked|looking)",
    "work": r"(?:work|works|worked|working)",
    "pick": r"(?:pick|picks|picked|picking)",
    "pull": r"(?:pull|pulls|pulled|pulling)",
    "cut": r"(?:cut|cuts|cutting)",
    "stand": r"(?:stand|stands|stood|standing)",
    "move": r"(?:move|moves|moved|moving)",
    "pay": r"(?:pay|pays|paid|paying)",
    "pass": r"(?:pass|passes|passed|passing)",
    "catch": r"(?:catch|catches|caught|catching)",
    "blow": r"(?:blow|blows|blew|blown|blowing)",
    "show": r"(?:show|shows|showed|shown|showing)",
    "grow": r"(?:grow|grows|grew|grown|growing)",
    "throw": r"(?:throw|throws|threw|thrown|throwing)",
    "draw": r"(?:draw|draws|drew|drawn|drawing)",
    "carry": r"(?:carry|carries|carried|carrying)",
    "drive": r"(?:drive|drives|drove|driven|driving)",
    "ride": r"(?:ride|rides|rode|ridden|riding)",
    "write": r"(?:write|writes|wrote|written|writing)",
    "win": r"(?:win|wins|won|winning)",
    "lose": r"(?:lose|loses|lost|losing)",
    "leave": r"(?:leave|leaves|left|leaving)",
    "begin": r"(?:begin|begins|began|begun|beginning)",
    "start": r"(?:start|starts|started|starting)",
    "end": r"(?:end|ends|ended|ending)",
    "let": r"(?:let|lets|letting)",
    "meet": r"(?:meet|meets|met|meeting)",
    "sit": r"(?:sit|sits|sat|sitting)",
    "send": r"(?:send|sends|sent|sending)",
    "build": r"(?:build|builds|built|building)",
    "buy": r"(?:buy|buys|bought|buying)",
    "spend": r"(?:spend|spends|spent|spending)",
    "sell": r"(?:sell|sells|sold|selling)",
    "raise": r"(?:raise|raises|raised|raising)",
    "deal": r"(?:deal|deals|dealt|dealing)",
    "play": r"(?:play|plays|played|playing)",
    "lead": r"(?:lead|leads|led|leading)",
    "live": r"(?:live|lives|lived|living)",
    "die": r"(?:die|dies|died|dying)",
    "read": r"(?:read|reads|reading)",
    "speak": r"(?:speak|speaks|spoke|spoken|speaking)",
    "hear": r"(?:hear|hears|heard|hearing)",
    "help": r"(?:help|helps|helped|helping)",
    "learn": r"(?:learn|learns|learned|learnt|learning)",
    "hit": r"(?:hit|hits|hitting)",
    "drop": r"(?:drop|drops|dropped|dropping)",
    "save": r"(?:save|saves|saved|saving)",
    "try": r"(?:try|tries|tried|trying)",
    "open": r"(?:open|opens|opened|opening)",
    "close": r"(?:close|closes|closed|closing)",
    "stick": r"(?:stick|sticks|stuck|sticking)",
    "push": r"(?:push|pushes|pushed|pushing)",
    "hang": r"(?:hang|hangs|hung|hanging)",
    "lay": r"(?:lay|lays|laid|laying)",
    "wake": r"(?:wake|wakes|woke|woken|waking)",
    "wear": r"(?:wear|wears|wore|worn|wearing)",
    "eat": r"(?:eat|eats|ate|eaten|eating)",
    "fight": r"(?:fight|fights|fought|fighting)",
    "burn": r"(?:burn|burns|burned|burnt|burning)",
    "fill": r"(?:fill|fills|filled|filling)",
    "fix": r"(?:fix|fixes|fixed|fixing)",
    "miss": r"(?:miss|misses|missed|missing)",
    "add": r"(?:add|adds|added|adding)",
    "lend": r"(?:lend|lends|lent|lending)",
    "rely": r"(?:rely|relies|relied|relying)",
    "try": r"(?:try|tries|tried|trying)",
    "jump": r"(?:jump|jumps|jumped|jumping)",
    "roll": r"(?:roll|rolls|rolled|rolling)",
    "step": r"(?:step|steps|stepped|stepping)",
    "reach": r"(?:reach|reaches|reached|reaching)",
    "kick": r"(?:kick|kicks|kicked|kicking)",
    "knock": r"(?:knock|knocks|knocked|knocking)",
    "shoot": r"(?:shoot|shoots|shot|shooting)",
    "spread": r"(?:spread|spreads|spreading)",
    "swing": r"(?:swing|swings|swung|swinging)",
    "wake": r"(?:wake|wakes|woke|woken|waking)",
    "lay": r"(?:lay|lays|laid|laying)",
    "hang": r"(?:hang|hangs|hung|hanging)",
    "stick": r"(?:stick|sticks|stuck|sticking)",
    "get": r"(?:get|gets|got|gotten|getting)",
    "sit": r"(?:sit|sits|sat|sitting)",
    "look": r"(?:look|looks|looked|looking)",
    "bring": r"(?:bring|brings|brought|bringing)",
    "take": r"(?:take|takes|took|taken|taking)",
    "put": r"(?:put|puts|putting)",
    "run": r"(?:run|runs|ran|running)",
    "buy": r"(?:buy|buys|bought|buying)",
    "pay": r"(?:pay|pays|paid|paying)",
}

# Determiner pattern - flexible article/determiner/possessive
DET_PATTERN = r"(?:a|an|the|my|your|his|her|its|our|their|this|that|one|some|any|another|each|every|no)"

# Pronoun object pattern
OBJ_PATTERN = r"(?:someone|him|her|them|me|you|us|it|one)"

def build_pattern(expr):
    """Build a regex pattern for an expression allowing conjugation and determiner flexibility."""
    # First normalize the canonical expression
    norm = normalize(expr)
    tokens = norm.split()

    pieces = []
    for tok in tokens:
        # Check if it's a verb base that needs inflection
        if tok in VERB_INFLECTIONS:
            pieces.append(VERB_INFLECTIONS[tok])
        # Check verb inflections (reverse: is a form of some verb)
        else:
            found_verb = False
            for base, pattern_str in VERB_INFLECTIONS.items():
                # Extract all forms from pattern
                forms = re.findall(r'\w+', pattern_str)
                if tok in forms:
                    pieces.append(pattern_str)
                    found_verb = True
                    break
            if not found_verb:
                if tok in ("a", "an"):
                    pieces.append(DET_PATTERN)
                elif tok == "the":
                    pieces.append(r"(?:the|a|an|my|your|his|her|its|our|their|this|that)")
                elif tok in ("one's", "someone's"):
                    pieces.append(r"(?:one's|my|your|his|her|its|our|their|someone's)")
                elif tok == "someone":
                    pieces.append(r"(?:someone|him|her|them|me|you|us|it)")
                else:
                    pieces.append(re.escape(tok))

    # Join with flexible whitespace
    pattern = r"\s+".join(pieces)
    return r"\b" + pattern + r"\b"

def build_gapped_pattern(expr):
    """For phrasal verbs, also allow object between verb and particle."""
    norm = normalize(expr)
    tokens = norm.split()

    if len(tokens) != 2:
        return None

    pieces = []
    for tok in tokens:
        if tok in VERB_INFLECTIONS:
            pieces.append(VERB_INFLECTIONS[tok])
        else:
            found_verb = False
            for base, pattern_str in VERB_INFLECTIONS.items():
                forms = re.findall(r'\w+', pattern_str)
                if tok in forms:
                    pieces.append(pattern_str)
                    found_verb = True
                    break
            if not found_verb:
                pieces.append(re.escape(tok))

    # Allow 1-5 words between the two parts
    gap = r"(?:\s+\w+){1,5}\s+"
    pattern = pieces[0] + gap + pieces[1]
    return r"\b" + pattern + r"\b"

def main():
    canonical_path = "src/data/canonical-list.txt"
    with open(canonical_path, "r", encoding="utf-8") as f:
        canonical_expressions = [line.strip() for line in f if line.strip()]

    print(f"Loaded {len(canonical_expressions)} expressions", flush=True)

    batch_path = "src/data/transcript-batches/batch-12.json"
    with open(batch_path, "r", encoding="utf-8") as f:
        batch_data = json.load(f)

    print(f"Loaded {len(batch_data)} videos", flush=True)

    # Pre-compile patterns
    print("Pre-compiling patterns...", flush=True)
    compiled = []
    for expr in canonical_expressions:
        pats = []
        try:
            p = re.compile(build_pattern(expr), re.IGNORECASE)
            pats.append(p)
        except re.error as e:
            pass

        # Also try gapped pattern for 2-word expressions
        norm_toks = normalize(expr).split()
        if len(norm_toks) == 2:
            try:
                gp = build_gapped_pattern(expr)
                if gp:
                    p2 = re.compile(gp, re.IGNORECASE)
                    pats.append(p2)
            except re.error:
                pass

        compiled.append((expr, pats))

    print(f"Compiled {len(compiled)} expression patterns", flush=True)

    results = {}

    for vid_idx, (video_id, sentences) in enumerate(batch_data.items()):
        print(f"[{vid_idx+1}/60] {video_id} ({len(sentences)} sentences)", flush=True)
        video_matches = []

        for sent_idx_str, sentence in sentences.items():
            sent_idx = int(sent_idx_str)
            sent_norm = normalize(sentence)

            for expr, pats in compiled:
                matched = False
                for pat in pats:
                    try:
                        if pat.search(sent_norm):
                            matched = True
                            break
                    except:
                        pass
                if matched:
                    video_matches.append({
                        "canonical": expr,
                        "sentenceIdx": sent_idx
                    })

        if video_matches:
            results[video_id] = video_matches

    output_path = "src/data/match-results/batch-12.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    total = sum(len(v) for v in results.values())
    print(f"\nComplete: {len(results)}/{len(batch_data)} videos matched, {total} total matches", flush=True)
    print(f"Output: {output_path}", flush=True)

if __name__ == "__main__":
    main()
