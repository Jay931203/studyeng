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

### Subtitle quality

- 자막 한 칸 길이 최대: 7초
- 영문 자막 길이 최대: 120자
- 인접 자막 gap 최대: 2초
- overlap 금지

단, 실제 운영에서는 긴 단일 문장이 존재할 수 있으므로 `needs_timing_review`는 자동 폐기가 아니라 검수 큐로 본다.

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
