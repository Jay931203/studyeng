# Shortee Brand Command Center

**Date:** 2026-03-08  
**Owner:** Branding / Growth Lead  
**Purpose:** Lock the final brand direction, define the competitive position, and keep launch blockers visible until release quality is met.

---

## 1. Final Brand Decision

### External brand

Use **`Shortee`** everywhere user-facing.

- Keep `studyeng` only as an internal repo/workspace name until migration is complete.
- Do not ship a mixed state where ads, app store assets, docs, and product UI use different names.

### Brand sentence

> **보다 보면 귀가 먼저 익숙해진다.**

### Working tagline

- Korean: **보다 보면 귀가 먼저 익숙해진다**
- English: **Play the clip. English follows.**

### Positioning

Shortee is **not** a grammar-first study app, a test-prep app, or an AI tutor-first app.

Shortee is:

- a short-form English clip app
- entertainment-first
- passive-learning friendly
- built for fast daily reuse
- strongest when the first 30 seconds already feel rewarding

### Core audience

- Korean users who want English exposure without "study mode"
- entertainment-driven learners
- commuters and short-session users
- people who like drama, music, movies, creators, and memorable expressions

### We should not try to be

- TOEIC / IELTS prep
- full speaking tutor replacement
- curriculum-heavy classroom app
- broad "all ages, all goals" learning platform

---

## 2. Competitive Position

### What the current market leaders signal

### Cake

- Strongest nearby competitor for Shortee's direction
- Official Play listing says **100M+ downloads**, daily updates, creator/K-pop/K-drama content, AI pronunciation, classes, and a paid Plus tier with unlimited hearts and ad-free use
- The App Store headline is still built around **"1분에 영어 표현 한 개씩"**

### Duolingo

- Strongest habit machine and the clearest proof that play + measurement + iteration scale together
- Official investor materials emphasize AI features like **Video Call**, Max, and constant experimentation across millions of users
- Competes on structure, retention systems, and scale, not on short-form clip immersion

### Speak

- Official homepage is explicit: speak out loud, get instant feedback, use an AI tutor
- Speak reports **15M+ downloads**, **4.8 rating**, and a **7-day free trial**
- Their lane is tutor-like speaking confidence, not entertainment feed depth

### VoiceTube

- Official services page and Play listing emphasize authentic video learning, one-tap dictionary, sentence looping, voice recording, AI pronunciation, and long-tail category coverage
- VoiceTube reports **4M+ users** on the website and **1M+ downloads** on Google Play
- Their lane is utility-rich video learning, not feed-native habit loops

### Shortee's defensible lane

Shortee should own this position:

- **shortest session**
- **lowest friction**
- **most feed-native**
- **most entertainment-adjacent**
- **light review, not heavy coursework**

### Strategic conclusion

Do **not** try to out-Duolingo on gamification, out-Speak on AI tutoring, or out-VoiceTube on library depth.

Shortee wins if it becomes:

- the easiest app to open
- the easiest app to continue using for 3-5 minutes
- the easiest app to share one good line from

---

## 3. Product Reality Audit

### Brand signals already aligned to `Shortee`

- `public/manifest.json` uses `Shortee`
- `src/app/layout.tsx` metadata uses `Shortee`
- default theme direction now uses jade / deep teal instead of legacy purple as the primary accent
- `src/components/Logo.tsx` renders `Shortee`
- share copy in `src/components/ShareButton.tsx` and `src/components/UnifiedControls.tsx` uses `Shortee`
- legal pages already use `Shortee`
- brand handoff docs now exist for UI/UX and creative teams

### Brand signals still stuck in `StudyEng`

- `package.json` package name is `studyeng`
- persisted local keys still use `studyeng-*`
- major strategy docs still use `StudyEng`
- internal implementation names still include legacy `studyeng`

### Tone and visual mismatch

- core theme direction is now dark-first + jade, but blue fallback and some legacy theme ids still remain for migration safety
- major entry / navigation / review surfaces now use the new brand nouns, but a full copy audit is still not complete
- UI/UX detailing is intentionally left to the product designer, with brand rules documented separately

### Product/monetization mismatch

- premium modal and discount logic exist
- real billing does **not** exist yet
- premium state is still toggled locally via store state, so current premium UX is a simulation, not a production revenue flow

### Growth/measurement mismatch

- recommendation signals exist for product logic
- marketing analytics do not exist
- attribution does not exist
- lifecycle messaging infrastructure does not exist
- there is no event schema that ties creative, onboarding, retention, and revenue together

---

## 4. Launch Gate: Release Status As Of 2026-03-08

### Verification run

- `npm run test:run` -> passed
- `npm run lint` -> passed with warnings only
- `npm run build` -> passed

### P0 blockers

1. **No real payment integration**
   - premium is not release-ready revenue
   - no store billing / payment provider / purchase verification / subscription lifecycle

2. **No analytics or attribution**
   - cannot answer which creative works
   - cannot answer which onboarding path retains users
   - cannot answer which paywall converts

3. **Brand source of truth is still partly split**
   - product says `Shortee`
   - some internal names still say `StudyEng` / `studyeng`
   - this can still create launch inconsistency in ads, ASO, deck, PR copy, and team execution

### P1 gaps

1. **Full brand copy audit is not complete**
2. **Onboarding segmentation is shallow**
   - level only
   - no reliable interest capture for messaging and recommendations
3. **Referral loop is weak**
   - sharing copies a deep link, but there is no referral incentive or UTM structure
4. **CRM stack is absent**
   - no push
   - no lifecycle email
   - no reactivation automation
5. **Project documentation was not launch-grade**
   - fixed partially by updating the root README, but broader cleanup is still needed

### Release call

**Brand foundations are now directionally aligned, but the business system is still not launch-ready.**

It is closer to:

- a branded product prototype with real positioning potential
- a much clearer brand-ready MVP
- a still non-operational growth and monetization system

---

## 5. Final Brand Philosophy

### What users should feel

- "재밌어서 눌렀는데 영어가 남는다"
- "공부 앱보다 숏폼 앱에 가깝다"
- "짧게 보기 좋다"
- "부담 없이 이어 보기 좋다"

### Tone rules

- concise
- grounded
- slightly sharp
- never childish
- never preachy
- never "teacher voice"

### Messaging rules

Use:

- "장면"
- "표현"
- "바로 보기"
- "이어 보기"
- "가볍게"
- "지금 보고 싶어질"

Avoid:

- "학습자님"
- "커리큘럼"
- "문법 정복"
- "영어 실력 향상 솔루션"
- exaggerated celebration copy

### Visual rule

One clear palette, one wordmark, one launch story.

Current recommendation:

- keep dark-first mobile feel
- move away from default violet identity
- use a more distinctive adult palette before store launch

---

## 6. User Acquisition Plan

### Rule before spending

Do **not** spend serious paid budget before these are true:

- build passes
- payment is real
- event tracking exists
- `Shortee` naming is fully unified
- one launch message is fixed

### Phase 1: zero-to-one acquisition

### 1. Short-form content seeding

Ship a high-volume clip content loop:

- one clip
- one line
- one Korean meaning
- one "when to use it"

This should power:

- Instagram Reels
- TikTok
- YouTube Shorts
- X / Threads screenshots
- creator DM seeding

### 2. Creator seeding

Best fit creators:

- K-drama clip editors
- K-pop / movie / sitcom English explainer creators
- "오늘의 표현" style micro educators
- commute/productivity creators

Message to creators:

- not "AI English app"
- not "serious education app"
- **"재밌는 장면으로 영어가 남는 숏폼 앱"**

### 3. Share loop upgrade

Current sharing is link copy only.

Need next:

- phrase card share
- clip preview share
- referral deep links
- UTM campaign tagging

### 4. ASO

Target the overlap of entertainment and English intent:

- 드라마 영어
- 미드 영어
- 숏폼 영어
- 영어 리스닝
- 표현 공부
- K-pop 영어

### 5. Community distribution

Best low-cost launch surfaces:

- university communities
- commuter communities
- English self-study communities
- fandom communities where clips already spread

### Phase 2: paid after instrumentation

Only after event tracking and purchase tracking exist:

- Meta short-form creative tests
- TikTok UGC ad tests
- search ads for high-intent Korean keywords

Paid creative should test 3 angles only:

1. entertainment-first
2. commute / 5-minute use
3. expression-saving payoff

---

## 7. Marketing Automation Roadmap

### Stage 1: before external tools

Build an internal MVP first with the current stack.

Minimum needed:

- event table
- user segment table
- scheduled job
- message queue
- webhook-friendly architecture

This can be done with:

- Supabase events
- scheduled jobs
- one outbound message channel at a time

### Required event schema

At minimum:

- `app_opened`
- `signup_started`
- `signup_completed`
- `onboarding_started`
- `onboarding_completed`
- `clip_impression`
- `clip_completed`
- `phrase_saved`
- `share_clicked`
- `share_completed`
- `paywall_viewed`
- `checkout_started`
- `purchase_completed`
- `purchase_failed`
- `streak_3d`
- `streak_7d`
- `reactivated`

### Lifecycle flows to automate after branding is fixed

### New user

- Day 0 welcome
- first saved phrase moment
- onboarding incomplete nudge

### Early retention

- 24h no return after first session
- 48h after first saved phrase
- 3-day streak reinforcement
- first paywall view without purchase

### Monetization

- annual value message after repeated usage
- premium reminder after heavy free usage
- trial ending reminder
- failed checkout recovery

### Reactivation

- users who liked clips but did not save phrases
- users who saved phrases but stopped opening
- users who viewed paywall multiple times but never converted

### Marketing automation principle

Do not automate generic spam.

Automate around a real behavior:

- watched
- saved
- shared
- returned
- nearly converted
- lapsed after a strong signal

---

## 8. Weekly Operating Cadence

Every week, report these to leadership:

### Brand

- name consistency status
- palette consistency status
- copy consistency status
- app store / landing / in-product mismatch list

### Product

- build status
- lint status
- payment readiness
- analytics readiness
- event coverage gaps

### Growth

- top acquisition hypothesis
- top retention hypothesis
- top monetization hypothesis
- top blocked experiment

### Content

- clips added
- top-performing categories
- save rate by category
- completion rate by category

---

## 9. Immediate Next Actions

### This week

1. Finish the brand migration decision: `Shortee` external, `studyeng` internal only
2. Keep the UI/UX handoff doc as the source of truth for brand implementation
3. Add minimum analytics events for onboarding, clip consumption, save, share, paywall, purchase
4. Replace simulated premium with real billing architecture

### After that

1. Build phrase-card sharing
2. Add campaign-aware referral links
3. Launch a creator seeding pack
4. Add lifecycle automation for activation and comeback

---

## 10. Sources

All external checks below were reviewed on **2026-03-08**.

- Cake Google Play: https://play.google.com/store/apps/details?id=me.mycake&hl=en_US
- Cake App Store: https://apps.apple.com/kr/app/cake-%EC%A0%84-%EC%84%B8%EA%B3%84-1%EC%96%B5-%EB%8B%A4%EC%9A%B4%EB%A1%9C%EB%93%9C-%EC%98%81%EC%96%B4-%ED%95%99%EC%8A%B5-%EC%95%B1/id1350420987
- Speak official site: https://www.speak.com/
- VoiceTube services: https://www.voicetube.com/services
- VoiceTube Google Play: https://play.google.com/store/apps/details?id=org.redidea.voicetube&hl=en_US
- Duolingo investor update on product direction: https://investors.duolingo.com/news-releases/news-release-details/duolingo-unveils-major-product-updates-turn-learning-real-world
- Duolingo investor update on AI Video Call: https://investors.duolingo.com/news-releases/news-release-details/duolingo-launches-ai-powered-video-call-android
