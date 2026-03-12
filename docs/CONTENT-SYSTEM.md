# Content System

StudyEng의 핵심 운영 기준은 `영상 메타데이터`, `클립 타이밍`, `영문 자막`, `한글 자막`, `whisper 처리 여부`, `검수 필요 여부`를 한 곳에서 같이 보는 것이다.

## Source of Truth

- 영상/시리즈 메타데이터: `src/data/seed-videos.ts`
- 자막 결과물: `public/transcripts/{youtubeId}.json`
- Whisper 처리 이력: `scripts/whisper-manifest.json`
- 통합 관리 레지스트리: `src/data/content-manifest.json`
- 운영 리포트: `docs/reports/content-system-report.md`

## Commands

```bash
npm run content:autodetect
npm run content:batch:snapshot
npm run content:sync
npm run content:queue -- --queue=needs_whisper
npm run content:queue -- --queue=needs_translation
npm run content:queue -- --queue=needs_timing_review
npm run content:queue -- --queue=needs_clip_review --scope=videos
npm run content:triage -- --report=path/to/admin-report-bundle.json
npm run transcripts:translate:openai
npm run transcripts:check
```

## Workflow Status

### Asset workflow

- `needs_whisper`: Whisper가 아직 안 돌았거나, 정적 자막 파일이 아직 Whisper 기준으로 정리되지 않음
- `needs_translation`: 영문 자막은 있지만 한글 자막이 비어 있거나 일부만 채워짐
- `needs_timing_review`: 영문/한글 자막은 있으나 길이, gap, overlap 같은 품질 규칙 위반이 있음
- `orphaned`: transcript 파일은 있는데 `seed-videos.ts`와 연결되지 않아 앱에서 추적 불가
- `ready`: Whisper, 한글 자막, 품질 규칙까지 통과

## Auto Detect

- 설정 파일: `src/data/content-pipeline-config.json`
- 기본값은 `autoDetectNewVideos: false`, `autoProcessNewVideos: false`
- 즉, 새 영상 감지 기능은 구현돼 있지만 기본 비활성 상태다.
- `npm run content:autodetect`를 실행하면 현재 시드 기준 미처리 후보만 보여준다.

## Existing Batch Freeze

- `npm run content:batch:snapshot`를 실행하면 현재 backlog를 `src/data/content-existing-batch.json`에 고정한다.
- 이후 `whisper`나 `번역`을 돌릴 때 `--ids-file=src/data/content-existing-batch.json`를 쓰면, 그 시점 이후에 추가된 영상은 건드리지 않고 현재 backlog만 처리할 수 있다.

### Video workflow

- `needs_metadata`: category 또는 series 연결이 깨져 있음
- `needs_clip_review`: `clipStart`/`clipEnd` 길이가 45~70초 범위를 벗어남
- 나머지는 연결된 asset workflow를 그대로 상속

## Rules

### Clip duration

- 허용 범위: 45~70초
- 이상적 범위: 50~65초

### Subtitle quality (기본 제약)

- 자막 한 칸 길이 최대: 7초 (단, 긴 단일 문장 예외 허용)
- 영문 자막 길이 최대: 120자
- 인접 자막 gap 최대: 2초
- overlap 금지
- `needs_timing_review`는 자동 폐기가 아니라 검수 큐로 본다.

### Subtitle Segmentation Rules (핵심 규칙)

> **원칙**: 자막 한 세그먼트 = 화면에 한 번에 보여줄 자연스러운 단위.
> 학생이 영상을 보며 "지금 말하고 있는 것"을 읽을 수 있어야 한다.
> 아직 말하지 않은 문장이 미리 보이거나, 너무 빨리 사라지면 학습 경험이 깨진다.

#### Case A: 다문장 세그먼트 — 긴 경우 (2+문장, >3초)

- **조치**: 문장별로 쪼갠다.
- **예외**: 쪼갠 결과 세그먼트가 1.5초 미만이면 짧은 것끼리 묶어둔다.
- **예시**: "I have a secret. Come closer. Listen carefully." (6초) → 3개 세그먼트 (각 ~2초)

#### Case B: 다문장 세그먼트 — 짧은 경우 (2+문장, ≤3초)

- **조치**: 유지. 빠른 대화/감탄사라 쪼개면 읽기 전에 사라진다.
- **예시**: "Stop! Don't! No!" (2초) → 그대로 유지

#### Case C: 한 문장이 매우 긴 경우 (1문장, >8초)

- **조치**: 자연스러운 절 경계에서 쪼갠다.
  - 좋은 분리점: ", and" / ", but" / ", because" / ", which" / ", so" 등 접속사 앞 쉼표
  - 나쁜 분리점: 단순 나열 쉼표 ("Medicine, law, business" → 쪼개면 안 됨)
- **조건**: 쪼갠 각 절이 3초 이상 확보될 때만.
- **예시**: "We read and write poetry because we are members of the human race, and the human race is filled with passion." (9초) → ", and" 에서 분리 → 2개 세그먼트 (각 ~4.5초)

#### Case D: 한 문장이 긴 경우 (1문장, 5-8초)

- **조치**: 6초 이상이면서 명확한 절 경계가 있을 때만 쪼갬. 아니면 유지.
- **판단 기준**: 문장이 복문(주절+종속절)이고 각 절이 충분한 길이일 때만.
- **유지 예시**: "So it is true." (7초, 짧은 문장 + 앞뒤 침묵) → 유지
- **분리 예시**: "I'm not going to do that number two in cotton, because that would be absolutely ridiculous." (7초) → ", because" 에서 분리

#### Case E/F: 한 문장 정상 길이 (1문장, <5초)

- **조치**: 변경 없음. 이상적인 상태.

#### Case G: 파편 세그먼트 (≤2단어, <1.5초)

- **조치**: 인접 세그먼트 중 문맥상 자연스러운 쪽에 병합.
- **방향 판단**: 이전 세그먼트의 끝이 문장 완결이 아니면 이전에 병합. 아니면 다음에 병합.
- **예시**: "Yes." (0.8초) → 앞 세그먼트가 "Is that true?"이면 → 뒤에 남기거나 앞에 병합

#### Case H: 음악/효과음 세그먼트

- **조치**: 건너뜀. ♪, [music], [applause] 등은 세그멘테이션 대상이 아님.

#### Case I: 노래 가사

- **조치**: verse line 단위로 세그멘테이션. 한 줄에 한 가사 라인.
- **특이점**: 가사는 문장 부호가 없어도 한 줄이 하나의 자연스러운 단위.
- **다문장 가사**: "I love you. And I always will." → 한 줄이면 유지, 별도 verse line이면 분리

#### 공통 규칙

1. **최소 세그먼트 길이**: 1초 미만 세그먼트 생성 금지
2. **타이밍 분배**: 세그먼트를 쪼갤 때 글자 수 비율로 시간 분배
   - 예: start=10, end=20 (10초), 총 100글자, 첫 문장 40글자 → 첫: 10-14초, 둘째: 14-20초
3. **ko 번역 분리**: en을 쪼갤 때 ko도 대응하는 문장 경계에서 분리
   - ko가 1문장인데 en이 2문장이면 → AI가 ko를 자연스럽게 분리하거나, 분리 불가하면 쪼개지 않음
4. **약어 주의**: "Dr. Smith", "Mr. and Mrs.", "U.S. Government" 내부의 마침표는 문장 경계가 아님
5. **인용문 주의**: "She said, 'I love you.' And he smiled." — 인용문 안 마침표 다음이 바로 문장 경계는 아닐 수 있음
6. **중복 세그먼트**: 동일 텍스트가 연속으로 나오면 하나만 남기고 제거
7. **expression-index 리매핑**: 세그멘테이션 변경 후 반드시 `expression-index-v2.json`의 sentenceIdx를 리매핑해야 함

#### 판단이 필요한 이유 (스크립트가 아닌 AI 에이전트 사용)

- 문장 경계 판별: "Dr. Smith" vs "I agree. Smith is right." — 같은 마침표+대문자이지만 전자는 약어, 후자는 문장 경계
- 절 분리점 선택: 모든 쉼표가 분리점이 아님. 접속사 앞 쉼표만 유효
- ko 번역 분리: 한국어 문장 구조가 영어와 다르므로 AI 판단 필요
- 빠른 대화 판단: "Ow! Stop!" — 감탄사 연속인지, 독립 문장인지 문맥 판단
- 노래 vs 대화 구분: 같은 텍스트라도 노래 가사와 대화는 다른 규칙 적용

## Subtitle Processing Pipeline (재현 가능한 파이프라인)

새 영상을 추가하거나 기존 영상 자막을 재처리할 때 아래 순서를 따른다.

### Step 1: Whisper 전사 (영어)

- **도구**: Groq Whisper API (`whisper-large-v3`) 또는 OpenAI Whisper API
- **스크립트**: `scripts/whisper-regenerate.mjs`
- **입력**: YouTube ID → yt-dlp로 오디오 다운로드 → Whisper 전사
- **출력**: `public/transcripts/{youtubeId}.json` (`[{start, end, en, ko:""}]`)
- **이력 관리**: `scripts/whisper-manifest.json`에 처리 완료 기록 (중복 방지)
- **주의**: YouTube 자막에 의존하지 않는다. 반드시 Whisper 사용.

### Step 2: 한글 번역

- **도구**: Claude 에이전트 (직접 번역) 또는 OpenAI (`gpt-4o-mini`)
- **스크립트**: `scripts/generate-transcripts.mjs` (Claude) / `scripts/translate-transcripts-openai.mjs` (OpenAI)
- **동작**: `ko` 필드가 비어있는 세그먼트만 번역
- **주의**: Groq LLM 번역 사용 금지 (외국어 혼입 문제)

### Step 3: 재세그멘테이션 (AI 에이전트)

> 스크립트가 아닌 AI 에이전트로 처리. 문장 경계 판단, 약어 구분, ko 분리 등 맥락 판단 필요.

- **규칙**: 위 "Subtitle Segmentation Rules" 섹션의 Cases A-I 적용
- **실행 방법**:
  1. 대상 파일 목록 확보 (audit 스크립트로 multi-sentence / punctuation 이슈 탐지)
  2. 5개 이하 에이전트에 배치 분배 (에이전트당 7-8파일)
  3. 에이전트 프롬프트에 Cases A-I 전체 규칙 + 타이밍/ko 분리 규칙 포함
  4. 결과 검토: 에이전트가 보수적으로 처리한 케이스 확인 (특히 짧은 문장 그룹핑)
- **audit 스크립트**: `scripts/audit-shorts.mjs` (파일 목록만 바꾸면 범용 사용 가능)
- **주의사항**:
  - 에이전트가 "1.5초 미만이라 안 쪼갰다"고 하면 → 2-3문장씩 그룹핑하도록 재지시
  - 한 번에 5개 에이전트까지만 (플랫폼 제한)
  - 처리 후 반드시 Step 4~6 수행

### Step 4: Expression Index 리빌드

- **스크립트**: `scripts/rebuild-expression-index.mjs`
- **동작**: 세그멘테이션 변경으로 sentenceIdx가 어긋난 expression-index-v2.json을 재매핑
- **매칭 전략** (4단계 fallback):
  1. Exact match: 이전 en 텍스트 === 현재 세그먼트 en
  2. Substring match: 이전 en이 현재 세그먼트의 부분문자열 (병합 케이스)
  3. Reverse substring: 현재 세그먼트가 이전 en의 부분문자열 (분할 케이스)
  4. Canonical match: expression의 canonical form이 세그먼트에 포함
- **실행**: `node scripts/rebuild-expression-index.mjs` (--dry-run으로 먼저 확인 가능)

### Step 5: 타이밍 검증 & 수정

- **검증 항목**:
  - overlap: 현재 세그먼트 start < 이전 세그먼트 end
  - bad order: 세그먼트 start >= end
  - gap: 인접 세그먼트 간 2초 초과 gap
- **수정 방법**: overlap 발견 시 현재 세그먼트 start를 이전 세그먼트 end로 snap
- **검증 스크립트**: Node one-liner로 전체 파일 스캔 (파이프라인 실행 시 매번 확인)

### Step 6: QA Audit

- **검증**: audit 스크립트 재실행으로 잔여 이슈 확인
  - multi-sentence 세그먼트 잔여 수
  - 구두점 누락 잔여 수
  - ko 번역 누락 수
- **기준**: 잔여 multi-sentence는 Case B (≤3초 빠른 대화)만 허용

### Step 7: Git Push

- **순서**: `git add public/transcripts/ src/data/expression-index-v2.json` → commit → push
- **주의**: `git add public/transcripts/` (디렉토리 단위, glob 사용 시 argument list too long 에러)

### Pipeline 적용 범위

| 대상 | Step 1 | Step 2 | Step 3 | Step 4 | Step 5 | Step 6 | Step 7 |
|------|--------|--------|--------|--------|--------|--------|--------|
| 신규 영상 (clip) | O | O | O | O | O | O | O |
| 신규 영상 (shorts) | O | O | O | O | O | O | O |
| 기존 영상 자막 수정 | - | - | O | O | O | O | O |
| expression 사전 변경 | - | - | - | O | - | - | O |

## 운영 원칙

- Whisper가 이미 기록된 `youtubeId`는 다시 돌리지 않는다.
- 한글 자막이 이미 모두 채워진 asset은 번역 큐에 다시 넣지 않는다.
- 검수는 항상 `content-manifest.json` 기준으로 큐를 잘라서 진행한다.
- 1000개 목표 확장은 `videos` 개수와 `series` 분포를 같이 보면서 진행한다.

## OpenAI Translation

- `scripts/translate-transcripts-openai.mjs`는 `OPENAI_API_KEY`를 사용해 누락된 `ko`만 채운다.
- 모델 기본값은 `gpt-4o-mini`다. OpenAI 공식 문서 기준 이 모델은 `v1/chat/completions`와 `v1/responses`를 지원하고, 비용도 더 낮다.
- 실행 전 `OPENAI_API_KEY`를 환경변수나 `.env` / `.env.local`에 넣어야 한다.

## Reviewed Exceptions

- `src/data/content-review-registry.json` stores audited exceptions that should not keep the backlog open.
- `acceptedIssueOverrides` is for reviewed timing gaps that are acceptable because the clip has intentional silence, music, or visual beats.
- `archivedOrphanAssets` is for transcript files kept on disk for reference but intentionally excluded from active asset queues.

## User Report Triage

`useAdminStore.exportReportBundle()`로 나온 JSON을 `content:triage`에 넣으면 아래를 자동으로 묶는다.

- 왜 문제가 생겼는지
- 다음엔 어떤 신호를 보면 재발을 줄일 수 있는지
- 어떤 수리 액션으로 고칠지
- 어떤 명령으로 다시 파이프라인에 태울지

Triage 결과물:

- `src/data/content-triage.json`
- `docs/reports/content-triage-report.md`
