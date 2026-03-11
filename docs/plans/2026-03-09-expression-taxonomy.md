# Shortee Expression Taxonomy
## Sentence Classification System for 26,000+ Sentences

Date: 2026-03-09
Purpose: Define a practical, AI-taggable taxonomy for classifying English expressions from drama/movie/entertainment clips.

---

## Design Principles

1. **Flat enough for AI** - An LLM must be able to assign tags in a single pass per sentence
2. **Multi-label** - A sentence can have multiple tags (e.g., both "requesting" and "formal")
3. **Learner-facing labels** - Categories should make sense to Korean learners browsing content
4. **Drama/movie optimized** - Weighted toward spoken, emotional, interpersonal language (not academic)
5. **Game-system compatible** - Tags must enable filtering for games, quizzes, and review activities

---

## TAXONOMY OVERVIEW

Each sentence gets tagged across **6 independent dimensions**:

| Dimension | What it captures | # of values |
|-----------|-----------------|-------------|
| 1. Communicative Function | What the speaker is DOING | ~40 specific functions grouped into 8 categories |
| 2. Situation/Scene | WHERE/WHEN this would occur | ~25 situations |
| 3. CEFR Level | How hard is this? | 6 levels (A1-C2) |
| 4. Register | How formal/casual? | 5 levels |
| 5. Emotion/Tone | How does the speaker FEEL? | 10 labels |
| 6. Expression Type | What kind of language pattern? | 8 types |

---

## DIMENSION 1: Communicative Function (Primary Tag)

Based on Van Ek & Trim's Threshold Level (1990), Searle's speech act taxonomy, and standard ESL functional syllabi. Adapted for drama/movie content.

### Category 1: INFORMATION (Assertives)
Sharing or seeking facts. Searle's "assertives" - committing to truth of a proposition.

| ID | Function | Example |
|----|----------|---------|
| F01 | stating_fact | "The flight leaves at 9." |
| F02 | describing | "She has long dark hair." |
| F03 | narrating | "So I walked in and everyone was staring at me." |
| F04 | explaining | "The reason I'm late is the traffic." |
| F05 | reporting | "He said he'd be here by noon." |
| F06 | asking_information | "What time does the store close?" |
| F07 | confirming | "So you're saying it's tomorrow?" |
| F08 | correcting | "Actually, that's not what happened." |

### Category 2: OPINIONS & EVALUATION (Assertives/Expressives)
Expressing subjective views, judgments, beliefs.

| ID | Function | Example |
|----|----------|---------|
| F09 | expressing_opinion | "I think that's a terrible idea." |
| F10 | agreeing | "You're absolutely right." |
| F11 | disagreeing | "I don't think so." / "That's not how I see it." |
| F12 | evaluating_judging | "That was the best meal I've ever had." |
| F13 | comparing | "This one's way better than the last." |
| F14 | speculating | "Maybe he just doesn't want to come." |

### Category 3: EMOTIONS & ATTITUDES (Expressives)
Searle's "expressives" - speaker's psychological state.

| ID | Function | Example |
|----|----------|---------|
| F15 | expressing_happiness | "I'm so happy for you!" |
| F16 | expressing_sadness | "I can't believe she's gone." |
| F17 | expressing_anger | "I'm sick of this!" |
| F18 | expressing_surprise | "No way! Are you serious?" |
| F19 | expressing_fear_worry | "I'm scared something's going to happen." |
| F20 | expressing_disappointment | "I expected better from you." |
| F21 | expressing_frustration | "This is driving me crazy." |
| F22 | expressing_love_affection | "You mean everything to me." |
| F23 | expressing_disgust | "That's disgusting." |
| F24 | expressing_hope | "I really hope this works out." |

### Category 4: SOCIAL ACTIONS (Expressives + Commissives)
Interpersonal rituals and relationship management.

| ID | Function | Example |
|----|----------|---------|
| F25 | greeting | "Hey, what's up?" / "Good morning." |
| F26 | introducing | "I'd like you to meet my friend." |
| F27 | thanking | "Thanks so much, I really appreciate it." |
| F28 | apologizing | "I'm sorry, I didn't mean to hurt you." |
| F29 | congratulating | "Congrats on the promotion!" |
| F30 | complimenting | "You look amazing tonight." |
| F31 | consoling_comforting | "It's going to be okay." |
| F32 | saying_goodbye | "Take care. See you around." |
| F33 | small_talk | "So, how's work going?" |

### Category 5: GETTING THINGS DONE (Directives + Commissives)
Searle's "directives" (getting hearer to act) and "commissives" (committing to action).

| ID | Function | Example |
|----|----------|---------|
| F34 | requesting | "Could you pass me the salt?" |
| F35 | ordering_commanding | "Get out of here. Now." |
| F36 | suggesting | "Why don't we grab some coffee?" |
| F37 | advising | "If I were you, I'd talk to her." |
| F38 | inviting | "Want to come to the party tonight?" |
| F39 | offering | "Can I get you anything?" |
| F40 | warning | "Be careful, the road's slippery." |
| F41 | promising | "I promise I'll be there." |
| F42 | threatening | "If you do that again, we're done." |
| F43 | refusing | "I can't do that. Sorry." |
| F44 | accepting | "Sure, I'd love to." |
| F45 | persuading | "Come on, it'll be fun." |
| F46 | permission_asking | "Do you mind if I sit here?" |
| F47 | permission_granting | "Go ahead, no problem." |

### Category 6: CONVERSATIONAL MANAGEMENT (Discourse)
Structuring, maintaining, and repairing conversation.

| ID | Function | Example |
|----|----------|---------|
| F48 | changing_topic | "Anyway, what I wanted to say was..." |
| F49 | interrupting | "Sorry to interrupt, but..." |
| F50 | clarifying | "What I mean is..." |
| F51 | checking_understanding | "Does that make sense?" |
| F52 | buying_time | "Let me think about that." |
| F53 | backchanneling | "Uh-huh." / "Right." / "I see." |
| F54 | summarizing | "So basically, what you're saying is..." |

### Category 7: CONFLICT & CONFRONTATION (Drama-heavy)
Especially common in drama/movie content.

| ID | Function | Example |
|----|----------|---------|
| F55 | accusing | "You lied to me!" |
| F56 | denying | "I didn't do anything wrong." |
| F57 | defending | "I had no choice!" |
| F58 | insulting | "You're pathetic." |
| F59 | sarcasm_irony | "Oh great, another meeting." |
| F60 | confronting | "We need to talk about what happened." |
| F61 | forgiving | "I forgive you." |

### Category 8: DECLARATIONS & PERFORMATIVES
Searle's "declarations" - utterances that change reality.

| ID | Function | Example |
|----|----------|---------|
| F62 | announcing | "I have something to tell everyone." |
| F63 | deciding | "That's it. I'm leaving." |
| F64 | confessing | "There's something I need to tell you." |
| F65 | vowing | "I swear I'll make this right." |

---

## DIMENSION 2: Situation / Scene Context

Where would this sentence naturally occur? Organized by life domains.

### Daily Life
| ID | Situation |
|----|-----------|
| S01 | home_family |
| S02 | cooking_meals |
| S03 | morning_routine |
| S04 | shopping |
| S05 | restaurant_cafe |
| S06 | driving_commuting |

### Relationships
| ID | Situation |
|----|-----------|
| S07 | romantic_dating |
| S08 | friendship |
| S09 | family_conflict |
| S10 | breakup_divorce |

### Work & School
| ID | Situation |
|----|-----------|
| S11 | workplace_office |
| S12 | job_interview |
| S13 | school_classroom |
| S14 | meeting_presentation |

### Travel & Services
| ID | Situation |
|----|-----------|
| S15 | airport_travel |
| S16 | hotel |
| S17 | hospital_doctor |
| S18 | phone_call |

### Social & Entertainment
| ID | Situation |
|----|-----------|
| S19 | party_social_event |
| S20 | sports_fitness |
| S21 | bar_nightlife |

### High Stakes (Drama)
| ID | Situation |
|----|-----------|
| S22 | legal_courtroom |
| S23 | emergency_crisis |
| S24 | confrontation_argument |
| S25 | confession_secret |

---

## DIMENSION 3: CEFR Level

Difficulty estimation based on vocabulary, grammar complexity, and cultural knowledge required.

| Level | Description | Typical Markers |
|-------|-------------|-----------------|
| A1 | Beginner | Simple present, basic vocabulary, short sentences |
| A2 | Elementary | Past tense, common expressions, everyday topics |
| B1 | Intermediate | Modal verbs, opinions, connected speech |
| B2 | Upper-Intermediate | Complex clauses, idioms, nuanced expression |
| C1 | Advanced | Sophisticated vocab, irony, cultural references |
| C2 | Mastery | Rare idioms, literary language, highly nuanced |

**For drama/movie content, expected distribution:**
- A1-A2: ~15% (simple greetings, basic dialogue)
- B1-B2: ~55% (bulk of conversational drama)
- C1-C2: ~30% (slang, idioms, cultural references, sarcasm)

---

## DIMENSION 4: Register (Formality)

Based on Martin Joos's 5-level model, simplified for practical tagging.

| Level | ID | Label | Description | Example |
|-------|----|-------|-------------|---------|
| 1 | R1 | frozen | Ritualized, unchanging | "I do solemnly swear..." |
| 2 | R2 | formal | Professional, precise | "I would like to express my gratitude." |
| 3 | R3 | consultative | Respectful, standard | "Could you help me with this?" |
| 4 | R4 | casual | Relaxed, among peers | "Wanna grab lunch?" |
| 5 | R5 | intimate | Private, close relationships | "Love you, babe." |

**For drama/movie content, expected distribution:**
- R1 (frozen): ~2%
- R2 (formal): ~10%
- R3 (consultative): ~25%
- R4 (casual): ~50%
- R5 (intimate): ~13%

---

## DIMENSION 5: Emotion / Tone

Based on Plutchik's wheel (used by NRC lexicon in NLP), adapted for conversational tagging.

| ID | Emotion | Opposing |
|----|---------|----------|
| E01 | joy | sadness |
| E02 | sadness | joy |
| E03 | anger | fear |
| E04 | fear | anger |
| E05 | surprise | anticipation |
| E06 | anticipation | surprise |
| E07 | trust | disgust |
| E08 | disgust | trust |
| E09 | neutral | - |
| E10 | sarcastic | - |

Notes:
- `neutral` (E09) is the most common tag - purely informational sentences
- `sarcastic` (E10) is added because it's extremely common in drama/movie content and critical for learners to recognize
- A sentence can have at most 2 emotion tags (primary + secondary)

---

## DIMENSION 6: Expression Type

What kind of linguistic pattern does this sentence contain? This drives game/exercise generation.

| ID | Type | Description | Example |
|----|------|-------------|---------|
| X01 | phrasal_verb | Verb + particle with idiomatic meaning | "I ran into her at the store." |
| X02 | idiom | Fixed expression, non-literal meaning | "It's raining cats and dogs." |
| X03 | collocation | Words that naturally co-occur | "make a decision" / "heavy rain" |
| X04 | fixed_expression | Formulaic, unalterable phrase | "by the way" / "as a matter of fact" |
| X05 | slang | Informal, trendy, group-specific | "That's lit." / "No cap." |
| X06 | filler_discourse_marker | Conversation management words | "well..." / "you know" / "I mean" |
| X07 | hedging | Softening/uncertainty markers | "sort of" / "kind of" / "maybe" |
| X08 | plain | Standard grammar, no special pattern | "I went to the store yesterday." |

Notes:
- `plain` (X08) is the default when no special pattern is present
- A sentence can have multiple expression types (e.g., both phrasal_verb and hedging)

---

## TAGGING FORMAT (for AI batch processing)

Each sentence would be tagged as a JSON object:

```json
{
  "id": "abc123-42",
  "en": "Come on, it'll be fun, I promise!",
  "ko": "어서, 재밌을 거야, 약속해!",
  "tags": {
    "functions": ["F45", "F41"],
    "situation": "S19",
    "cefr": "A2",
    "register": "R4",
    "emotions": ["E01", "E06"],
    "expression_types": ["X08"]
  }
}
```

---

## AI TAGGING PROMPT STRATEGY

For batch-tagging 26,000 sentences, use a structured prompt with:

1. **System prompt**: Full taxonomy definitions + examples
2. **Batch size**: 20-50 sentences per API call
3. **Model**: Claude Haiku (cost-effective for classification)
4. **Output**: Structured JSON
5. **Validation pass**: Sample 200 sentences, human-check accuracy, refine prompt

Estimated cost (Claude Haiku at ~$0.25/M input, $1.25/M output):
- ~26,000 sentences / 30 per batch = ~867 calls
- ~2000 tokens input + ~600 tokens output per call
- Total: ~$1-2 for full corpus tagging

---

## LEARNER-FACING CATEGORY NAMES (Korean)

For the app UI, these academic labels need friendly Korean names:

### Function Groups (Tab/Filter labels)
| Internal | Korean Label | Description |
|----------|-------------|-------------|
| Information | 정보 전달 | 사실, 설명, 질문 |
| Opinions | 의견 & 평가 | 생각, 동의, 반대 |
| Emotions | 감정 표현 | 기쁨, 슬픔, 분노 |
| Social | 사교 표현 | 인사, 감사, 사과 |
| Action | 행동 유도 | 부탁, 제안, 초대 |
| Conversation | 대화 기술 | 주제 전환, 맞장구 |
| Conflict | 갈등 & 대립 | 비난, 변명, 대결 |
| Declaration | 선언 & 결심 | 발표, 고백, 맹세 |

### Situation Groups (Browse labels)
| Internal | Korean Label |
|----------|-------------|
| Daily Life | 일상생활 |
| Relationships | 연애 & 관계 |
| Work & School | 직장 & 학교 |
| Travel | 여행 & 서비스 |
| Social | 모임 & 여가 |
| Drama | 긴박한 상황 |

### CEFR (Difficulty labels)
| Level | Korean Label |
|-------|-------------|
| A1-A2 | 초급 |
| B1-B2 | 중급 |
| C1-C2 | 고급 |

---

## GAME SYSTEM INTEGRATION

How each dimension enables specific game types:

| Game Type | Primary Dimension Used |
|-----------|----------------------|
| Fill-in-the-blank | Expression Type (phrasal verbs, collocations) |
| Situation matching | Situation + Function |
| Tone/register quiz | Register + Emotion |
| Next-line prediction | Function sequence patterns |
| Formality conversion | Register (convert casual to formal) |
| Emotion detection | Emotion/Tone |
| Similar expression finder | Function + Register (same function, different register) |

---

## IMPLEMENTATION PHASES

### Phase 1: Core tagging (MVP)
- Tag all 26,000 sentences with: Function (top 1-2), CEFR level, Register
- These 3 dimensions are sufficient for basic filtering and games

### Phase 2: Rich tagging
- Add: Situation, Emotion, Expression Type
- Enable situation-based browsing and emotion-aware games

### Phase 3: Relationship mapping
- Map function sequences (which functions tend to follow which?)
- Enable "conversation flow" games and dialogue reconstruction

---

## SOURCES & REFERENCES

- [Council of Europe - CEFR Level Descriptions](https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions)
- [KCL - CEFR Can-Do Statements](https://www.kcl.ac.uk/language-centre/assets/can-do-statements-cefr.pdf)
- [Wikipedia - Common European Framework](https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages)
- [Cambridge - Language Functions Revisited (excerpt)](https://assets.cambridge.org/97805211/84991/excerpt/9780521184991_excerpt.pdf)
- [Wikipedia - Notional-functional syllabus](https://en.wikipedia.org/wiki/Notional-functional_syllabus)
- [TESOL International Journal - Language Functions in ESL Textbooks](https://files.eric.ed.gov/fulltext/EJ1251177.pdf)
- [Van Ek & Trim - Threshold 1990 (PDF)](https://s9577412bcd03c8a2.jimcontent.com/download/version/1532622236/module/13603507427/name/072_Threshold%20Level_1990_EK_TRIM.pdf)
- [Wikipedia - Speech Act](https://en.wikipedia.org/wiki/Speech_act)
- [Fiveable - Searle's Classification of Speech Acts](https://fiveable.me/key-terms/introduction-semantics-pragmatics/searles-classification-of-speech-acts)
- [ALTA Language Services - Five Levels of Formality](https://altalang.com/beyond-words/how-did-that-register-five-levels-of-formality-in-language/)
- [StudySmarter - Formality Levels](https://www.studysmarter.co.uk/explanations/english/lexis-and-semantics/levels-of-formality/)
- [Wikipedia - Register (sociolinguistics)](https://en.wikipedia.org/wiki/Register_(sociolinguistics))
- [Wikipedia - Politeness theory](https://en.wikipedia.org/wiki/Politeness_theory)
- [Vaia - Politeness Theory](https://www.vaia.com/en-us/explanations/english/pragmatics/politeness-theory/)
- [Cambridge Grammar - Discourse Markers](https://dictionary.cambridge.org/grammar/british-grammar/discourse-markers-so-right-okay)
- [Wikipedia - Discourse Marker](https://en.wikipedia.org/wiki/Discourse_marker)
- [Six Seconds - Plutchik's Wheel of Emotions](https://www.6seconds.org/2025/02/06/plutchik-wheel-emotions/)
- [PMC - Sentiment Analysis Review](https://pmc.ncbi.nlm.nih.gov/articles/PMC8402961/)
- [EnglishClub - Functional Language](https://www.englishclub.com/vocabulary/functional-language.php)
- [ELT Concourse - Functions Essentials](https://www.eltconcourse.com/training/initial/functions/functions_essentials.html)
- [Cambridge TKT Module 1 - Describing Language Functions](https://www.cambridgeenglish.org/images/168872-tkt-module-1-describing-language-functions.pdf)
- [Cambridge - Teaching Functional/Situational Language](https://www.cambridge.org/elt/blog/2021/11/24/teaching-functional-situational-language/)
- [teach-this.com - Functional Language ESL Activities](https://www.teach-this.com/functional-language)
