# Play Console Submission Sequence

This runbook is the exact order to finish Android submission for StudyEng.

## Fixed app identifiers

- App name: `StudyEng`
- Android package: `com.studyeng.app`
- Premium entitlement id in RevenueCat: `premium`
- Latest local release bundle:
  - `android/app/build/outputs/bundle/release/app-release.aab`

## Stage 1. Play Console app shell

1. Open Play Console and create or open the app for package `com.studyeng.app`.
2. Confirm:
   - app name is `StudyEng`
   - default language is Korean
   - app type is App
   - category is Education
3. Go to `Testing > Internal testing` and create the internal track if it does not exist.

## Stage 2. Upload the first Android bundle

1. In `Testing > Internal testing`, create a release.
2. Upload:
   - `android/app/build/outputs/bundle/release/app-release.aab`
3. Save the release, but do not roll out to production yet.

## Stage 3. App content and store listing

Complete these before broad review:

- App access:
  - provide login instructions for reviewer access
  - if a reviewer needs a premium test account, add it here
- Privacy policy:
  - public URL: `/privacy`
- Support URL:
  - public URL: `/support`
- Terms URL:
  - public URL: `/terms`
- Data safety
- Ads declaration
- Content rating
- Target audience and content

## Stage 4. Play subscriptions

Use one subscription product with two base plans.

- Subscription product id: `premium`
- Base plan ids:
  - `monthly`
  - `yearly`

Recommended prices:

- Monthly:
  - reference display in app: `12,000원`
  - current price display in app: `9,900원 / 월`
- Yearly:
  - app display baseline: `144,000원`
  - current price display in app: `79,900원 / 년`

Important:

- Do not publish to production before the base plans exist.
- Use tester accounts first.

## Stage 5. RevenueCat wiring

In RevenueCat:

1. Create or open the project for StudyEng.
2. Add the Android app for package `com.studyeng.app`.
3. Connect Google Play billing credentials.
4. Create entitlement:
   - `premium`
5. Import the Play subscription product:
   - `premium`
6. Create an offering:
   - current offering containing monthly and yearly packages
7. Use the Android public SDK key in:
   - `NEXT_PUBLIC_REVENUECAT_API_KEY_GOOGLE`

Notes:

- The app code does not depend on custom package identifiers; it picks native packages by `MONTHLY` and `ANNUAL` package type.
- Native purchase state is considered premium only when the `premium` entitlement is active.

## Stage 6. Internal test purchase QA

Run these on a real Android device from the internal track build:

1. Login
2. Free video limit reached -> premium modal opens
3. Monthly purchase
4. Yearly purchase
5. Restore purchases
6. Cancel in Play subscription center
7. Re-open app and verify premium status sync
8. Account deletion path
9. Support / privacy / terms links

## Stage 7. Production readiness

Before production rollout:

- screenshots finalized
- Korean store description finalized
- support email confirmed
- privacy / terms URLs public and readable
- billing enabled env confirmed for production
- `CAPACITOR_SERVER_URL` set to the production web origin

## First manual action needed now

Open Play Console and confirm whether the `StudyEng` app with package `com.studyeng.app` already exists.
