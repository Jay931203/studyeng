# Kakao OAuth Setup Guide

StudyEng uses Supabase Auth with Kakao as an OAuth provider.
This document describes the manual setup steps required in Kakao Developer Console and Supabase Dashboard.

## 1. Kakao Developer Console

1. Go to https://developers.kakao.com and log in.
2. Click "내 애플리케이션" > "애플리케이션 추가하기".
3. Fill in app name (e.g., "StudyEng") and company name, then create.
4. In the created app, go to "앱 키" and copy the **REST API 키**. This is your Client ID.

## 2. Enable Kakao Login

1. In the Kakao app dashboard, go to "제품 설정" > "카카오 로그인".
2. Toggle "활성화 설정" to ON.
3. Under "Redirect URI", add:
   ```
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```
   Replace `<your-supabase-project-ref>` with your actual Supabase project reference ID
   (visible in your Supabase project URL: `https://<ref>.supabase.co`).

## 3. Consent Screen (동의항목)

1. In the Kakao app, go to "제품 설정" > "카카오 로그인" > "동의항목".
2. Enable the following scopes (set to "필수 동의" or "선택 동의" as needed):
   - **profile_nickname** (닉네임) -- recommended: 필수 동의
   - **account_email** (카카오계정 이메일) -- recommended: 선택 동의
   - **profile_image** (프로필 사진) -- optional

## 4. Client Secret (optional but recommended)

1. In the Kakao app, go to "제품 설정" > "카카오 로그인" > "보안".
2. Click "코드 생성" to generate a Client Secret.
3. Set "Client Secret 사용" to "사용함".

## 5. Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** > **Providers**.
3. Find **Kakao** in the provider list and enable it.
4. Enter:
   - **Client ID**: The REST API key from step 1.
   - **Client Secret**: The secret from step 4 (leave blank if not generated).
5. Save.

## 6. Verify

1. Run the app locally and click the Kakao login button.
2. You should be redirected to Kakao's consent screen.
3. After granting consent, you should be redirected back to `/auth/callback` and logged in.

## Troubleshooting

- **"redirect_uri_mismatch" error**: Make sure the redirect URI in Kakao Developer Console
  exactly matches `https://<ref>.supabase.co/auth/v1/callback`.
- **No email returned**: Kakao only returns email if the user has agreed to share it
  and the consent scope is configured. Check "동의항목" settings.
- **Provider not enabled**: Double-check that Kakao is toggled ON in both Kakao Developer Console
  and Supabase Dashboard.
