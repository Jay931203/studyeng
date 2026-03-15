# App Store Readiness

## Done

- Capacitor shell sync works with `npm run cap:sync`.
- Native platform packages are installed:
  - `@capacitor/android`
  - `@capacitor/ios`
- Native projects are generated:
  - `android/`
  - `ios/`
- Android debug build succeeds with SDK env configured:
  - `android/gradlew.bat assembleDebug`
- Android release bundle now builds locally:
  - `android/gradlew.bat bundleRelease`
  - output: `android/app/build/outputs/bundle/release/app-release.aab`
- Web-only push prompt is hidden on native.
- Public support page exists at `/support`.
- Profile now links to support, terms, and privacy pages.
- Shorts feed swipe is locked while priming/game overlays are open.
- Privacy and terms pages were rewritten with readable Korean copy for store review.

## Still Required Before Submission

### Product / UX

- Verify shorts swipe regression on device after the new gesture lock.
- QA login, logout, account deletion, subscription, restore, and cancel flows.
- Remove or polish any remaining dead controls, empty states, and broken overlays.

### Billing

- Confirm RevenueCat API keys per platform.
- Confirm App Store / Play Store products are created and mapped.
- Verify purchase, restore, renewal state, and management links on device.

### Native

- Confirm the generated AAB installs and runs on a real Android device.
- Open `ios/` on macOS with Xcode and verify signing, build, and runtime.
- Replace development `CAPACITOR_SERVER_URL` with the production origin for app builds.

### Store Metadata

- Prepare support URL: `/support`
- Prepare privacy URL: `/privacy`
- Prepare terms URL: `/terms`
- Finalize screenshots, app description, subtitle, keywords, and subscription disclosure copy.

## Notes

- Current mobile shell uses a remote deployed app origin through `CAPACITOR_SERVER_URL`.
- `out/` is generated as a minimal Capacitor sync shell by `scripts/build-capacitor-shell.mjs`.
- Android SDK is present locally at `C:\\Users\\hyunj\\AppData\\Local\\Android\\Sdk`, but build commands need `ANDROID_SDK_ROOT` / `ANDROID_HOME` set in the shell or IDE.
- Current Android identifiers:
  - package id: `com.studyeng.app`
  - app name: `StudyEng`
