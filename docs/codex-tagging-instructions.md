# Expression Tagging Task for Codex

## Goal
Tag ALL 1,766 JSON files in `public/expression-tags/` with 9-dimension expression taxonomy.
Each file contains English subtitle sentences that need classification for an English learning app.

## File Format
Each file: `public/expression-tags/{videoId}.json`

```json
{
  "videoId": "xxx",
  "category": "drama",
  "title": "...",
  "seriesId": "...",
  "sentenceCount": 15,
  "taggedCount": 0,   // ← UPDATE to match tagged count
  "sentences": [
    {
      "id": "xxx-0",
      "en": "English sentence",
      "ko": "Korean translation",
      "tags": {
        "functions": [],        // ← FILL: 1-3 IDs
        "situation": "",        // ← FILL: 1 ID
        "cefr": "",             // ← FILL: "A1"-"C2"
        "register": "",         // ← FILL: 1 ID
        "emotions": [],         // ← FILL: 1-2 IDs
        "expression_types": [], // ← FILL: 1-3 IDs
        "vibe": "",             // ← FILL: 1 ID
        "power": [],            // ← FILL: 0-2 IDs
        "grammar_intent": [],   // ← FILL: 0-2 IDs
        "flags": []             // ← FILL: 0-3 strings
      }
    }
  ]
}
```

## Taxonomy Reference (9 Dimensions)

### 1. Communicative Function (functions) — Array, 1-3 IDs
**INFORMATION**: F01=stating_fact, F02=describing, F03=narrating, F04=explaining, F05=reporting, F06=asking_information, F07=confirming, F08=correcting
**OPINIONS**: F09=expressing_opinion, F10=agreeing, F11=disagreeing, F12=evaluating_judging, F13=comparing, F14=speculating
**EMOTIONS**: F15=expressing_happiness, F16=expressing_sadness, F17=expressing_anger, F18=expressing_surprise, F19=expressing_fear_worry, F20=expressing_disappointment, F21=expressing_frustration, F22=expressing_love_affection, F23=expressing_disgust, F24=expressing_hope
**SOCIAL**: F25=greeting, F26=introducing, F27=thanking, F28=apologizing, F29=congratulating, F30=complimenting, F31=consoling_comforting, F32=saying_goodbye, F33=small_talk
**GETTING THINGS DONE**: F34=requesting, F35=ordering_commanding, F36=suggesting, F37=advising, F38=inviting, F39=offering, F40=warning, F41=promising, F42=threatening, F43=refusing, F44=accepting, F45=persuading, F46=permission_asking, F47=permission_granting
**CONVERSATION**: F48=changing_topic, F49=interrupting, F50=clarifying, F51=checking_understanding, F52=buying_time, F53=backchanneling, F54=summarizing
**CONFLICT**: F55=accusing, F56=denying, F57=defending, F58=insulting, F59=sarcasm_irony, F60=confronting, F61=forgiving
**DECLARATIONS**: F62=announcing, F63=deciding, F64=confessing, F65=vowing

### 2. Situation (situation) — Single ID
**Daily Life**: S01=home_family, S02=cooking_meals, S03=morning_routine, S04=shopping, S05=restaurant_cafe, S06=driving_commuting, S07=neighborhood_errands
**Relationships**: S08=romantic_dating, S09=friendship, S10=family_conflict, S11=breakup_divorce, S12=wedding_proposal, S13=reunion_reconciliation
**Work**: S14=workplace_office, S15=job_interview, S16=meeting_presentation, S17=boss_employee, S18=startup_business
**School**: S19=school_classroom, S20=college_campus, S21=tutoring_study
**Travel/Services**: S22=airport_travel, S23=hotel_accommodation, S24=phone_call, S25=bank_finance, S26=public_transport
**Health**: S27=hospital_doctor, S28=emergency_medical, S29=therapy_counseling, S30=fitness_gym
**Social**: S31=party_celebration, S32=bar_nightlife, S33=sports_game, S34=concert_show, S35=online_social_media
**High Stakes**: S36=legal_courtroom, S37=police_investigation, S38=emergency_crisis, S39=confrontation_argument, S40=confession_secret, S41=funeral_grief, S42=military_war
**Special**: S43=fantasy_scifi, S44=period_historical, S45=animation_cartoon, S46=music_lyrics, S47=news_documentary, S48=self_help_motivation
**General**: S49=how_to_tutorial, S50=general

### 3. CEFR (cefr) — Single string
"A1" (beginner) → "A2" → "B1" → "B2" → "C1" → "C2" (mastery)
- Simple commands, basic vocab = A1-A2
- Conversational, modals, opinions = B1-B2
- Idioms, cultural refs, sarcasm, rare vocab = C1-C2
- Profanity does NOT mean C-level. "Shut up" = A2. "Don't you dare patronize me" = C1.

### 4. Register (register) — Single ID
R1=frozen (ritualized, "I do solemnly swear"), R2=formal, R3=consultative (polite standard), R4=casual, R5=intimate

### 5. Emotion/Tone (emotions) — Array, 1-2 IDs
E01=joy, E02=sadness, E03=anger, E04=fear, E05=surprise, E06=anticipation, E07=trust, E08=disgust, E09=neutral, E10=sarcastic, E11=romantic, E12=threatening, E13=pleading, E14=playful, E15=desperate, E16=bitter
- E09 (neutral) for purely informational. E10 (sarcastic) can combine with any other.

### 6. Expression Type (expression_types) — Array, 1-3 IDs
X01=phrasal_verb ("run into"), X02=idiom ("break your heart"), X03=collocation ("heavy rain"), X04=fixed_expression ("by the way"), X05=slang ("That's lit"), X06=filler/discourse_marker ("well...", "you know"), X07=hedging ("sort of", "kind of"), X08=plain (default)
- X08 is default when no special pattern exists.

### 7. Vibe (vibe) — Single ID
V01=sassy, V02=wholesome, V03=savage, V04=cringe, V05=motivational, V06=dark_humor, V07=romantic_sweet, V08=badass, V09=emotional_heavy, V10=funny, V11=awkward, V12=intense, V13=chill, V14=nostalgic, V15=petty, V16=wise, V17=chaotic, V18=neutral_plain
- Vibe = the FEELING the scene gives the viewer, not literal meaning.
- "I'm going to kill you" in joking context = V10 (funny), not V12 (intense).

### 8. Power Tag (power) — Array, 0-2 IDs
P01=native_only, P02=interview_killer, P03=daily_essential, P04=movie_famous, P05=slang_alert, P06=culture_key, P07=comeback_ready, P08=debate_weapon, P09=flirt_line, P10=emotional_punch, P11=business_pro, P12=test_likely
- 60%+ sentences should have NO power tags. Only for standout expressions.

### 9. Grammar Intent (grammar_intent) — Array, 0-2 IDs
G01=거절할_때, G02=부탁할_때, G03=칭찬할_때, G04=사과할_때, G05=위로할_때, G06=화낼_때, G07=놀랐을_때, G08=약속할_때, G09=제안할_때, G10=비교할_때, G11=후회할_때, G12=가정할_때, G13=허락_구할_때, G14=인_척_할_때, G15=원하는_걸_말할_때, G16=확신할_때, G17=불확실할_때, G18=설명할_때, G19=불평할_때, G20=동의할_때, G21=반대할_때, G22=고백할_때, G23=응원할_때, G24=경고할_때, G25=작별할_때
- 50%+ sentences should have NO grammar intent. Only when a clear Korean-learner-useful pattern exists.

### Special Flags (flags) — Array, 0-3 strings
`is_lyrics`, `is_narration`, `is_period`, `contains_profanity`, `is_fragment`

## Quality Reference (Already Tagged Samples)

See these 5 files for quality reference — they are already tagged correctly:
- `public/expression-tags/-0EiP69JURo.json` (JUNO movie)
- `public/expression-tags/-4sU_AhRPY0.json` (Ellen Show)
- `public/expression-tags/-6Up7CG5d6M.json` (Brooklyn 99)
- `public/expression-tags/-YzXy3SM-lY.json` (M2M song)
- `public/expression-tags/1aA1WGON49E.json` (TEDx talk)

## Context Hints
- Use the file's `category` field (drama/movie/entertainment/music/daily/animation) and `title` to understand the context.
- Music category → most sentences are lyrics → flag `is_lyrics`, situation = S46
- Animation category → consider S45 for situation
- The `en` and `ko` fields together give full context for accurate tagging.

## Instructions
1. Process ALL files in `public/expression-tags/` where `taggedCount` is 0
2. For each sentence, fill ALL 9 tag dimensions + flags
3. Update `taggedCount` to match the number of sentences tagged
4. Write the file back in-place (same path)
5. Do NOT modify `id`, `en`, `ko`, `videoId`, `category`, `title`, `seriesId`, or `sentenceCount`
6. Preserve valid JSON formatting

## Validation Checklist
- Every `functions` array has 1-3 valid F-IDs
- Every `situation` is a single valid S-ID (not empty)
- Every `cefr` is one of: "A1","A2","B1","B2","C1","C2" (not empty)
- Every `register` is one of: "R1","R2","R3","R4","R5" (not empty)
- Every `emotions` array has 1-2 valid E-IDs
- Every `expression_types` array has 1-3 valid X-IDs
- Every `vibe` is a single valid V-ID (not empty)
- `power` array has 0-2 valid P-IDs
- `grammar_intent` array has 0-2 valid G-IDs
- `flags` array has 0-3 valid flag strings
