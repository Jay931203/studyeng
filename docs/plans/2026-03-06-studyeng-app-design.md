# StudyEng - English Learning App Design

## Date: 2026-03-06
## Status: Approved

---

## 1. Core Philosophy

**"Play first, learn naturally"** - If it feels like studying, it's a failure.

- Short-form video feed (TikTok/Reels style vertical swipe)
- Subtitle toggle for self-paced learning
- Micro-games (never "quizzes") for review
- AI works invisibly as game engine, not as a chatbot
- Zero pressure: no forced progress bars, no scores that punish

---

## 2. Platform Strategy

**Hybrid approach:**
- Phase 1 (MVP): Next.js web app (PWA-capable)
- Phase 2: Feature expansion on web
- Phase 3: React Native mobile app + self-hosted video

---

## 3. Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | Next.js 15 (App Router) + TypeScript | SSR/SEO, full-stack |
| UI | Tailwind CSS + Framer Motion | Mobile-first, smooth animations |
| Video Player | YouTube IFrame API | MVP content source |
| Subtitles | Custom overlay (YouTube caption data) | Interactive learning features |
| AI (Game Engine) | Claude API (Anthropic) | Adaptive problem generation |
| Backend | Next.js API Routes + Prisma | Single full-stack project |
| Database | PostgreSQL (Supabase) | Free tier, built-in Auth |
| Auth | Supabase Auth (Google) | Simple social login |
| Deploy | Vercel | Optimal for Next.js |
| State | Zustand | Lightweight |

---

## 4. Architecture

```
Vercel (Deploy)
  Next.js App (Frontend + API)
    [Feed] [Explore] [My Learning] [Profile]
        |         |          |
    [API Routes (Server)]
        |         |          |
  [Supabase]  [YouTube]  [Claude API]
  (DB+Auth)    (API)     (Game Engine)
```

---

## 5. Screen Structure (4 Tabs)

| Tab | Function |
|-----|----------|
| Feed | Short-form video feed (main screen) |
| Explore | Browse by category/difficulty |
| My Learning | Saved phrases + review games |
| Profile | Streak, badges, settings |

---

## 6. Core Features

### 6.1 Short-form Video Feed
- Vertical swipe navigation (TikTok-style)
- Subtitle 3 modes: None / English / English+Korean (tap to toggle)
- Section repeat: touch to select segment, auto-loop
- Phrase save: long-press subtitle to save to learning journal
- Speed control: 0.5x / 0.75x / 1x / 1.25x

### 6.2 Touch-based Micro Games (all under 30 seconds)
- **Fill-in-the-blank**: Tap the correct word for blanks in video sentences
- **Sentence Puzzle**: Drag word cards to build correct sentence
- **Meaning Match**: Connect English expressions to Korean meanings
- **Speed Game**: Tap correct answers within time limit

Rules:
- No penalty for wrong answers
- Correct = coins/XP reward
- AI generates problems adapted to user level (invisible to user)

### 6.3 Gamification
- Daily streak tracking
- XP and level-up animations
- Badge collection
- No forced progress tracking or study pressure

---

## 7. Data Model

### User
- id, email, name, avatar
- level, xp, streak_days
- created_at

### Video
- id, youtube_id, title
- category, difficulty (1-5)
- duration, thumbnail_url
- subtitle_data (JSON - timestamped subtitles)

### SavedPhrase
- id, user_id, video_id
- english_text, korean_text
- timestamp_start, timestamp_end
- review_count, last_reviewed

### GameResult
- id, user_id, video_id
- game_type, score, xp_earned
- played_at

### UserProgress
- user_id, video_id
- watch_count, subtitle_mode_used
- games_played, games_completed
- last_watched_at

---

## 8. Revenue Model (Freemium + Ads)

| Feature | Free | Premium (9,900 KRW/mo) |
|---------|------|------------------------|
| Video views | 5/day | Unlimited |
| Subtitle modes | English only | English + Korean + word meanings |
| Games | 2 types | All 4 types |
| Ads | Banner between videos | No ads |
| Section repeat | Yes | Yes |
| Speed control | Yes | Yes |

---

## 9. MVP Scope (Phase 1)

**Included:**
- Short-form video feed with swipe
- Subtitle 3 modes (none/English/English+Korean)
- Section repeat playback
- Speed control
- Phrase save
- 2 touch games (fill-in-blank + sentence puzzle)
- Google login (Supabase Auth)
- Streak/XP system
- Basic profile

**Phase 2 (Post-MVP):**
- Additional 2 games (meaning match + speed game)
- AI-adaptive difficulty
- Kakao login
- Premium subscription (payment)

**Phase 3 (Scale):**
- Self-hosted video infrastructure
- Ad system
- React Native mobile app
- Advanced analytics

---

## 10. Content Strategy (Hybrid)

**MVP:** YouTube embedded videos with custom subtitle overlay
- Curate English learning-friendly short clips
- Extract/create subtitle data via YouTube Captions API

**Future:** Self-hosted videos for full control
- Original content production
- Licensed content partnerships
