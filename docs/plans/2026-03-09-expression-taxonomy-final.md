# Shortee Expression Taxonomy — FINAL
## Master Classification System for 26,000+ Sentences across 2,039 Videos

Date: 2026-03-09
Status: **FINAL** — Synthesized from linguistic theory, transcript analysis, and product requirements
Purpose: Define the complete, AI-taggable taxonomy for classifying English expressions. This document drives the tagging pipeline, game system, collection engine, and browse/filter UX.

---

## Design Principles

1. **AI-taggable in one pass** — Claude Haiku must assign all dimensions per sentence in a single API call
2. **Multi-label where natural** — functions, emotions, expression_types, power tags, flags are arrays
3. **Single-label where forced choice is better** — situation (primary scene), CEFR, register, vibe (dominant mood)
4. **Korean learner-facing** — Every tag has a Korean label for the app UI
5. **Drama/movie/entertainment optimized** — Weighted toward spoken, emotional, interpersonal language
6. **Game-system compatible** — Tags enable filtering for games, collections, and review activities
7. **Human-readable IDs** — All IDs use snake_case (no opaque numbers)
8. **~200 distinct tag values** across all 9 dimensions

---

## TAXONOMY OVERVIEW

Each sentence is tagged across **9 independent dimensions**:

| # | Dimension | What it captures | # of values | Multi/Single |
|---|-----------|-----------------|-------------|--------------|
| 1 | Communicative Function | What the speaker is DOING | 65 functions / 8 categories | Multi (1-3) |
| 2 | Situation / Scene | WHERE/WHEN this would occur | 50 situations / 10 domains | Single |
| 3 | CEFR Level | How hard is this? | 6 levels (A1-C2) | Single |
| 4 | Register | How formal/casual? | 5 levels | Single |
| 5 | Emotion / Tone | How does the speaker FEEL? | 16 labels | Multi (1-2) |
| 6 | Expression Type | What kind of language pattern? | 8 types | Multi (1-3) |
| 7 | Vibe Tag | Content mood/atmosphere | 18 vibes | Single |
| 8 | Power Tag | Learner engagement hook | 12 tags | Multi (0-2) |
| 9 | Grammar Intent | Korean-framed grammar pattern | 25 intents | Multi (0-2) |
| + | Special Content Flags | Edge case markers | 5 flags | Multi (0-3) |

**Total distinct tag values: ~210**

---

## DIMENSION 1: Communicative Function

Based on Searle's speech act taxonomy, Van Ek & Trim's Threshold Level, and standard ESL functional syllabi. Adapted for drama/movie/entertainment content.

### Category 1: INFORMATION (Assertives)
Sharing or seeking facts. Searle's "assertives" — committing to truth of a proposition.

| ID | Function | Korean | Example |
|----|----------|--------|---------|
| F01 | stating_fact | 사실 말하기 | "The flight leaves at 9." |
| F02 | describing | 묘사하기 | "She has long dark hair." |
| F03 | narrating | 이야기하기 | "So I walked in and everyone was staring at me." |
| F04 | explaining | 설명하기 | "The reason I'm late is the traffic." |
| F05 | reporting | 전달하기 | "He said he'd be here by noon." |
| F06 | asking_information | 정보 묻기 | "What time does the store close?" |
| F07 | confirming | 확인하기 | "So you're saying it's tomorrow?" |
| F08 | correcting | 정정하기 | "Actually, that's not what happened." |

### Category 2: OPINIONS & EVALUATION (Assertives/Expressives)
Expressing subjective views, judgments, beliefs.

| ID | Function | Korean | Example |
|----|----------|--------|---------|
| F09 | expressing_opinion | 의견 말하기 | "I think that's a terrible idea." |
| F10 | agreeing | 동의하기 | "You're absolutely right." |
| F11 | disagreeing | 반대하기 | "I don't think so." |
| F12 | evaluating_judging | 평가하기 | "That was the best meal I've ever had." |
| F13 | comparing | 비교하기 | "This one's way better than the last." |
| F14 | speculating | 추측하기 | "Maybe he just doesn't want to come." |

### Category 3: EMOTIONS & ATTITUDES (Expressives)
Searle's "expressives" — speaker's psychological state.

| ID | Function | Korean | Example |
|----|----------|--------|---------|
| F15 | expressing_happiness | 기쁨 표현 | "I'm so happy for you!" |
| F16 | expressing_sadness | 슬픔 표현 | "I can't believe she's gone." |
| F17 | expressing_anger | 화남 표현 | "I'm sick of this!" |
| F18 | expressing_surprise | 놀람 표현 | "No way! Are you serious?" |
| F19 | expressing_fear_worry | 걱정/두려움 | "I'm scared something's going to happen." |
| F20 | expressing_disappointment | 실망 표현 | "I expected better from you." |
| F21 | expressing_frustration | 답답함 표현 | "This is driving me crazy." |
| F22 | expressing_love_affection | 애정 표현 | "You mean everything to me." |
| F23 | expressing_disgust | 혐오 표현 | "That's disgusting." |
| F24 | expressing_hope | 희망 표현 | "I really hope this works out." |

### Category 4: SOCIAL ACTIONS (Expressives + Commissives)
Interpersonal rituals and relationship management.

| ID | Function | Korean | Example |
|----|----------|--------|---------|
| F25 | greeting | 인사하기 | "Hey, what's up?" |
| F26 | introducing | 소개하기 | "I'd like you to meet my friend." |
| F27 | thanking | 감사하기 | "Thanks so much, I really appreciate it." |
| F28 | apologizing | 사과하기 | "I'm sorry, I didn't mean to hurt you." |
| F29 | congratulating | 축하하기 | "Congrats on the promotion!" |
| F30 | complimenting | 칭찬하기 | "You look amazing tonight." |
| F31 | consoling_comforting | 위로하기 | "It's going to be okay." |
| F32 | saying_goodbye | 작별 인사 | "Take care. See you around." |
| F33 | small_talk | 스몰토크 | "So, how's work going?" |

### Category 5: GETTING THINGS DONE (Directives + Commissives)
Searle's "directives" (getting hearer to act) and "commissives" (committing to action).

| ID | Function | Korean | Example |
|----|----------|--------|---------|
| F34 | requesting | 부탁하기 | "Could you pass me the salt?" |
| F35 | ordering_commanding | 명령하기 | "Get out of here. Now." |
| F36 | suggesting | 제안하기 | "Why don't we grab some coffee?" |
| F37 | advising | 조언하기 | "If I were you, I'd talk to her." |
| F38 | inviting | 초대하기 | "Want to come to the party tonight?" |
| F39 | offering | 제공하기 | "Can I get you anything?" |
| F40 | warning | 경고하기 | "Be careful, the road's slippery." |
| F41 | promising | 약속하기 | "I promise I'll be there." |
| F42 | threatening | 위협하기 | "If you do that again, we're done." |
| F43 | refusing | 거절하기 | "I can't do that. Sorry." |
| F44 | accepting | 수락하기 | "Sure, I'd love to." |
| F45 | persuading | 설득하기 | "Come on, it'll be fun." |
| F46 | permission_asking | 허락 구하기 | "Do you mind if I sit here?" |
| F47 | permission_granting | 허락하기 | "Go ahead, no problem." |

### Category 6: CONVERSATIONAL MANAGEMENT (Discourse)
Structuring, maintaining, and repairing conversation.

| ID | Function | Korean | Example |
|----|----------|--------|---------|
| F48 | changing_topic | 주제 바꾸기 | "Anyway, what I wanted to say was..." |
| F49 | interrupting | 끼어들기 | "Sorry to interrupt, but..." |
| F50 | clarifying | 명확히 하기 | "What I mean is..." |
| F51 | checking_understanding | 이해 확인 | "Does that make sense?" |
| F52 | buying_time | 시간 벌기 | "Let me think about that." |
| F53 | backchanneling | 맞장구 | "Uh-huh." / "Right." / "I see." |
| F54 | summarizing | 요약하기 | "So basically, what you're saying is..." |

### Category 7: CONFLICT & CONFRONTATION (Drama-heavy)
Especially common in drama/movie content.

| ID | Function | Korean | Example |
|----|----------|--------|---------|
| F55 | accusing | 비난하기 | "You lied to me!" |
| F56 | denying | 부인하기 | "I didn't do anything wrong." |
| F57 | defending | 변명하기 | "I had no choice!" |
| F58 | insulting | 모욕하기 | "You're pathetic." |
| F59 | sarcasm_irony | 비꼬기 | "Oh great, another meeting." |
| F60 | confronting | 따지기 | "We need to talk about what happened." |
| F61 | forgiving | 용서하기 | "I forgive you." |

### Category 8: DECLARATIONS & PERFORMATIVES
Searle's "declarations" — utterances that change reality.

| ID | Function | Korean | Example |
|----|----------|--------|---------|
| F62 | announcing | 발표하기 | "I have something to tell everyone." |
| F63 | deciding | 결심하기 | "That's it. I'm leaving." |
| F64 | confessing | 고백하기 | "There's something I need to tell you." |
| F65 | vowing | 맹세하기 | "I swear I'll make this right." |

---

## DIMENSION 2: Situation / Scene Context (EXPANDED)

Where would this sentence naturally occur? Expanded from 25 to 50 situations across 10 domains. Includes edge cases from transcript analysis: period drama, animation fantasy, music/lyrics, courtroom, medical, etc.

### Domain A: Daily Life (일상생활)
| ID | Situation | Korean | Content Examples |
|----|-----------|--------|-----------------|
| S01 | home_family | 집/가족 | Family dinner, chores, siblings arguing |
| S02 | cooking_meals | 요리/식사 | Cooking shows, recipes, mealtime conversation |
| S03 | morning_routine | 아침 일상 | Getting ready, breakfast, alarm clock |
| S04 | shopping | 쇼핑 | Mall, online shopping, trying on clothes |
| S05 | restaurant_cafe | 식당/카페 | Ordering food, splitting the bill, complaining about food |
| S06 | driving_commuting | 운전/통근 | Road rage, carpool, traffic, GPS directions |
| S07 | neighborhood_errands | 동네/심부름 | Post office, dry cleaners, neighbor chat |

### Domain B: Relationships (연애 & 관계)
| ID | Situation | Korean | Content Examples |
|----|-----------|--------|-----------------|
| S08 | romantic_dating | 연애/데이트 | First date, flirting, asking someone out |
| S09 | friendship | 우정 | Hanging out, loyalty, best friends, betrayal |
| S10 | family_conflict | 가족 갈등 | Parent-child fights, sibling rivalry, in-laws |
| S11 | breakup_divorce | 이별/이혼 | Breaking up, custody, moving out |
| S12 | wedding_proposal | 결혼/프로포즈 | Wedding speeches, proposals, vows |
| S13 | reunion_reconciliation | 재회/화해 | Making up, reuniting after years, forgiveness |

### Domain C: Work & Career (직장 & 커리어)
| ID | Situation | Korean | Content Examples |
|----|-----------|--------|-----------------|
| S14 | workplace_office | 직장/사무실 | Office politics, water cooler chat, deadlines |
| S15 | job_interview | 면접 | Interview questions, salary negotiation |
| S16 | meeting_presentation | 회의/발표 | Pitching ideas, boardroom, feedback |
| S17 | boss_employee | 상사/부하 | Getting fired, promotion, reprimand |
| S18 | startup_business | 창업/비즈니스 | Investor pitch, partnership, business deals |

### Domain D: School & Education (학교 & 교육)
| ID | Situation | Korean | Content Examples |
|----|-----------|--------|-----------------|
| S19 | school_classroom | 학교/수업 | Teacher-student, homework, group projects |
| S20 | college_campus | 대학/캠퍼스 | Dorm life, frat parties, finals week |
| S21 | tutoring_study | 과외/공부 | Study groups, language exchange |

### Domain E: Travel & Services (여행 & 서비스)
| ID | Situation | Korean | Content Examples |
|----|-----------|--------|-----------------|
| S22 | airport_travel | 공항/여행 | Check-in, immigration, lost luggage |
| S23 | hotel_accommodation | 호텔/숙소 | Room service, complaints, checking in |
| S24 | phone_call | 전화 통화 | Customer service, scheduling, voicemail |
| S25 | bank_finance | 은행/금융 | Account opening, loans, ATM problems |
| S26 | public_transport | 대중교통 | Bus, subway, taxi, directions |

### Domain F: Health & Wellness (건강 & 의료)
| ID | Situation | Korean | Content Examples |
|----|-----------|--------|-----------------|
| S27 | hospital_doctor | 병원/진료 | Diagnosis, prescriptions, waiting room |
| S28 | emergency_medical | 응급 상황 | ER scenes, CPR, ambulance, 911 calls |
| S29 | therapy_counseling | 상담/치료 | Therapy sessions, support groups, mental health |
| S30 | fitness_gym | 운동/헬스 | Workout routines, personal trainers, yoga |

### Domain G: Social & Entertainment (모임 & 여가)
| ID | Situation | Korean | Content Examples |
|----|-----------|--------|-----------------|
| S31 | party_celebration | 파티/축하 | Birthday parties, holiday gatherings, toasts |
| S32 | bar_nightlife | 술집/나이트 | Ordering drinks, bar fights, hitting on someone |
| S33 | sports_game | 스포츠/경기 | Watching games, coaching, team sports |
| S34 | concert_show | 공연/콘서트 | Music shows, theater, backstage |
| S35 | online_social_media | SNS/온라인 | DMs, going viral, online drama, streaming |

### Domain H: High Stakes / Drama (긴박한 상황)
| ID | Situation | Korean | Content Examples |
|----|-----------|--------|-----------------|
| S36 | legal_courtroom | 법정/재판 | Cross-examination, verdict, plea, lawyer talk |
| S37 | police_investigation | 경찰/수사 | Interrogation, arrest, Miranda rights, detective |
| S38 | emergency_crisis | 위기/재난 | Fire, earthquake, hostage, escape |
| S39 | confrontation_argument | 대결/언쟁 | Shouting matches, ultimatums, face-offs |
| S40 | confession_secret | 고백/비밀 | Revealing truths, hidden identities, plot twists |
| S41 | funeral_grief | 장례/슬픔 | Eulogies, mourning, saying goodbye to the dead |
| S42 | military_war | 군대/전쟁 | Battle commands, war scenes, military briefings |

### Domain I: Special Content (특수 콘텐츠)
| ID | Situation | Korean | Content Examples |
|----|-----------|--------|-----------------|
| S43 | fantasy_scifi | 판타지/SF | Magic spells, space travel, superpowers |
| S44 | period_historical | 시대극/역사 | Medieval courts, royal decrees, old English |
| S45 | animation_cartoon | 애니/만화 | Disney, Pixar, exaggerated expressions |
| S46 | music_lyrics | 음악/가사 | Song lyrics, singing, music video narration |
| S47 | news_documentary | 뉴스/다큐 | Reporting, interviews, voiceover narration |
| S48 | self_help_motivation | 자기계발 | Motivational speeches, life advice, Ted-talk style |

### Domain J: Catch-all (기타)
| ID | Situation | Korean | Content Examples |
|----|-----------|--------|-----------------|
| S49 | how_to_tutorial | 강좌/튜토리얼 | Educational content, step-by-step instructions |
| S50 | general | 일반 | Does not fit a specific scene context |

---

## DIMENSION 3: CEFR Level

Difficulty estimation based on vocabulary, grammar complexity, and cultural knowledge required.

| Level | Korean | Description | Typical Markers |
|-------|--------|-------------|-----------------|
| A1 | 입문 | Beginner | Simple present, basic vocabulary, short sentences |
| A2 | 초급 | Elementary | Past tense, common expressions, everyday topics |
| B1 | 중급 | Intermediate | Modal verbs, opinions, connected speech |
| B2 | 중상급 | Upper-Intermediate | Complex clauses, idioms, nuanced expression |
| C1 | 고급 | Advanced | Sophisticated vocab, irony, cultural references |
| C2 | 최고급 | Mastery | Rare idioms, literary language, highly nuanced |

**Expected distribution for drama/movie content:**
- A1-A2: ~15% (simple greetings, basic dialogue)
- B1-B2: ~55% (bulk of conversational drama)
- C1-C2: ~30% (slang, idioms, cultural references, sarcasm)

**Tagging guidelines for edge cases:**
- Profanity/slang does NOT automatically mean C-level. "Shut up" is A2. "Don't you dare patronize me" is C1.
- Period/archaic language (e.g., "Thou shalt not...") is tagged C2 regardless of grammar simplicity, due to cultural gap.
- Song lyrics with simple words but metaphorical meaning: tag the literal grammar level, flag as `is_lyrics`.

---

## DIMENSION 4: Register (Formality)

Based on Martin Joos's 5-level model.

| Level | ID | Label | Korean | Description | Example |
|-------|----|-------|--------|-------------|---------|
| 1 | R1 | frozen | 의식체 | Ritualized, unchanging | "I do solemnly swear..." |
| 2 | R2 | formal | 격식체 | Professional, precise | "I would like to express my gratitude." |
| 3 | R3 | consultative | 일반 존댓말 | Respectful, standard | "Could you help me with this?" |
| 4 | R4 | casual | 반말/편한 말 | Relaxed, among peers | "Wanna grab lunch?" |
| 5 | R5 | intimate | 다정한 말 | Private, close relationships | "Love you, babe." |

**Expected distribution:**
- R1 (frozen): ~2%
- R2 (formal): ~10%
- R3 (consultative): ~25%
- R4 (casual): ~50%
- R5 (intimate): ~13%

---

## DIMENSION 5: Emotion / Tone (EXPANDED)

Extended from Plutchik's wheel to cover drama-critical tones. Expanded from 10 to 16 labels.

| ID | Emotion/Tone | Korean | Description |
|----|-------------|--------|-------------|
| E01 | joy | 기쁨 | Happiness, excitement, delight |
| E02 | sadness | 슬픔 | Grief, melancholy, wistfulness |
| E03 | anger | 분노 | Rage, irritation, outrage |
| E04 | fear | 두려움 | Terror, anxiety, nervousness |
| E05 | surprise | 놀람 | Shock, disbelief, astonishment |
| E06 | anticipation | 기대 | Eagerness, looking forward, suspense |
| E07 | trust | 신뢰 | Confidence, faith, reliability |
| E08 | disgust | 혐오 | Revulsion, contempt, disdain |
| E09 | neutral | 중립 | Purely informational, no strong emotion |
| E10 | sarcastic | 비꼬는 | Ironic, mocking, saying the opposite |
| E11 | romantic | 로맨틱 | Tender, loving, intimate warmth |
| E12 | threatening | 위협적 | Menacing, intimidating, dark |
| E13 | pleading | 간절한 | Begging, desperate appeal |
| E14 | playful | 장난스러운 | Teasing, joking, lighthearted |
| E15 | desperate | 절박한 | Last resort, cornered, no options left |
| E16 | bitter | 씁쓸한 | Resentful, cynical, wounded pride |

**Tagging rules:**
- `neutral` (E09) is the most common — purely informational sentences
- A sentence gets at most 2 emotion tags (primary + optional secondary)
- `sarcastic` (E10) can combine with any other emotion (sarcasm is a meta-tone)
- `romantic` (E11) vs `joy` (E01): romantic implies intimacy; joy is general happiness
- `desperate` (E15) vs `pleading` (E13): desperate is internal state; pleading is directed at someone
- `bitter` (E16) vs `anger` (E03): bitter is cold/quiet resentment; anger is hot/loud

---

## DIMENSION 6: Expression Type

What kind of linguistic pattern does this sentence contain? Drives game/exercise generation.

| ID | Type | Korean | Description | Example |
|----|------|--------|-------------|---------|
| X01 | phrasal_verb | 구동사 | Verb + particle, idiomatic meaning | "I ran into her at the store." |
| X02 | idiom | 관용구 | Fixed expression, non-literal meaning | "It's raining cats and dogs." |
| X03 | collocation | 연어 | Words that naturally co-occur | "make a decision" / "heavy rain" |
| X04 | fixed_expression | 고정 표현 | Formulaic, unalterable phrase | "by the way" / "as a matter of fact" |
| X05 | slang | 슬랭 | Informal, trendy, group-specific | "That's lit." / "No cap." |
| X06 | filler_discourse_marker | 필러/담화표지 | Conversation management words | "well..." / "you know" / "I mean" |
| X07 | hedging | 완곡 표현 | Softening/uncertainty markers | "sort of" / "kind of" / "maybe" |
| X08 | plain | 일반 문장 | Standard grammar, no special pattern | "I went to the store yesterday." |

**Tagging rules:**
- `plain` (X08) is the default when no special pattern is present
- A sentence can have multiple expression types (e.g., phrasal_verb + hedging)
- `slang` (X05) includes AAVE, internet slang, Gen Z expressions, regional slang
- `filler_discourse_marker` (X06) is critical for natural speech — very common in drama

---

## DIMENSION 7: Vibe Tag (NEW)

Product-facing mood/atmosphere labels. These are NOT academic — they make collections browsable, shareable, and fun. A sentence gets exactly ONE dominant vibe.

| ID | Vibe | Korean | What it feels like |
|----|------|--------|-------------------|
| V01 | sassy | 쿨하고 도도한 | Confident, witty, unbothered |
| V02 | wholesome | 따뜻한 | Heartwarming, kind, pure |
| V03 | savage | 작살내는 | Brutal honesty, devastating comeback |
| V04 | cringe | 오글거리는 | Awkward, embarrassing, secondhand shame |
| V05 | motivational | 동기부여 | Inspiring, uplifting, you-can-do-it |
| V06 | dark_humor | 블랙코미디 | Funny but twisted, gallows humor |
| V07 | romantic_sweet | 달달한 | Butterflies, love confessions, cute moments |
| V08 | badass | 간지나는 | Cool one-liners, power moves, boss energy |
| V09 | emotional_heavy | 먹먹한 | Tearjerker, gut-punch, raw emotion |
| V10 | funny | 웃긴 | Comedy, witty banter, joke delivery |
| V11 | awkward | 어색한 | Socially uncomfortable, foot-in-mouth |
| V12 | intense | 긴장감 | High stakes, edge-of-seat, thriller energy |
| V13 | chill | 여유로운 | Relaxed, casual, no pressure |
| V14 | nostalgic | 추억의 | Throwback, bittersweet memories |
| V15 | petty | 찐하게 쪼잔한 | Passive-aggressive, holding grudges, petty revenge |
| V16 | wise | 현명한 | Life lessons, philosophical, mentor energy |
| V17 | chaotic | 혼돈의 | Unhinged, unpredictable, wild energy |
| V18 | neutral_plain | 일반 | No strong mood — informational/educational |

**Tagging guidelines:**
- Every sentence gets exactly ONE vibe (forced choice, dominant mood)
- `neutral_plain` (V18) for educational/tutorial content with no emotional color
- Vibe is about the FEELING the content gives the viewer, not the literal meaning
- "I'm going to kill you" in a joking context = `funny` not `intense`
- Vibe drives collection browsing — it's the "Netflix mood" filter

---

## DIMENSION 8: Power Tag (NEW)

Learner-facing engagement hooks. These highlight WHY a learner should care about this expression. A sentence gets 0-2 power tags (many sentences have none).

| ID | Power Tag | Korean | What it signals |
|----|-----------|--------|----------------|
| P01 | native_only | 원어민만 아는 | Expressions textbooks never teach |
| P02 | interview_killer | 면접 필살기 | Professional expressions that impress |
| P03 | daily_essential | 매일 쓰는 | High-frequency, must-know expressions |
| P04 | movie_famous | 영화 명대사 | Iconic/recognizable movie lines |
| P05 | slang_alert | 슬랭 주의 | Might offend if used wrong — know the context |
| P06 | culture_key | 문화 이해 필수 | Understanding requires cultural knowledge |
| P07 | comeback_ready | 쿨한 한마디 | Perfect retorts and witty responses |
| P08 | debate_weapon | 토론 무기 | Useful for arguments and persuasion |
| P09 | flirt_line | 썸 타는 표현 | Dating/flirting language |
| P10 | emotional_punch | 감동 한방 | Heart-hitting, meaningful expressions |
| P11 | business_pro | 비즈니스 프로 | Corporate/professional must-knows |
| P12 | test_likely | 시험에 나오는 | Common in TOEIC/TOEFL/IELTS |

**Tagging rules:**
- Most sentences (60%+) will have NO power tags — these are for standout expressions only
- Maximum 2 power tags per sentence
- `native_only` (P01) is for genuinely non-obvious expressions, not just casual speech
- `movie_famous` (P04) applies only to truly iconic, widely-recognized lines
- `test_likely` (P12) for formal/academic patterns commonly tested

---

## DIMENSION 9: Grammar Intent (NEW)

Korean-framed grammar patterns. Maps Korean learner intentions to English structures. A sentence gets 0-2 grammar intents.

| ID | Grammar Intent (Korean) | English Pattern | Example |
|----|------------------------|-----------------|---------|
| G01 | 거절할_때 | Refusal patterns | "I'm afraid I can't." / "I'll pass." |
| G02 | 부탁할_때 | Request patterns | "Would you mind ~ing?" / "Could you ~?" |
| G03 | 칭찬할_때 | Compliment patterns | "You did an amazing job." |
| G04 | 사과할_때 | Apology patterns | "I owe you an apology." |
| G05 | 위로할_때 | Consolation patterns | "I'm here for you." / "It'll get better." |
| G06 | 화낼_때 | Expressing anger | "I've had it." / "How dare you!" |
| G07 | 놀랐을_때 | Surprise reactions | "You've got to be kidding me!" |
| G08 | 약속할_때 | Making promises | "I give you my word." |
| G09 | 제안할_때 | Making suggestions | "How about ~?" / "Why don't we ~?" |
| G10 | 비교할_때 | Comparing things | "~ is way better than ~" |
| G11 | 후회할_때 | Expressing regret | "I should have ~" / "If only I had ~" |
| G12 | 가정할_때 | Hypothetical/conditional | "If I were you ~" / "What if ~?" |
| G13 | 허락_구할_때 | Asking permission | "Do you mind if I ~?" / "Is it okay if ~?" |
| G14 | 인_척_할_때 | Pretending/acting as if | "He acted like nothing happened." |
| G15 | 원하는_걸_말할_때 | Expressing wants | "I'd love to ~" / "I'm dying to ~" |
| G16 | 확신할_때 | Expressing certainty | "I'm positive that ~" / "There's no doubt ~" |
| G17 | 불확실할_때 | Expressing uncertainty | "I'm not sure, but ~" / "It might be ~" |
| G18 | 설명할_때 | Explaining reasons | "The thing is ~" / "That's because ~" |
| G19 | 불평할_때 | Complaining | "I'm sick of ~" / "I can't stand ~" |
| G20 | 동의할_때 | Agreeing with someone | "Exactly." / "That's what I'm saying." |
| G21 | 반대할_때 | Disagreeing politely | "I see your point, but ~" |
| G22 | 고백할_때 | Confessing/revealing | "I need to tell you something." |
| G23 | 응원할_때 | Cheering/encouraging | "You've got this!" / "I believe in you." |
| G24 | 경고할_때 | Warning someone | "You better not ~" / "Watch out for ~" |
| G25 | 작별할_때 | Saying goodbye | "It was great seeing you." / "Take care." |

**Tagging rules:**
- Most sentences (50%+) will have NO grammar intent — only tag when the pattern is clear and learnable
- Maximum 2 grammar intents per sentence
- Grammar intent is about the KOREAN LEARNER'S NEED, not linguistic analysis
- Focus: "When a Korean speaker wants to [Korean intent], this is how natives say it"

---

## SPECIAL CONTENT FLAGS

Boolean flags for edge cases that need special handling in the pipeline and UI.

| Flag | Korean | When to apply |
|------|--------|--------------|
| is_lyrics | 가사 | Music content — poetic, may not be conversational |
| is_narration | 나레이션 | Voiceover, narrator, not dialogue between characters |
| is_period | 시대극 표현 | Historical/fantasy language (medieval, Shakespearean, archaic) |
| contains_profanity | 비속어 포함 | Contains swear words, slurs, or explicit language |
| is_fragment | 불완전 문장 | Incomplete sentence, exclamation, or interjection only |

**Tagging rules:**
- Flags are independent of other dimensions — any combination is valid
- `is_lyrics` + `is_fragment` is common (song lyrics are often fragments)
- `contains_profanity` should be tagged generously — better to over-flag than under-flag
- `is_period` includes: "Thou art", "Pray tell", "I beseech thee", fairy tale language, etc.
- `is_narration` includes: documentary voiceover, audiobook-style narration, internal monologue

---

## TAGGING FORMAT (for AI batch processing)

Each sentence is tagged as a JSON object:

```json
{
  "id": "dR4x5kQ-42",
  "en": "Come on, it'll be fun, I promise!",
  "ko": "어서, 재밌을 거야, 약속해!",
  "tags": {
    "functions": ["F45", "F41"],
    "situation": "S31",
    "cefr": "A2",
    "register": "R4",
    "emotions": ["E01", "E06"],
    "expression_types": ["X08"],
    "vibe": "V14",
    "power": [],
    "grammar_intent": ["G09"],
    "flags": []
  }
}
```

**Field specifications:**
- `id`: `{videoId}-{segmentIndex}` (e.g., `dR4x5kQ-42`)
- `functions`: Array of 1-3 function IDs
- `situation`: Single situation ID (primary scene)
- `cefr`: Single CEFR level string ("A1" through "C2")
- `register`: Single register ID
- `emotions`: Array of 1-2 emotion IDs
- `expression_types`: Array of 1-3 expression type IDs
- `vibe`: Single vibe ID
- `power`: Array of 0-2 power tag IDs
- `grammar_intent`: Array of 0-2 grammar intent IDs
- `flags`: Array of 0-3 flag strings

---

## AI TAGGING PROMPT STRATEGY

### Batch Configuration
- **Model**: Claude Haiku (cost-effective for classification)
- **Batch size**: 20-30 sentences per API call
- **Context window**: Full taxonomy definitions + 5 gold-standard examples in system prompt
- **Output**: Structured JSON array
- **Validation pass**: Sample 200 sentences, human-check accuracy, refine prompt before full run

### Estimated Cost (Claude Haiku)
- ~26,000 sentences / 25 per batch = ~1,040 calls
- ~3,000 tokens input (taxonomy + examples + batch) + ~1,500 tokens output per call
- Total: ~$2-4 for full corpus tagging (at Haiku pricing ~$0.25/M input, $1.25/M output)

### Prompt Template (abbreviated)
```
System: You are a sentence classifier for an English learning app.
Classify each sentence across 9 dimensions using the provided taxonomy.
[Full taxonomy definitions here]
[5 gold-standard examples here]

User: Classify these sentences:
1. "Come on, it'll be fun, I promise!"
2. "I'm sorry, I didn't mean to hurt you."
...

Output JSON array with tags for each sentence.
```

### Quality Control
1. **Gold set**: Manually tag 100 sentences as ground truth
2. **Accuracy target**: >85% exact match on function, >90% on CEFR, >95% on register
3. **Disagreement protocol**: When AI is uncertain, default to the more common/general tag
4. **Edge case rules**: Built into the system prompt (see tagging rules under each dimension)

---

## LEARNER-FACING CATEGORY NAMES (Korean)

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

### Situation Domains (Browse labels)
| Internal | Korean Label |
|----------|-------------|
| Daily Life | 일상생활 |
| Relationships | 연애 & 관계 |
| Work & Career | 직장 & 커리어 |
| School & Education | 학교 & 교육 |
| Travel & Services | 여행 & 서비스 |
| Health & Wellness | 건강 & 의료 |
| Social & Entertainment | 모임 & 여가 |
| High Stakes | 긴박한 상황 |
| Special Content | 특수 콘텐츠 |
| General | 기타 |

### CEFR (Difficulty labels for app UI)
| Level | Korean Label |
|-------|-------------|
| A1-A2 | 초급 |
| B1-B2 | 중급 |
| C1-C2 | 고급 |

---

## GAME SYSTEM INTEGRATION

How each dimension enables specific game types:

| Game Type | Primary Dimensions Used | Description |
|-----------|------------------------|-------------|
| Fill-in-the-blank | Expression Type (X01-X05) | Remove phrasal verb particle, idiom keyword, collocation partner |
| Situation matching | Situation + Function | "Which sentence fits this scene?" |
| Tone/register quiz | Register + Emotion | "Is this formal or casual?" / "What's the mood?" |
| Next-line prediction | Function sequences | "What would they say next?" |
| Formality conversion | Register | "Say this formally / casually" |
| Emotion detection | Emotion/Tone | "How does the speaker feel?" |
| Similar expression finder | Function + Register | Same function, different register level |
| Vibe sorting | Vibe Tag | "Sort these into sassy vs. wholesome" |
| Grammar pattern drill | Grammar Intent | "Practice 거절할 때 patterns" |
| Culture quiz | Power Tag (culture_key) | "Why would a native say this?" |
| Clean/explicit filter | Flags (contains_profanity) | Content filtering for different audiences |

---

## COLLECTION TEMPLATES

50 productizable collection ideas grouped by theme. Each defines: name, description, and filter logic (tag combinations).

### Situation Collections (상황별 영어)

| # | Collection Name | Description | Filter Logic |
|---|----------------|-------------|-------------|
| 1 | 카페 영어 | 카페에서 주문하고 대화할 때 | situation=S05, register=R3/R4 |
| 2 | 병원 영어 | 아플 때 쓰는 필수 표현 | situation=S27/S28 |
| 3 | 면접 영어 | 영어 면접 완벽 대비 | situation=S15, power=P02 |
| 4 | 공항 영어 | 출국부터 입국까지 | situation=S22 |
| 5 | 호텔 영어 | 체크인부터 컴플레인까지 | situation=S23 |
| 6 | 사무실 영어 | 직장에서 매일 쓰는 표현 | situation=S14, register=R2/R3 |
| 7 | 학교 영어 | 수업, 과제, 캠퍼스 라이프 | situation=S19/S20 |
| 8 | 식당 영어 | 주문하고, 불만 말하고, 계산하기 | situation=S05 |
| 9 | 쇼핑 영어 | 할인, 교환, 환불 완전 정복 | situation=S04 |
| 10 | 전화 영어 | 전화 받고 걸고 끊기 | situation=S24 |

### Vibe Collections (분위기별 영어)

| # | Collection Name | Description | Filter Logic |
|---|----------------|-------------|-------------|
| 11 | 비꼬는 영어 | 네이티브가 돌려까는 법 | vibe=V01/V15, emotion=E10 |
| 12 | 따뜻한 영어 | 마음이 따뜻해지는 표현들 | vibe=V02 |
| 13 | 작살 한마디 | 입 다물게 만드는 한방 | vibe=V03, power=P07 |
| 14 | 오글 영어 | 들으면 오그라드는 표현 | vibe=V04 |
| 15 | 동기부여 영어 | 힘이 되는 한마디 | vibe=V05, power=P10 |
| 16 | 블랙코미디 영어 | 웃기지만 좀 어두운 | vibe=V06 |
| 17 | 달달한 영어 | 연인끼리 쓰는 달콤 표현 | vibe=V07, emotion=E11 |
| 18 | 간지 영어 | 쿨한 한마디, 보스 에너지 | vibe=V08 |
| 19 | 먹먹한 영어 | 눈물 나는 명대사 | vibe=V09, power=P10 |
| 20 | 웃긴 영어 | 코미디 대사 모음 | vibe=V10 |

### Function Collections (기능별 영어)

| # | Collection Name | Description | Filter Logic |
|---|----------------|-------------|-------------|
| 21 | 사과하는 법 | 진심 담아 사과하는 영어 | function=F28 |
| 22 | 거절하는 법 | 부드럽게/단호하게 거절 | function=F43, grammar=G01 |
| 23 | 칭찬하는 법 | 센스있게 칭찬하기 | function=F30, grammar=G03 |
| 24 | 위로하는 법 | 힘든 친구에게 하는 말 | function=F31, grammar=G05 |
| 25 | 설득하는 법 | 상대를 내 편으로 | function=F45, power=P08 |
| 26 | 제안하는 법 | 자연스럽게 제안하기 | function=F36, grammar=G09 |
| 27 | 화내는 법 | 참다 폭발할 때 | function=F17/F55, grammar=G06 |
| 28 | 맞장구치는 법 | 대화를 이어가는 기술 | function=F53, expressionType=X06 |
| 29 | 고백하는 법 | 마음을 전하는 표현 | function=F64/F22, grammar=G22 |
| 30 | 응원하는 법 | 힘내! 할 수 있어! | function=F31, grammar=G23 |

### Level Collections (레벨별 영어)

| # | Collection Name | Description | Filter Logic |
|---|----------------|-------------|-------------|
| 31 | 왕초보 일상 영어 | 가장 쉬운 매일 표현 | cefr=A1/A2, power=P03 |
| 32 | 중급자 관용구 | 중급에서 고급으로 가는 다리 | cefr=B1/B2, expressionType=X02/X01 |
| 33 | 고급 비즈니스 영어 | 프로페셔널 표현 모음 | cefr=C1, register=R2, power=P11 |
| 34 | 원어민처럼 말하기 | 교과서에 없는 진짜 영어 | power=P01, register=R4/R5 |
| 35 | 시험 대비 표현 | TOEIC/TOEFL에 나오는 패턴 | power=P12, register=R2/R3 |

### Grammar Collections (문법별 영어)

| # | Collection Name | Description | Filter Logic |
|---|----------------|-------------|-------------|
| 36 | would 정복 | would의 모든 쓰임 | grammar=G12, contains "would" |
| 37 | 가정법 모음 | If I were you, What if... | grammar=G12 |
| 38 | 구동사 마스터 | take off, run into, give up... | expressionType=X01 |
| 39 | 후회 표현 모음 | should have, could have, if only | grammar=G11 |
| 40 | 겸손하게 말하기 | 완곡 표현의 기술 | expressionType=X07, register=R3 |

### Mixed Theme Collections (테마별 영어)

| # | Collection Name | Description | Filter Logic |
|---|----------------|-------------|-------------|
| 41 | 넷플릭스 명대사 | 드라마에서 건진 명대사 | power=P04, vibe=V08/V09 |
| 42 | 디즈니 명대사 | 애니메이션 감동 대사 | situation=S45, power=P04 |
| 43 | 드라마 싸움 장면 | 말싸움에서 쓰는 영어 | situation=S39, function=F55/F58/F60 |
| 44 | 법정 영어 | 재판/법률 드라마 표현 | situation=S36 |
| 45 | 썸 타는 영어 | 밀당의 기술 | power=P09, emotion=E11 |
| 46 | 직장 상사에게 하는 말 | 사내 정치 서바이벌 | situation=S17, register=R2/R3 |
| 47 | 비속어 사전 | 드라마에서 듣는 욕 (주의!) | flag=contains_profanity |
| 48 | 노래로 배우는 영어 | 가사 속 표현 모음 | flag=is_lyrics |
| 49 | 슬랭 총정리 | 교과서에 없는 유행어 | expressionType=X05, power=P05 |
| 50 | 위기 상황 영어 | 긴급할 때 쓰는 필수 표현 | situation=S28/S38, emotion=E04/E15 |

---

## TAG COUNT SUMMARY

| Dimension | Count | Type |
|-----------|-------|------|
| Communicative Function (F01-F65) | 65 | Multi (1-3) |
| Situation (S01-S50) | 50 | Single |
| CEFR (A1-C2) | 6 | Single |
| Register (R1-R5) | 5 | Single |
| Emotion/Tone (E01-E16) | 16 | Multi (1-2) |
| Expression Type (X01-X08) | 8 | Multi (1-3) |
| Vibe (V01-V18) | 18 | Single |
| Power Tag (P01-P12) | 12 | Multi (0-2) |
| Grammar Intent (G01-G25) | 25 | Multi (0-2) |
| Special Flags | 5 | Multi (0-3) |
| **TOTAL** | **210** | |

---

## IMPLEMENTATION PHASES

### Phase 1: Core Tagging (MVP)
- Tag all 26,000 sentences with: **Function** (top 1-2), **CEFR**, **Register**, **Vibe**
- These 4 dimensions are sufficient for basic filtering, browsing, and games
- Estimated cost: ~$1-2
- Timeline: 1 day (pipeline setup) + 1 day (run + validate)

### Phase 2: Rich Tagging
- Add: **Situation**, **Emotion**, **Expression Type**, **Flags**
- Enable situation-based browsing, emotion-aware games, content filtering
- Estimated cost: ~$1-2 additional
- Timeline: 1 day

### Phase 3: Product Tagging
- Add: **Power Tags**, **Grammar Intent**
- Enable curated collections, grammar-intent-based drills, engagement hooks
- Estimated cost: ~$1 additional
- Timeline: 1 day

### Phase 4: Collection Engine
- Build 50 collections using tag filter logic
- Auto-populate collections from tagged corpus
- Enable user-facing collection browsing in app
- Timeline: 2-3 days (frontend + backend)

### Phase 5: Relationship Mapping
- Map function sequences (which functions tend to follow which?)
- Enable "conversation flow" games and dialogue reconstruction
- Build "similar expression" graph (same function, different register/vibe)
- Timeline: 3-5 days

---

## SOURCES & REFERENCES

### Linguistic Foundations
- Council of Europe — CEFR Level Descriptions
- Van Ek & Trim — Threshold 1990
- Searle's Classification of Speech Acts (via Fiveable)
- Martin Joos — Five Clocks (Register model)
- Plutchik's Wheel of Emotions (via Six Seconds)
- Brown & Levinson — Politeness Theory

### ESL/EFL Frameworks
- Cambridge — Language Functions Revisited
- Cambridge TKT Module 1 — Describing Language Functions
- EnglishClub — Functional Language reference
- ELT Concourse — Functions Essentials
- TESOL International Journal — Language Functions in ESL Textbooks

### NLP & Sentiment
- NRC Emotion Lexicon (Plutchik-based)
- PMC — Sentiment Analysis Review

### Product & Market
- Cake App — Situation-based learning model
- Duolingo — Gamification patterns
- Netflix — Mood/vibe browsing UX

---

## APPENDIX A: Example Tagged Sentences

### Example 1: Casual persuasion
```json
{
  "id": "dR4x5kQ-42",
  "en": "Come on, it'll be fun, I promise!",
  "ko": "어서, 재밌을 거야, 약속해!",
  "tags": {
    "functions": ["F45", "F41"],
    "situation": "S31",
    "cefr": "A2",
    "register": "R4",
    "emotions": ["E01", "E06"],
    "expression_types": ["X08"],
    "vibe": "V13",
    "power": ["P03"],
    "grammar_intent": ["G09"],
    "flags": []
  }
}
```

### Example 2: Dramatic confrontation
```json
{
  "id": "xK9mL2p-15",
  "en": "You lied to me! You've been lying this whole time!",
  "ko": "나한테 거짓말했잖아! 처음부터 계속 거짓말한 거잖아!",
  "tags": {
    "functions": ["F55", "F60"],
    "situation": "S39",
    "cefr": "B1",
    "register": "R4",
    "emotions": ["E03", "E08"],
    "expression_types": ["X08"],
    "vibe": "V12",
    "power": [],
    "grammar_intent": ["G06"],
    "flags": []
  }
}
```

### Example 3: Romantic confession
```json
{
  "id": "pQ7wN4r-88",
  "en": "I've been wanting to tell you this for a long time... I love you.",
  "ko": "오랫동안 말하고 싶었어... 사랑해.",
  "tags": {
    "functions": ["F64", "F22"],
    "situation": "S08",
    "cefr": "B1",
    "register": "R5",
    "emotions": ["E11", "E04"],
    "expression_types": ["X08"],
    "vibe": "V07",
    "power": ["P10"],
    "grammar_intent": ["G22"],
    "flags": []
  }
}
```

### Example 4: Sarcastic comeback
```json
{
  "id": "mT3vB8k-31",
  "en": "Oh wow, what a surprise. I'm totally shocked.",
  "ko": "와, 진짜 놀랍다. 완전 충격이야.",
  "tags": {
    "functions": ["F59"],
    "situation": "S14",
    "cefr": "B2",
    "register": "R4",
    "emotions": ["E10", "E08"],
    "expression_types": ["X08"],
    "vibe": "V01",
    "power": ["P01", "P07"],
    "grammar_intent": [],
    "flags": []
  }
}
```

### Example 5: Song lyrics
```json
{
  "id": "aB2cD5e-03",
  "en": "I will always love you",
  "ko": "난 항상 널 사랑할 거야",
  "tags": {
    "functions": ["F22"],
    "situation": "S46",
    "cefr": "A2",
    "register": "R5",
    "emotions": ["E11"],
    "expression_types": ["X08"],
    "vibe": "V07",
    "power": ["P04"],
    "grammar_intent": [],
    "flags": ["is_lyrics"]
  }
}
```

### Example 6: Period drama
```json
{
  "id": "fG8hJ1k-22",
  "en": "I beseech thee, my lord, show mercy upon this wretched soul.",
  "ko": "간청하옵니다, 전하, 이 불쌍한 영혼에 자비를 베푸소서.",
  "tags": {
    "functions": ["F34", "F13"],
    "situation": "S44",
    "cefr": "C2",
    "register": "R1",
    "emotions": ["E13"],
    "expression_types": ["X04"],
    "vibe": "V09",
    "power": ["P06"],
    "grammar_intent": ["G02"],
    "flags": ["is_period"]
  }
}
```

### Example 7: Profanity-heavy drama
```json
{
  "id": "nP4qR7s-55",
  "en": "Get the hell out of my face before I lose it.",
  "ko": "꺼져, 내 앞에서 당장, 나 진짜 폭발하기 전에.",
  "tags": {
    "functions": ["F35", "F42"],
    "situation": "S39",
    "cefr": "B2",
    "register": "R5",
    "emotions": ["E03"],
    "expression_types": ["X05"],
    "vibe": "V12",
    "power": ["P05"],
    "grammar_intent": ["G06"],
    "flags": ["contains_profanity"]
  }
}
```

### Example 8: Educational/tutorial narration
```json
{
  "id": "tU6vW9x-01",
  "en": "Today we're going to learn three easy ways to start a conversation.",
  "ko": "오늘은 대화를 시작하는 쉬운 3가지 방법을 배워볼 거예요.",
  "tags": {
    "functions": ["F62", "F04"],
    "situation": "S49",
    "cefr": "A2",
    "register": "R3",
    "emotions": ["E09"],
    "expression_types": ["X08"],
    "vibe": "V18",
    "power": ["P03"],
    "grammar_intent": [],
    "flags": ["is_narration"]
  }
}
```

---

## APPENDIX B: Edge Case Handling Guide

### AAVE (African American Vernacular English)
- Tag register as R4 (casual) or R5 (intimate), never R1-R3
- Tag expression_type as X05 (slang) when using AAVE-specific grammar (e.g., "She be working" = habitual aspect)
- CEFR: B2+ (cultural knowledge required for comprehension)
- Flag: none (AAVE is not an edge case — it's a valid dialect)

### Animation/Cartoon Exaggeration
- Situation: S45 (animation_cartoon)
- Exaggerated expressions ("To infinity and beyond!") may have lower practical CEFR but cultural value
- Power tag: P04 (movie_famous) when iconic

### Music Lyrics
- Flag: `is_lyrics` always
- Situation: S46 (music_lyrics)
- CEFR: Tag the literal grammar level, not the metaphorical depth
- Vibe: Match the song's mood, not the literal words
- Grammar Intent: Only tag if the lyric demonstrates a clear, teachable pattern

### Period/Historical Language
- Flag: `is_period`
- Situation: S44 (period_historical)
- CEFR: C2 by default (archaic vocabulary/grammar = high difficulty for modern learners)
- Register: R1 (frozen) for ritualistic speech, R2 (formal) for courtly speech

### Fragments and Interjections
- Flag: `is_fragment`
- Examples: "No!", "Oh my God.", "What the—", "Seriously?"
- Function: Tag the implied speech act (e.g., "Seriously?" = F07 confirming or F18 expressing_surprise)
- CEFR: Usually A1-A2 (simple words, but pragmatic meaning may be B1+)

### Narrator/Voiceover
- Flag: `is_narration`
- Register: R3 (consultative) for educational, R2 (formal) for documentary
- Emotion: Usually E09 (neutral), sometimes E06 (anticipation) for dramatic narration
- Situation: Match the topic being narrated, not "narration" itself (unless pure tutorial = S49)

---

*End of document. This taxonomy is the master reference for the Shortee tagging pipeline, game engine, collection system, and browse/filter UX.*
