# StudyEng MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a TikTok-style English learning web app with short-form video feeds, subtitle toggle, section repeat, phrase saving, and 2 touch-based micro games.

**Architecture:** Next.js 15 App Router full-stack app. YouTube IFrame API for video content with custom subtitle overlay. Supabase for PostgreSQL database and Google OAuth. Zustand for client state. Tailwind CSS + Framer Motion for mobile-first UI with smooth animations.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 4, Framer Motion, YouTube IFrame API, Prisma, Supabase (PostgreSQL + Auth), Zustand, Vercel

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `.env.local.example`, `.gitignore`

**Step 1: Initialize Next.js project**

```bash
cd C:/Users/hyunj/studyeng
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select defaults when prompted. If directory is not empty, answer yes to continue.

**Step 2: Install core dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr prisma @prisma/client zustand framer-motion @anthropic-ai/sdk
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom @testing-library/user-event
```

**Step 3: Create Vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Create `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

**Step 4: Create env example file**

Create `.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_url
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
```

**Step 5: Add test script to package.json**

Add to `scripts` in `package.json`:

```json
"test": "vitest",
"test:run": "vitest run"
```

**Step 6: Verify setup**

```bash
npm run build
npm run test:run
```

Expected: Build succeeds, test runner starts (0 tests).

**Step 7: Initialize git and commit**

```bash
git init
git add -A
git commit -m "chore: initialize Next.js project with dependencies"
```

---

## Task 2: Database Schema (Prisma + Supabase)

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Test: `src/test/schema.test.ts`

**Step 1: Initialize Prisma**

```bash
npx prisma init
```

**Step 2: Write the schema**

Replace `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id         String   @id @default(uuid())
  email      String   @unique
  name       String?
  avatar     String?
  level      Int      @default(1)
  xp         Int      @default(0)
  streakDays Int      @default(0)
  lastActiveDate DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  savedPhrases  SavedPhrase[]
  gameResults   GameResult[]
  userProgress  UserProgress[]
}

model Video {
  id           String   @id @default(uuid())
  youtubeId    String   @unique
  title        String
  category     String
  difficulty   Int      @default(1) // 1-5
  duration     Int      // seconds
  thumbnailUrl String?
  subtitleData Json     // [{start: number, end: number, en: string, ko: string}]
  createdAt    DateTime @default(now())

  savedPhrases SavedPhrase[]
  gameResults  GameResult[]
  userProgress UserProgress[]
}

model SavedPhrase {
  id             String   @id @default(uuid())
  userId         String
  videoId        String
  englishText    String
  koreanText     String
  timestampStart Float
  timestampEnd   Float
  reviewCount    Int      @default(0)
  lastReviewed   DateTime?
  createdAt      DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  video Video @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([videoId])
}

model GameResult {
  id        String   @id @default(uuid())
  userId    String
  videoId   String
  gameType  String   // "fill-blank" | "sentence-puzzle"
  score     Int
  xpEarned  Int
  playedAt  DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  video Video @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([videoId])
}

model UserProgress {
  id              String   @id @default(uuid())
  userId          String
  videoId         String
  watchCount      Int      @default(0)
  subtitleModeUsed String[] // ["none", "en", "en-ko"]
  gamesPlayed     Int      @default(0)
  gamesCompleted  Int      @default(0)
  lastWatchedAt   DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  video Video @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@unique([userId, videoId])
  @@index([userId])
}
```

**Step 3: Create Prisma client singleton**

Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Step 4: Write schema validation test**

Create `src/test/schema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Prisma Schema', () => {
  const schema = fs.readFileSync(
    path.join(process.cwd(), 'prisma/schema.prisma'),
    'utf-8'
  )

  it('defines all required models', () => {
    expect(schema).toContain('model User')
    expect(schema).toContain('model Video')
    expect(schema).toContain('model SavedPhrase')
    expect(schema).toContain('model GameResult')
    expect(schema).toContain('model UserProgress')
  })

  it('User has gamification fields', () => {
    expect(schema).toContain('level')
    expect(schema).toContain('xp')
    expect(schema).toContain('streakDays')
  })

  it('Video has subtitle data as JSON', () => {
    expect(schema).toContain('subtitleData Json')
  })

  it('UserProgress has unique constraint on userId+videoId', () => {
    expect(schema).toContain('@@unique([userId, videoId])')
  })
})
```

**Step 5: Run test**

```bash
npm run test:run
```

Expected: All 4 tests PASS.

**Step 6: Generate Prisma client (validate schema)**

```bash
npx prisma generate
```

Expected: Prisma Client generated successfully.

**Step 7: Commit**

```bash
git add prisma/ src/lib/prisma.ts src/test/schema.test.ts
git commit -m "feat: add database schema with Prisma"
```

---

## Task 3: Supabase Auth Setup

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/middleware.ts`
- Create: `src/app/auth/callback/route.ts`
- Create: `src/hooks/useAuth.ts`

**Step 1: Create Supabase browser client**

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 2: Create Supabase server client**

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - ignore
          }
        },
      },
    }
  )
}
```

**Step 3: Create middleware for session refresh**

Create `src/lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return supabaseResponse
}
```

Create `src/middleware.ts`:

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Step 4: Create auth callback route**

Create `src/app/auth/callback/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
```

**Step 5: Create useAuth hook**

Create `src/hooks/useAuth.ts`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return { user, loading, signInWithGoogle, signOut }
}
```

**Step 6: Commit**

```bash
git add src/lib/supabase/ src/middleware.ts src/app/auth/ src/hooks/useAuth.ts
git commit -m "feat: add Supabase auth with Google OAuth"
```

---

## Task 4: App Layout + Bottom Navigation

**Files:**
- Create: `src/components/BottomNav.tsx`
- Create: `src/components/BottomNav.test.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/app/(tabs)/layout.tsx`
- Create: `src/app/(tabs)/page.tsx`
- Create: `src/app/(tabs)/explore/page.tsx`
- Create: `src/app/(tabs)/learning/page.tsx`
- Create: `src/app/(tabs)/profile/page.tsx`

**Step 1: Write BottomNav test**

Create `src/components/BottomNav.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from './BottomNav'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('BottomNav', () => {
  it('renders 4 navigation tabs', () => {
    render(<BottomNav />)
    expect(screen.getByText('Feed')).toBeInTheDocument()
    expect(screen.getByText('Explore')).toBeInTheDocument()
    expect(screen.getByText('Learning')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  it('highlights active tab', () => {
    render(<BottomNav />)
    const feedLink = screen.getByText('Feed').closest('a')
    expect(feedLink).toHaveClass('text-blue-500')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/components/BottomNav.test.tsx
```

Expected: FAIL - module not found.

**Step 3: Implement BottomNav**

Create `src/components/BottomNav.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: 'Feed', icon: 'home' },
  { href: '/explore', label: 'Explore', icon: 'search' },
  { href: '/learning', label: 'Learning', icon: 'book' },
  { href: '/profile', label: 'Profile', icon: 'user' },
] as const

const icons: Record<string, (active: boolean) => React.ReactNode> = {
  home: (active) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="w-6 h-6">
      <path d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  search: (active) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  book: (active) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="w-6 h-6">
      <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  user: (active) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
}

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-t border-white/10 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(({ href, label, icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                isActive ? 'text-blue-500' : 'text-gray-400'
              }`}
            >
              {icons[icon](isActive)}
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/components/BottomNav.test.tsx
```

Expected: All tests PASS.

**Step 5: Update global styles for mobile-first dark theme**

Replace `src/app/globals.css`:

```css
@import "tailwindcss";

:root {
  --background: #000000;
  --foreground: #ffffff;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  overscroll-behavior: none;
  overflow: hidden;
  height: 100dvh;
  width: 100vw;
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Hide scrollbar */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

**Step 6: Update root layout**

Replace `src/app/layout.tsx`:

```typescript
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StudyEng - Learn English the Fun Way',
  description: 'Learn English through short-form videos and games',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
```

**Step 7: Create tabs layout**

Create `src/app/(tabs)/layout.tsx`:

```typescript
import { BottomNav } from '@/components/BottomNav'

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-dvh flex flex-col">
      <main className="flex-1 overflow-hidden">{children}</main>
      <BottomNav />
    </div>
  )
}
```

**Step 8: Create placeholder pages**

Create `src/app/(tabs)/page.tsx`:

```typescript
export default function FeedPage() {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-gray-500 text-lg">Feed coming soon</p>
    </div>
  )
}
```

Create `src/app/(tabs)/explore/page.tsx`:

```typescript
export default function ExplorePage() {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-gray-500 text-lg">Explore coming soon</p>
    </div>
  )
}
```

Create `src/app/(tabs)/learning/page.tsx`:

```typescript
export default function LearningPage() {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-gray-500 text-lg">My Learning coming soon</p>
    </div>
  )
}
```

Create `src/app/(tabs)/profile/page.tsx`:

```typescript
export default function ProfilePage() {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-gray-500 text-lg">Profile coming soon</p>
    </div>
  )
}
```

**Step 9: Remove old `src/app/page.tsx` if it exists (replaced by tabs)**

Delete `src/app/page.tsx` if it exists — the `(tabs)/page.tsx` now serves as the root page.

**Step 10: Run tests and build**

```bash
npm run test:run
npm run build
```

Expected: All tests pass, build succeeds.

**Step 11: Commit**

```bash
git add -A
git commit -m "feat: add mobile-first layout with bottom navigation"
```

---

## Task 5: Zustand Store + XP/Streak Logic

**Files:**
- Create: `src/stores/usePlayerStore.ts`
- Create: `src/stores/useUserStore.ts`
- Create: `src/lib/gamification.ts`
- Test: `src/lib/gamification.test.ts`
- Test: `src/stores/useUserStore.test.ts`

**Step 1: Write gamification logic test**

Create `src/lib/gamification.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculateXpForLevel, shouldUpdateStreak, addXp } from './gamification'

describe('gamification', () => {
  describe('calculateXpForLevel', () => {
    it('level 1 requires 100 XP', () => {
      expect(calculateXpForLevel(1)).toBe(100)
    })

    it('level 2 requires 200 XP', () => {
      expect(calculateXpForLevel(2)).toBe(200)
    })

    it('level 10 requires 1000 XP', () => {
      expect(calculateXpForLevel(10)).toBe(1000)
    })
  })

  describe('shouldUpdateStreak', () => {
    it('returns true if last active was yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(shouldUpdateStreak(yesterday, new Date())).toBe(true)
    })

    it('returns false if last active was today', () => {
      const today = new Date()
      expect(shouldUpdateStreak(today, today)).toBe(false)
    })

    it('returns "reset" if last active was more than 1 day ago', () => {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      expect(shouldUpdateStreak(twoDaysAgo, new Date())).toBe('reset')
    })

    it('returns true if no previous active date (first time)', () => {
      expect(shouldUpdateStreak(null, new Date())).toBe(true)
    })
  })

  describe('addXp', () => {
    it('adds XP without leveling up', () => {
      const result = addXp({ level: 1, xp: 0 }, 50)
      expect(result).toEqual({ level: 1, xp: 50, leveledUp: false })
    })

    it('levels up when XP exceeds threshold', () => {
      const result = addXp({ level: 1, xp: 80 }, 30)
      expect(result).toEqual({ level: 2, xp: 10, leveledUp: true })
    })

    it('can level up multiple times', () => {
      const result = addXp({ level: 1, xp: 0 }, 350)
      // Level 1 needs 100, level 2 needs 200. 350 - 100 = 250, 250 - 200 = 50
      expect(result).toEqual({ level: 3, xp: 50, leveledUp: true })
    })
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/lib/gamification.test.ts
```

Expected: FAIL.

**Step 3: Implement gamification logic**

Create `src/lib/gamification.ts`:

```typescript
export function calculateXpForLevel(level: number): number {
  return level * 100
}

export function shouldUpdateStreak(
  lastActiveDate: Date | null,
  now: Date
): boolean | 'reset' {
  if (!lastActiveDate) return true

  const last = new Date(lastActiveDate)
  last.setHours(0, 0, 0, 0)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const diffDays = Math.floor(
    (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays === 0) return false
  if (diffDays === 1) return true
  return 'reset'
}

export function addXp(
  current: { level: number; xp: number },
  earned: number
): { level: number; xp: number; leveledUp: boolean } {
  let { level, xp } = current
  xp += earned
  let leveledUp = false

  while (xp >= calculateXpForLevel(level)) {
    xp -= calculateXpForLevel(level)
    level++
    leveledUp = true
  }

  return { level, xp, leveledUp }
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/lib/gamification.test.ts
```

Expected: All 7 tests PASS.

**Step 5: Create user store**

Create `src/stores/useUserStore.ts`:

```typescript
import { create } from 'zustand'

interface UserState {
  level: number
  xp: number
  streakDays: number
  showLevelUp: boolean

  setUser: (data: { level: number; xp: number; streakDays: number }) => void
  gainXp: (amount: number) => void
  dismissLevelUp: () => void
}

export const useUserStore = create<UserState>((set, get) => ({
  level: 1,
  xp: 0,
  streakDays: 0,
  showLevelUp: false,

  setUser: (data) => set(data),

  gainXp: (amount) => {
    const { level, xp } = get()
    const xpForLevel = level * 100
    const newXp = xp + amount

    if (newXp >= xpForLevel) {
      set({
        level: level + 1,
        xp: newXp - xpForLevel,
        showLevelUp: true,
      })
    } else {
      set({ xp: newXp })
    }
  },

  dismissLevelUp: () => set({ showLevelUp: false }),
}))
```

**Step 6: Create player store**

Create `src/stores/usePlayerStore.ts`:

```typescript
import { create } from 'zustand'

type SubtitleMode = 'none' | 'en' | 'en-ko'

interface PlayerState {
  subtitleMode: SubtitleMode
  playbackRate: number
  isLooping: boolean
  loopStart: number | null
  loopEnd: number | null
  currentTime: number
  isPlaying: boolean

  toggleSubtitleMode: () => void
  setPlaybackRate: (rate: number) => void
  setLoop: (start: number, end: number) => void
  clearLoop: () => void
  setCurrentTime: (time: number) => void
  setIsPlaying: (playing: boolean) => void
}

const subtitleCycle: SubtitleMode[] = ['none', 'en', 'en-ko']

export const usePlayerStore = create<PlayerState>((set, get) => ({
  subtitleMode: 'none',
  playbackRate: 1,
  isLooping: false,
  loopStart: null,
  loopEnd: null,
  currentTime: 0,
  isPlaying: false,

  toggleSubtitleMode: () => {
    const current = subtitleCycle.indexOf(get().subtitleMode)
    const next = subtitleCycle[(current + 1) % subtitleCycle.length]
    set({ subtitleMode: next })
  },

  setPlaybackRate: (rate) => set({ playbackRate: rate }),

  setLoop: (start, end) => set({ isLooping: true, loopStart: start, loopEnd: end }),

  clearLoop: () => set({ isLooping: false, loopStart: null, loopEnd: null }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),
}))
```

**Step 7: Commit**

```bash
git add src/lib/gamification.ts src/lib/gamification.test.ts src/stores/
git commit -m "feat: add gamification logic and Zustand stores"
```

---

## Task 6: YouTube Player Component

**Files:**
- Create: `src/components/VideoPlayer.tsx`
- Create: `src/types/youtube.d.ts`
- Create: `src/hooks/useYouTubePlayer.ts`

**Step 1: Create YouTube type definitions**

Create `src/types/youtube.d.ts`:

```typescript
interface YT {
  Player: new (
    elementId: string | HTMLElement,
    options: YT.PlayerOptions
  ) => YT.Player
  PlayerState: {
    UNSTARTED: -1
    ENDED: 0
    PLAYING: 1
    PAUSED: 2
    BUFFERING: 3
    CUED: 5
  }
}

declare namespace YT {
  interface PlayerOptions {
    height?: string | number
    width?: string | number
    videoId?: string
    playerVars?: PlayerVars
    events?: Events
  }

  interface PlayerVars {
    autoplay?: 0 | 1
    controls?: 0 | 1
    disablekb?: 0 | 1
    fs?: 0 | 1
    modestbranding?: 0 | 1
    playsinline?: 0 | 1
    rel?: 0 | 1
    cc_load_policy?: 0 | 1
    iv_load_policy?: 1 | 3
  }

  interface Events {
    onReady?: (event: PlayerEvent) => void
    onStateChange?: (event: OnStateChangeEvent) => void
    onError?: (event: OnErrorEvent) => void
  }

  interface Player {
    playVideo(): void
    pauseVideo(): void
    seekTo(seconds: number, allowSeekAhead?: boolean): void
    getCurrentTime(): number
    getDuration(): number
    setPlaybackRate(rate: number): void
    getPlayerState(): number
    destroy(): void
  }

  interface PlayerEvent {
    target: Player
  }

  interface OnStateChangeEvent {
    target: Player
    data: number
  }

  interface OnErrorEvent {
    target: Player
    data: number
  }
}

interface Window {
  YT: YT
  onYouTubeIframeAPIReady: () => void
}
```

**Step 2: Create YouTube player hook**

Create `src/hooks/useYouTubePlayer.ts`:

```typescript
'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { usePlayerStore } from '@/stores/usePlayerStore'

let apiLoaded = false
let apiLoading = false
const apiCallbacks: (() => void)[] = []

function loadYouTubeAPI(): Promise<void> {
  if (apiLoaded) return Promise.resolve()

  return new Promise((resolve) => {
    if (apiLoading) {
      apiCallbacks.push(resolve)
      return
    }
    apiLoading = true

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)

    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true
      apiLoading = false
      resolve()
      apiCallbacks.forEach((cb) => cb())
      apiCallbacks.length = 0
    }
  })
}

export function useYouTubePlayer(containerId: string, videoId: string) {
  const playerRef = useRef<YT.Player | null>(null)
  const intervalRef = useRef<number | null>(null)
  const [ready, setReady] = useState(false)

  const {
    playbackRate,
    isLooping,
    loopStart,
    loopEnd,
    setCurrentTime,
    setIsPlaying,
  } = usePlayerStore()

  const initPlayer = useCallback(async () => {
    await loadYouTubeAPI()

    if (playerRef.current) {
      playerRef.current.destroy()
    }

    playerRef.current = new window.YT.Player(containerId, {
      videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        cc_load_policy: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: (event) => {
          event.target.setPlaybackRate(playbackRate)
          setReady(true)
        },
        onStateChange: (event) => {
          setIsPlaying(event.data === 1) // YT.PlayerState.PLAYING
        },
      },
    })
  }, [containerId, videoId])

  // Time tracking + loop
  useEffect(() => {
    if (!ready) return

    intervalRef.current = window.setInterval(() => {
      if (!playerRef.current) return
      const time = playerRef.current.getCurrentTime()
      setCurrentTime(time)

      if (isLooping && loopStart !== null && loopEnd !== null) {
        if (time >= loopEnd) {
          playerRef.current.seekTo(loopStart, true)
        }
      }
    }, 100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [ready, isLooping, loopStart, loopEnd])

  // Playback rate sync
  useEffect(() => {
    if (playerRef.current && ready) {
      playerRef.current.setPlaybackRate(playbackRate)
    }
  }, [playbackRate, ready])

  useEffect(() => {
    initPlayer()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      playerRef.current?.destroy()
    }
  }, [initPlayer])

  const play = () => playerRef.current?.playVideo()
  const pause = () => playerRef.current?.pauseVideo()
  const seekTo = (seconds: number) => playerRef.current?.seekTo(seconds, true)

  return { ready, play, pause, seekTo, player: playerRef }
}
```

**Step 3: Create VideoPlayer component**

Create `src/components/VideoPlayer.tsx`:

```typescript
'use client'

import { useId } from 'react'
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer'
import { usePlayerStore } from '@/stores/usePlayerStore'

interface SubtitleEntry {
  start: number
  end: number
  en: string
  ko: string
}

interface VideoPlayerProps {
  youtubeId: string
  subtitles: SubtitleEntry[]
  onSavePhrase?: (phrase: SubtitleEntry) => void
}

export function VideoPlayer({ youtubeId, subtitles, onSavePhrase }: VideoPlayerProps) {
  const containerId = `yt-player-${useId().replace(/:/g, '')}`
  const { ready, play, pause } = useYouTubePlayer(containerId, youtubeId)
  const { subtitleMode, currentTime, isPlaying, toggleSubtitleMode } = usePlayerStore()

  const currentSub = subtitles.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  )

  const handleTap = () => {
    if (isPlaying) pause()
    else play()
  }

  return (
    <div className="relative w-full h-full bg-black" onClick={handleTap}>
      {/* YouTube embed */}
      <div
        id={containerId}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Subtitle overlay */}
      {currentSub && subtitleMode !== 'none' && (
        <div
          className="absolute bottom-24 left-4 right-4 text-center"
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => {
            e.preventDefault()
            if (onSavePhrase && currentSub) onSavePhrase(currentSub)
          }}
        >
          <p className="text-white text-lg font-semibold drop-shadow-lg bg-black/40 rounded-lg px-4 py-2 inline-block">
            {currentSub.en}
          </p>
          {subtitleMode === 'en-ko' && (
            <p className="text-gray-300 text-sm mt-1 drop-shadow-lg">
              {currentSub.ko}
            </p>
          )}
        </div>
      )}

      {/* Subtitle mode toggle button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleSubtitleMode()
        }}
        className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium"
      >
        {subtitleMode === 'none' && 'CC Off'}
        {subtitleMode === 'en' && 'EN'}
        {subtitleMode === 'en-ko' && 'EN/KO'}
      </button>

      {/* Loading state */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add src/components/VideoPlayer.tsx src/types/youtube.d.ts src/hooks/useYouTubePlayer.ts
git commit -m "feat: add YouTube video player with subtitle overlay"
```

---

## Task 7: Swipeable Video Feed

**Files:**
- Create: `src/components/VideoFeed.tsx`
- Create: `src/components/VideoControls.tsx`
- Create: `src/data/seed-videos.ts`
- Modify: `src/app/(tabs)/page.tsx`

**Step 1: Create seed video data**

Create `src/data/seed-videos.ts`:

```typescript
export interface VideoData {
  id: string
  youtubeId: string
  title: string
  category: string
  difficulty: number
  subtitles: {
    start: number
    end: number
    en: string
    ko: string
  }[]
}

// Sample videos for MVP testing - replace with real curated content
export const seedVideos: VideoData[] = [
  {
    id: '1',
    youtubeId: 'dQw4w9WgXcQ', // placeholder - replace with actual learning videos
    title: 'Daily Conversation: Ordering Coffee',
    category: 'daily',
    difficulty: 1,
    subtitles: [
      { start: 0, end: 3, en: "Hi, can I get a coffee please?", ko: "안녕하세요, 커피 한 잔 주실 수 있나요?" },
      { start: 3, end: 6, en: "Sure! What size would you like?", ko: "물론이죠! 어떤 사이즈로 드릴까요?" },
      { start: 6, end: 9, en: "A large iced americano, please.", ko: "아이스 아메리카노 라지로 주세요." },
      { start: 9, end: 12, en: "Would you like any sugar or cream?", ko: "설탕이나 크림 넣어드릴까요?" },
      { start: 12, end: 15, en: "No thanks, just black is fine.", ko: "아니요 괜찮아요, 블랙으로 주세요." },
    ],
  },
  {
    id: '2',
    youtubeId: 'dQw4w9WgXcQ', // placeholder
    title: 'Travel English: At the Airport',
    category: 'travel',
    difficulty: 2,
    subtitles: [
      { start: 0, end: 3, en: "Excuse me, where is Gate 23?", ko: "실례합니다, 23번 게이트가 어디인가요?" },
      { start: 3, end: 6, en: "Go straight and turn left at the end.", ko: "직진하시다가 끝에서 왼쪽으로 도세요." },
      { start: 6, end: 9, en: "How long does it take to get there?", ko: "거기까지 얼마나 걸리나요?" },
      { start: 9, end: 12, en: "About five minutes walking.", ko: "걸어서 약 5분 정도요." },
      { start: 12, end: 15, en: "Thank you so much!", ko: "정말 감사합니다!" },
    ],
  },
  {
    id: '3',
    youtubeId: 'dQw4w9WgXcQ', // placeholder
    title: 'Business English: Meeting Small Talk',
    category: 'business',
    difficulty: 3,
    subtitles: [
      { start: 0, end: 3, en: "Good morning! How was your weekend?", ko: "좋은 아침이에요! 주말 잘 보내셨어요?" },
      { start: 3, end: 6, en: "It was great, thanks for asking.", ko: "좋았어요, 물어봐 주셔서 감사합니다." },
      { start: 6, end: 9, en: "Shall we get started with the agenda?", ko: "안건을 시작할까요?" },
      { start: 9, end: 12, en: "Sure, let me share my screen.", ko: "네, 화면 공유할게요." },
      { start: 12, end: 15, en: "Can everyone see this clearly?", ko: "모두 잘 보이시나요?" },
    ],
  },
]
```

**Step 2: Create video controls overlay**

Create `src/components/VideoControls.tsx`:

```typescript
'use client'

import { usePlayerStore } from '@/stores/usePlayerStore'

const speeds = [0.5, 0.75, 1, 1.25]

export function VideoControls() {
  const { playbackRate, setPlaybackRate, isLooping, clearLoop } = usePlayerStore()

  return (
    <div className="absolute bottom-20 right-4 flex flex-col gap-3 z-10">
      {/* Speed control */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          const currentIdx = speeds.indexOf(playbackRate)
          const nextIdx = (currentIdx + 1) % speeds.length
          setPlaybackRate(speeds[nextIdx])
        }}
        className="bg-black/50 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
      >
        {playbackRate}x
      </button>

      {/* Loop indicator */}
      {isLooping && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            clearLoop()
          }}
          className="bg-blue-500/80 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center text-xs"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903H14.25a.75.75 0 000 1.5h6a.75.75 0 00.75-.75v-6a.75.75 0 00-1.5 0v3.068l-1.903-1.903A9 9 0 003.306 9.67a.75.75 0 101.45.388zm14.49 3.882a7.5 7.5 0 01-12.548 3.364l-1.903-1.903H9.75a.75.75 0 000-1.5h-6a.75.75 0 00-.75.75v6a.75.75 0 001.5 0v-3.068l1.903 1.903A9 9 0 0020.694 14.33a.75.75 0 10-1.45-.388z" />
          </svg>
        </button>
      )}
    </div>
  )
}
```

**Step 3: Create swipeable video feed**

Create `src/components/VideoFeed.tsx`:

```typescript
'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { VideoPlayer } from './VideoPlayer'
import { VideoControls } from './VideoControls'
import type { VideoData } from '@/data/seed-videos'

interface VideoFeedProps {
  videos: VideoData[]
}

export function VideoFeed({ videos }: VideoFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const constraintsRef = useRef(null)

  const swipeThreshold = 50

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info

      if (offset.y < -swipeThreshold || velocity.y < -500) {
        // Swipe up -> next video
        if (currentIndex < videos.length - 1) {
          setDirection(1)
          setCurrentIndex((prev) => prev + 1)
        }
      } else if (offset.y > swipeThreshold || velocity.y > 500) {
        // Swipe down -> previous video
        if (currentIndex > 0) {
          setDirection(-1)
          setCurrentIndex((prev) => prev - 1)
        }
      }
    },
    [currentIndex, videos.length]
  )

  const currentVideo = videos[currentIndex]
  if (!currentVideo) return null

  return (
    <div ref={constraintsRef} className="relative w-full h-full overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentVideo.id}
          custom={direction}
          initial={{ y: direction > 0 ? '100%' : '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: direction > 0 ? '-100%' : '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="absolute inset-0"
        >
          <VideoPlayer
            youtubeId={currentVideo.youtubeId}
            subtitles={currentVideo.subtitles}
          />
          <VideoControls />

          {/* Video info overlay */}
          <div className="absolute bottom-24 left-4 z-10 pointer-events-none">
            <p className="text-white font-bold text-base drop-shadow-lg">
              {currentVideo.title}
            </p>
            <div className="flex gap-2 mt-1">
              <span className="text-white/70 text-xs bg-white/10 px-2 py-0.5 rounded-full">
                {currentVideo.category}
              </span>
              <span className="text-white/70 text-xs bg-white/10 px-2 py-0.5 rounded-full">
                {'★'.repeat(currentVideo.difficulty)}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Video counter */}
      <div className="absolute top-4 left-4 z-10">
        <span className="text-white/50 text-xs">
          {currentIndex + 1} / {videos.length}
        </span>
      </div>
    </div>
  )
}
```

**Step 4: Update Feed page**

Replace `src/app/(tabs)/page.tsx`:

```typescript
import { VideoFeed } from '@/components/VideoFeed'
import { seedVideos } from '@/data/seed-videos'

export default function FeedPage() {
  return <VideoFeed videos={seedVideos} />
}
```

**Step 5: Run build to verify**

```bash
npm run build
```

Expected: Build succeeds.

**Step 6: Commit**

```bash
git add src/components/VideoFeed.tsx src/components/VideoControls.tsx src/data/seed-videos.ts src/app/\(tabs\)/page.tsx
git commit -m "feat: add swipeable video feed with controls"
```

---

## Task 8: Section Repeat (Loop) Feature

**Files:**
- Create: `src/components/SubtitleTimeline.tsx`
- Modify: `src/components/VideoPlayer.tsx` (add long-press for loop + phrase save)

**Step 1: Create subtitle timeline for loop selection**

Create `src/components/SubtitleTimeline.tsx`:

```typescript
'use client'

import { usePlayerStore } from '@/stores/usePlayerStore'

interface SubtitleEntry {
  start: number
  end: number
  en: string
  ko: string
}

interface SubtitleTimelineProps {
  subtitles: SubtitleEntry[]
  onSavePhrase: (phrase: SubtitleEntry) => void
}

export function SubtitleTimeline({ subtitles, onSavePhrase }: SubtitleTimelineProps) {
  const { currentTime, setLoop, isLooping, loopStart, loopEnd } = usePlayerStore()

  return (
    <div className="absolute bottom-36 left-0 right-0 px-4 z-10">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-2">
        {subtitles.map((sub, idx) => {
          const isActive = currentTime >= sub.start && currentTime <= sub.end
          const isInLoop =
            isLooping &&
            loopStart !== null &&
            loopEnd !== null &&
            sub.start >= loopStart &&
            sub.end <= loopEnd

          return (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation()
                setLoop(sub.start, sub.end)
              }}
              onDoubleClick={(e) => {
                e.stopPropagation()
                onSavePhrase(sub)
              }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-all ${
                isActive
                  ? 'bg-blue-500 text-white scale-105'
                  : isInLoop
                  ? 'bg-blue-500/30 text-blue-300 ring-1 ring-blue-500/50'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              {sub.en.slice(0, 25)}{sub.en.length > 25 ? '...' : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 2: Update VideoPlayer to include timeline**

Add the import and SubtitleTimeline to `src/components/VideoPlayer.tsx`. Add this inside the component just before the closing `</div>`:

```typescript
// Add import at top:
// import { SubtitleTimeline } from './SubtitleTimeline'

// Add before closing </div> of the component:
<SubtitleTimeline
  subtitles={subtitles}
  onSavePhrase={(phrase) => onSavePhrase?.(phrase)}
/>
```

**Step 3: Commit**

```bash
git add src/components/SubtitleTimeline.tsx src/components/VideoPlayer.tsx
git commit -m "feat: add section repeat with subtitle timeline"
```

---

## Task 9: Phrase Save + My Learning Page

**Files:**
- Create: `src/stores/usePhraseStore.ts`
- Create: `src/components/SavedPhraseCard.tsx`
- Create: `src/components/SaveToast.tsx`
- Modify: `src/app/(tabs)/learning/page.tsx`
- Modify: `src/components/VideoFeed.tsx` (wire up save)

**Step 1: Create phrase store**

Create `src/stores/usePhraseStore.ts`:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SavedPhrase {
  id: string
  videoId: string
  videoTitle: string
  en: string
  ko: string
  timestampStart: number
  timestampEnd: number
  savedAt: number
  reviewCount: number
}

interface PhraseState {
  phrases: SavedPhrase[]
  savePhrase: (phrase: Omit<SavedPhrase, 'id' | 'savedAt' | 'reviewCount'>) => void
  removePhrase: (id: string) => void
  incrementReview: (id: string) => void
}

export const usePhraseStore = create<PhraseState>()(
  persist(
    (set) => ({
      phrases: [],

      savePhrase: (phrase) =>
        set((state) => ({
          phrases: [
            {
              ...phrase,
              id: crypto.randomUUID(),
              savedAt: Date.now(),
              reviewCount: 0,
            },
            ...state.phrases,
          ],
        })),

      removePhrase: (id) =>
        set((state) => ({
          phrases: state.phrases.filter((p) => p.id !== id),
        })),

      incrementReview: (id) =>
        set((state) => ({
          phrases: state.phrases.map((p) =>
            p.id === id ? { ...p, reviewCount: p.reviewCount + 1 } : p
          ),
        })),
    }),
    { name: 'studyeng-phrases' }
  )
)
```

**Step 2: Create save toast component**

Create `src/components/SaveToast.tsx`:

```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface SaveToastProps {
  show: boolean
  message: string
}

export function SaveToast({ show, message }: SaveToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

**Step 3: Create saved phrase card**

Create `src/components/SavedPhraseCard.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'
import type { SavedPhrase } from '@/stores/usePhraseStore'

interface SavedPhraseCardProps {
  phrase: SavedPhrase
  onDelete: () => void
}

export function SavedPhraseCard({ phrase, onDelete }: SavedPhraseCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="bg-white/5 border border-white/10 rounded-xl p-4"
    >
      <p className="text-white font-medium">{phrase.en}</p>
      <p className="text-gray-400 text-sm mt-1">{phrase.ko}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-gray-500 text-xs">
          {phrase.videoTitle} &middot; reviewed {phrase.reviewCount}x
        </span>
        <button
          onClick={onDelete}
          className="text-red-400/60 text-xs hover:text-red-400"
        >
          Delete
        </button>
      </div>
    </motion.div>
  )
}
```

**Step 4: Build My Learning page**

Replace `src/app/(tabs)/learning/page.tsx`:

```typescript
'use client'

import { AnimatePresence } from 'framer-motion'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { SavedPhraseCard } from '@/components/SavedPhraseCard'

export default function LearningPage() {
  const { phrases, removePhrase } = usePhraseStore()

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        <h1 className="text-white text-2xl font-bold mb-1">My Learning</h1>
        <p className="text-gray-500 text-sm mb-6">
          {phrases.length} phrases saved
        </p>

        {phrases.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No saved phrases yet</p>
            <p className="text-gray-600 text-sm mt-2">
              Double-tap subtitles in videos to save them here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {phrases.map((phrase) => (
                <SavedPhraseCard
                  key={phrase.id}
                  phrase={phrase}
                  onDelete={() => removePhrase(phrase.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 5: Wire up save in VideoFeed**

Update `src/components/VideoFeed.tsx` — add phrase saving to VideoPlayer's `onSavePhrase`. Add state and the SaveToast:

```typescript
// Add imports:
// import { usePhraseStore } from '@/stores/usePhraseStore'
// import { SaveToast } from './SaveToast'

// Inside VideoFeed component, add:
// const savePhrase = usePhraseStore((s) => s.savePhrase)
// const [showToast, setShowToast] = useState(false)

// Add onSavePhrase handler to VideoPlayer:
// onSavePhrase={(phrase) => {
//   savePhrase({
//     videoId: currentVideo.id,
//     videoTitle: currentVideo.title,
//     en: phrase.en,
//     ko: phrase.ko,
//     timestampStart: phrase.start,
//     timestampEnd: phrase.end,
//   })
//   setShowToast(true)
//   setTimeout(() => setShowToast(false), 2000)
// }}

// Add <SaveToast show={showToast} message="Phrase saved!" /> in the JSX
```

**Step 6: Commit**

```bash
git add src/stores/usePhraseStore.ts src/components/SaveToast.tsx src/components/SavedPhraseCard.tsx src/app/\(tabs\)/learning/page.tsx src/components/VideoFeed.tsx
git commit -m "feat: add phrase saving and My Learning page"
```

---

## Task 10: Fill-in-the-Blank Game

**Files:**
- Create: `src/lib/games/fill-blank.ts`
- Create: `src/lib/games/fill-blank.test.ts`
- Create: `src/components/games/FillBlankGame.tsx`
- Create: `src/components/games/GameResult.tsx`

**Step 1: Write fill-blank logic test**

Create `src/lib/games/fill-blank.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { generateFillBlank } from './fill-blank'

describe('generateFillBlank', () => {
  it('creates a question from a subtitle', () => {
    const result = generateFillBlank({
      en: 'Can I get a coffee please',
      ko: '커피 한 잔 주실 수 있나요',
    })

    expect(result.sentence).toContain('___')
    expect(result.correctAnswer).toBeTruthy()
    expect(result.options).toContain(result.correctAnswer)
    expect(result.options.length).toBe(4)
  })

  it('removes the blank word from the sentence', () => {
    const result = generateFillBlank({
      en: 'Hello world',
      ko: '안녕 세상',
    })

    expect(result.sentence).not.toContain(result.correctAnswer)
  })

  it('generates 4 unique options', () => {
    const result = generateFillBlank({
      en: 'The quick brown fox jumps over the lazy dog',
      ko: '빠른 갈색 여우가 게으른 개를 뛰어넘다',
    })

    const unique = new Set(result.options)
    expect(unique.size).toBe(4)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/lib/games/fill-blank.test.ts
```

Expected: FAIL.

**Step 3: Implement fill-blank logic**

Create `src/lib/games/fill-blank.ts`:

```typescript
const commonWords = [
  'the', 'a', 'is', 'are', 'was', 'were', 'have', 'has', 'do', 'does',
  'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must',
  'go', 'come', 'make', 'take', 'get', 'give', 'know', 'think', 'see',
  'want', 'look', 'use', 'find', 'tell', 'ask', 'work', 'seem', 'feel',
  'try', 'leave', 'call', 'good', 'new', 'first', 'last', 'long', 'great',
  'little', 'just', 'like', 'time', 'very', 'when', 'what', 'your', 'about',
]

interface FillBlankInput {
  en: string
  ko: string
}

interface FillBlankQuestion {
  sentence: string
  correctAnswer: string
  options: string[]
  koreanHint: string
}

export function generateFillBlank(input: FillBlankInput): FillBlankQuestion {
  const words = input.en.split(/\s+/).filter((w) => w.length > 0)

  // Pick a meaningful word (not too short, prefer content words)
  const candidates = words.filter((w) => w.replace(/[^a-zA-Z]/g, '').length >= 3)
  const targetWord = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : words[Math.floor(Math.random() * words.length)]

  const cleanTarget = targetWord.replace(/[^a-zA-Z']/g, '').toLowerCase()

  // Create sentence with blank
  const sentence = input.en.replace(targetWord, '___')

  // Generate distractors
  const distractors = generateDistractors(cleanTarget, 3)
  const options = shuffle([cleanTarget, ...distractors])

  return {
    sentence,
    correctAnswer: cleanTarget,
    options,
    koreanHint: input.ko,
  }
}

function generateDistractors(correct: string, count: number): string[] {
  const pool = commonWords.filter(
    (w) => w !== correct.toLowerCase() && Math.abs(w.length - correct.length) <= 3
  )

  const selected: string[] = []
  const used = new Set<string>([correct.toLowerCase()])

  while (selected.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length)
    const word = pool[idx]
    if (!used.has(word)) {
      selected.push(word)
      used.add(word)
    }
    pool.splice(idx, 1)
  }

  // Fill remaining with random common words if needed
  while (selected.length < count) {
    const fallback = `word${selected.length + 1}`
    selected.push(fallback)
  }

  return selected
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/lib/games/fill-blank.test.ts
```

Expected: All 3 tests PASS.

**Step 5: Create GameResult component**

Create `src/components/games/GameResult.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'

interface GameResultProps {
  correct: boolean
  xpEarned: number
  onContinue: () => void
}

export function GameResult({ correct, xpEarned, onContinue }: GameResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onContinue}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, delay: 0.1 }}
          className="text-6xl mb-4"
        >
          {correct ? '🎉' : '💪'}
        </motion.div>
        <p className="text-white text-2xl font-bold mb-2">
          {correct ? 'Nice!' : 'Almost!'}
        </p>
        {correct && xpEarned > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-yellow-400 font-bold text-lg"
          >
            +{xpEarned} XP
          </motion.p>
        )}
        <p className="text-gray-400 text-sm mt-4">Tap to continue</p>
      </motion.div>
    </motion.div>
  )
}
```

**Step 6: Create FillBlankGame component**

Create `src/components/games/FillBlankGame.tsx`:

```typescript
'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { generateFillBlank } from '@/lib/games/fill-blank'
import { GameResult } from './GameResult'
import { useUserStore } from '@/stores/useUserStore'

interface FillBlankGameProps {
  subtitle: { en: string; ko: string }
  onComplete: (correct: boolean) => void
}

export function FillBlankGame({ subtitle, onComplete }: FillBlankGameProps) {
  const question = useMemo(() => generateFillBlank(subtitle), [subtitle])
  const [selected, setSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const gainXp = useUserStore((s) => s.gainXp)

  const isCorrect = selected === question.correctAnswer
  const xpEarned = isCorrect ? 10 : 0

  const handleSelect = (option: string) => {
    if (selected) return
    setSelected(option)
    if (option === question.correctAnswer) {
      gainXp(10)
    }
    setTimeout(() => setShowResult(true), 500)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-8">
        Fill in the blank
      </p>

      <p className="text-white text-xl font-medium text-center leading-relaxed mb-4">
        {question.sentence}
      </p>

      <p className="text-gray-500 text-sm mb-10">{question.koreanHint}</p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {question.options.map((option) => {
          let bg = 'bg-white/10'
          if (selected) {
            if (option === question.correctAnswer) bg = 'bg-green-500/80'
            else if (option === selected) bg = 'bg-red-500/80'
          }

          return (
            <motion.button
              key={option}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(option)}
              disabled={selected !== null}
              className={`${bg} text-white py-3 px-4 rounded-xl text-center font-medium transition-colors`}
            >
              {option}
            </motion.button>
          )
        })}
      </div>

      {showResult && (
        <GameResult
          correct={isCorrect}
          xpEarned={xpEarned}
          onContinue={() => onComplete(isCorrect)}
        />
      )}
    </div>
  )
}
```

**Step 7: Commit**

```bash
git add src/lib/games/ src/components/games/
git commit -m "feat: add fill-in-the-blank game with XP rewards"
```

---

## Task 11: Sentence Puzzle Game

**Files:**
- Create: `src/lib/games/sentence-puzzle.ts`
- Create: `src/lib/games/sentence-puzzle.test.ts`
- Create: `src/components/games/SentencePuzzleGame.tsx`

**Step 1: Write sentence puzzle logic test**

Create `src/lib/games/sentence-puzzle.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { generateSentencePuzzle } from './sentence-puzzle'

describe('generateSentencePuzzle', () => {
  it('shuffles words from the original sentence', () => {
    const result = generateSentencePuzzle('Can I get a coffee please')

    expect(result.correctOrder).toEqual(['Can', 'I', 'get', 'a', 'coffee', 'please'])
    expect(result.shuffledWords).toHaveLength(6)
    expect(new Set(result.shuffledWords)).toEqual(new Set(result.correctOrder))
  })

  it('validates correct answer', () => {
    const result = generateSentencePuzzle('Hello world')
    expect(result.checkAnswer(['Hello', 'world'])).toBe(true)
    expect(result.checkAnswer(['world', 'Hello'])).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/lib/games/sentence-puzzle.test.ts
```

Expected: FAIL.

**Step 3: Implement sentence puzzle logic**

Create `src/lib/games/sentence-puzzle.ts`:

```typescript
interface SentencePuzzle {
  correctOrder: string[]
  shuffledWords: string[]
  checkAnswer: (attempt: string[]) => boolean
}

export function generateSentencePuzzle(sentence: string): SentencePuzzle {
  const correctOrder = sentence.split(/\s+/).filter((w) => w.length > 0)

  let shuffledWords = [...correctOrder]
  // Ensure shuffle is different from original
  for (let attempts = 0; attempts < 10; attempts++) {
    shuffledWords = shuffle(shuffledWords)
    if (shuffledWords.some((w, i) => w !== correctOrder[i])) break
  }

  return {
    correctOrder,
    shuffledWords,
    checkAnswer: (attempt: string[]) => {
      if (attempt.length !== correctOrder.length) return false
      return attempt.every((word, i) => word === correctOrder[i])
    },
  }
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/lib/games/sentence-puzzle.test.ts
```

Expected: All tests PASS.

**Step 5: Create SentencePuzzleGame component**

Create `src/components/games/SentencePuzzleGame.tsx`:

```typescript
'use client'

import { useState, useMemo } from 'react'
import { motion, Reorder } from 'framer-motion'
import { generateSentencePuzzle } from '@/lib/games/sentence-puzzle'
import { GameResult } from './GameResult'
import { useUserStore } from '@/stores/useUserStore'

interface SentencePuzzleGameProps {
  subtitle: { en: string; ko: string }
  onComplete: (correct: boolean) => void
}

export function SentencePuzzleGame({ subtitle, onComplete }: SentencePuzzleGameProps) {
  const puzzle = useMemo(() => generateSentencePuzzle(subtitle.en), [subtitle])
  const [words, setWords] = useState(puzzle.shuffledWords)
  const [submitted, setSubmitted] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const gainXp = useUserStore((s) => s.gainXp)

  const isCorrect = submitted ? puzzle.checkAnswer(words) : false
  const xpEarned = isCorrect ? 15 : 0

  const handleSubmit = () => {
    setSubmitted(true)
    if (puzzle.checkAnswer(words)) {
      gainXp(15)
    }
    setTimeout(() => setShowResult(true), 500)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-8">
        Arrange the words
      </p>

      <p className="text-gray-500 text-sm mb-10">{subtitle.ko}</p>

      {/* Draggable word area */}
      <Reorder.Group
        axis="x"
        values={words}
        onReorder={submitted ? () => {} : setWords}
        className="flex flex-wrap gap-2 justify-center mb-10 min-h-[60px]"
      >
        {words.map((word) => (
          <Reorder.Item
            key={word}
            value={word}
            whileDrag={{ scale: 1.1, zIndex: 10 }}
            className={`px-4 py-2 rounded-lg font-medium cursor-grab active:cursor-grabbing select-none ${
              submitted
                ? isCorrect
                  ? 'bg-green-500/80 text-white'
                  : 'bg-red-500/80 text-white'
                : 'bg-white/10 text-white'
            }`}
          >
            {word}
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {!submitted && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-8 py-3 rounded-full font-medium"
        >
          Check
        </motion.button>
      )}

      {showResult && (
        <GameResult
          correct={isCorrect}
          xpEarned={xpEarned}
          onContinue={() => onComplete(isCorrect)}
        />
      )}
    </div>
  )
}
```

**Step 6: Commit**

```bash
git add src/lib/games/sentence-puzzle.ts src/lib/games/sentence-puzzle.test.ts src/components/games/SentencePuzzleGame.tsx
git commit -m "feat: add sentence puzzle drag-and-drop game"
```

---

## Task 12: Game Integration in Learning Page

**Files:**
- Create: `src/components/games/GameLauncher.tsx`
- Modify: `src/app/(tabs)/learning/page.tsx`

**Step 1: Create game launcher**

Create `src/components/games/GameLauncher.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FillBlankGame } from './FillBlankGame'
import { SentencePuzzleGame } from './SentencePuzzleGame'
import type { SavedPhrase } from '@/stores/usePhraseStore'

type GameType = 'fill-blank' | 'sentence-puzzle'

interface GameLauncherProps {
  phrases: SavedPhrase[]
}

export function GameLauncher({ phrases }: GameLauncherProps) {
  const [activeGame, setActiveGame] = useState<GameType | null>(null)
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0)

  if (phrases.length === 0) return null

  const currentPhrase = phrases[currentPhraseIdx % phrases.length]
  const subtitle = { en: currentPhrase.en, ko: currentPhrase.ko }

  const handleComplete = () => {
    setCurrentPhraseIdx((prev) => prev + 1)
    setActiveGame(null)
  }

  return (
    <>
      {/* Game selection buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveGame('fill-blank')}
          className="flex-1 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl p-4 text-left"
        >
          <span className="text-2xl mb-2 block">🎯</span>
          <span className="text-white font-medium text-sm">Fill in Blank</span>
          <span className="text-gray-400 text-xs block mt-1">Tap the missing word</span>
        </button>
        <button
          onClick={() => setActiveGame('sentence-puzzle')}
          className="flex-1 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-4 text-left"
        >
          <span className="text-2xl mb-2 block">🔀</span>
          <span className="text-white font-medium text-sm">Word Puzzle</span>
          <span className="text-gray-400 text-xs block mt-1">Build the sentence</span>
        </button>
      </div>

      {/* Active game overlay */}
      <AnimatePresence>
        {activeGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black"
          >
            {/* Close button */}
            <button
              onClick={() => setActiveGame(null)}
              className="absolute top-4 right-4 z-50 text-white/60 bg-white/10 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            {activeGame === 'fill-blank' && (
              <FillBlankGame subtitle={subtitle} onComplete={handleComplete} />
            )}
            {activeGame === 'sentence-puzzle' && (
              <SentencePuzzleGame subtitle={subtitle} onComplete={handleComplete} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

**Step 2: Update Learning page to include game launcher**

Replace `src/app/(tabs)/learning/page.tsx`:

```typescript
'use client'

import { AnimatePresence } from 'framer-motion'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { SavedPhraseCard } from '@/components/SavedPhraseCard'
import { GameLauncher } from '@/components/games/GameLauncher'

export default function LearningPage() {
  const { phrases, removePhrase } = usePhraseStore()

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        <h1 className="text-white text-2xl font-bold mb-1">My Learning</h1>
        <p className="text-gray-500 text-sm mb-6">
          {phrases.length} phrases saved
        </p>

        {/* Games section */}
        <GameLauncher phrases={phrases} />

        {/* Saved phrases list */}
        {phrases.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No saved phrases yet</p>
            <p className="text-gray-600 text-sm mt-2">
              Double-tap subtitles in videos to save them here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {phrases.map((phrase) => (
                <SavedPhraseCard
                  key={phrase.id}
                  phrase={phrase}
                  onDelete={() => removePhrase(phrase.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 3: Run all tests**

```bash
npm run test:run
```

Expected: All tests PASS.

**Step 4: Commit**

```bash
git add src/components/games/GameLauncher.tsx src/app/\(tabs\)/learning/page.tsx
git commit -m "feat: integrate games into My Learning page"
```

---

## Task 13: Explore Page

**Files:**
- Modify: `src/app/(tabs)/explore/page.tsx`
- Create: `src/components/VideoCard.tsx`

**Step 1: Create video card component**

Create `src/components/VideoCard.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'
import type { VideoData } from '@/data/seed-videos'

interface VideoCardProps {
  video: VideoData
  onClick: () => void
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden text-left w-full"
    >
      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <span className="text-4xl">▶</span>
      </div>
      <div className="p-3">
        <p className="text-white font-medium text-sm line-clamp-2">{video.title}</p>
        <div className="flex gap-2 mt-2">
          <span className="text-gray-400 text-xs bg-white/5 px-2 py-0.5 rounded-full">
            {video.category}
          </span>
          <span className="text-yellow-400 text-xs">
            {'★'.repeat(video.difficulty)}{'☆'.repeat(5 - video.difficulty)}
          </span>
        </div>
      </div>
    </motion.button>
  )
}
```

**Step 2: Build Explore page**

Replace `src/app/(tabs)/explore/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { seedVideos } from '@/data/seed-videos'
import { VideoCard } from '@/components/VideoCard'

const categories = ['all', 'daily', 'travel', 'business']

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const router = useRouter()

  const filtered =
    activeCategory === 'all'
      ? seedVideos
      : seedVideos.filter((v) => v.category === activeCategory)

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        <h1 className="text-white text-2xl font-bold mb-4">Explore</h1>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Video grid */}
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => router.push(`/?v=${video.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/VideoCard.tsx src/app/\(tabs\)/explore/page.tsx
git commit -m "feat: add Explore page with category filtering"
```

---

## Task 14: Profile Page with Streak/XP

**Files:**
- Modify: `src/app/(tabs)/profile/page.tsx`
- Create: `src/components/StreakDisplay.tsx`
- Create: `src/components/LevelUpModal.tsx`

**Step 1: Create streak display**

Create `src/components/StreakDisplay.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'

interface StreakDisplayProps {
  days: number
}

export function StreakDisplay({ days }: StreakDisplayProps) {
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">🔥</span>
        <div>
          <p className="text-white text-2xl font-bold">{days} days</p>
          <p className="text-orange-300/70 text-xs">Keep it going!</p>
        </div>
      </div>
      <div className="flex justify-between">
        {weekDays.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                i < (days % 7)
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/5 text-gray-500'
              }`}
            >
              {i < (days % 7) ? '✓' : day}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Create level-up modal**

Create `src/components/LevelUpModal.tsx`:

```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/stores/useUserStore'

export function LevelUpModal() {
  const { level, showLevelUp, dismissLevelUp } = useUserStore()

  return (
    <AnimatePresence>
      {showLevelUp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismissLevelUp}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', damping: 12 }}
            className="text-center"
          >
            <p className="text-6xl mb-4">🎊</p>
            <p className="text-white text-3xl font-bold mb-2">Level Up!</p>
            <p className="text-yellow-400 text-5xl font-black">{level}</p>
            <p className="text-gray-400 text-sm mt-4">Tap to continue</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

**Step 3: Build Profile page**

Replace `src/app/(tabs)/profile/page.tsx`:

```typescript
'use client'

import { useUserStore } from '@/stores/useUserStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useAuth } from '@/hooks/useAuth'
import { StreakDisplay } from '@/components/StreakDisplay'
import { calculateXpForLevel } from '@/lib/gamification'

export default function ProfilePage() {
  const { level, xp, streakDays } = useUserStore()
  const phraseCount = usePhraseStore((s) => s.phrases.length)
  const { user, signInWithGoogle, signOut, loading } = useAuth()

  const xpForNextLevel = calculateXpForLevel(level)
  const xpProgress = (xp / xpForNextLevel) * 100

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        {/* User info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="avatar"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              '👤'
            )}
          </div>
          <div>
            <p className="text-white font-bold text-lg">
              {user?.user_metadata?.full_name ?? 'Guest'}
            </p>
            <p className="text-gray-400 text-sm">Level {level}</p>
          </div>
        </div>

        {/* XP progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>XP</span>
            <span>{xp} / {xpForNextLevel}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        {/* Streak */}
        <StreakDisplay days={streakDays} />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-white text-2xl font-bold">{phraseCount}</p>
            <p className="text-gray-400 text-xs">Saved Phrases</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-white text-2xl font-bold">{level}</p>
            <p className="text-gray-400 text-xs">Current Level</p>
          </div>
        </div>

        {/* Auth button */}
        <div className="mt-8">
          {loading ? null : user ? (
            <button
              onClick={signOut}
              className="w-full py-3 bg-white/5 text-gray-400 rounded-xl text-sm"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="w-full py-3 bg-white text-black rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Add LevelUpModal to tabs layout**

Update `src/app/(tabs)/layout.tsx` — add the LevelUpModal:

```typescript
import { BottomNav } from '@/components/BottomNav'
import { LevelUpModal } from '@/components/LevelUpModal'

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-dvh flex flex-col">
      <main className="flex-1 overflow-hidden">{children}</main>
      <BottomNav />
      <LevelUpModal />
    </div>
  )
}
```

**Step 5: Run all tests and build**

```bash
npm run test:run && npm run build
```

Expected: All tests pass, build succeeds.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Profile page with streak, XP, and level-up animation"
```

---

## Task 15: Login Gate + Final Polish

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/components/OnboardingScreen.tsx`

**Step 1: Create login page**

Create `src/app/login/page.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) router.replace('/')
  }, [user, loading, router])

  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-black px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-5xl font-black text-white mb-2">StudyEng</h1>
        <p className="text-gray-400 text-lg mb-12">Learn English the Fun Way</p>

        <div className="space-y-4 w-full max-w-sm">
          <button
            onClick={signInWithGoogle}
            className="w-full py-3.5 bg-white text-black rounded-xl font-medium flex items-center justify-center gap-2 text-base"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full py-3.5 bg-white/5 text-gray-400 rounded-xl text-base"
          >
            Try as Guest
          </button>
        </div>

        <p className="text-gray-600 text-xs mt-8">
          By continuing, you agree to our Terms of Service
        </p>
      </motion.div>
    </div>
  )
}
```

**Step 2: Run final build**

```bash
npm run test:run && npm run build
```

Expected: All tests pass, build succeeds.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: add login page with Google OAuth and guest mode"
```

---

## Summary

| Task | What it builds | Key files |
|------|---------------|-----------|
| 1 | Project scaffolding | package.json, configs |
| 2 | Database schema | prisma/schema.prisma |
| 3 | Auth (Google OAuth) | src/lib/supabase/, src/hooks/useAuth.ts |
| 4 | Layout + Bottom Nav | src/components/BottomNav.tsx, tabs layout |
| 5 | XP/Streak logic + Stores | src/lib/gamification.ts, src/stores/ |
| 6 | YouTube Player | src/components/VideoPlayer.tsx |
| 7 | Swipeable Feed | src/components/VideoFeed.tsx |
| 8 | Section Repeat | src/components/SubtitleTimeline.tsx |
| 9 | Phrase Save + Learning | src/stores/usePhraseStore.ts |
| 10 | Fill-in-Blank Game | src/lib/games/fill-blank.ts |
| 11 | Sentence Puzzle Game | src/lib/games/sentence-puzzle.ts |
| 12 | Game Integration | src/components/games/GameLauncher.tsx |
| 13 | Explore Page | src/app/(tabs)/explore/page.tsx |
| 14 | Profile + Gamification | src/app/(tabs)/profile/page.tsx |
| 15 | Login + Polish | src/app/login/page.tsx |
