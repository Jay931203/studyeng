'use client'

import Link from 'next/link'
import { isBillingEnabled } from '@/lib/billing'

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-3 text-base font-bold text-[var(--text-primary)]">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  const billingEnabled = isBillingEnabled()

  return (
    <div className="min-h-dvh bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--border-card)] bg-[var(--bg-primary)] px-4 py-3">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)]"
          aria-label="뒤로 가기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">개인정보처리방침</h1>
      </div>

      <div className="mx-auto max-w-2xl space-y-8 px-5 py-6 pb-20">
        <p className="text-xs text-[var(--text-muted)]">시행일: 2026년 3월 15일</p>

        <Section title="1. 수집하는 정보">
          <p>StudyEng는 서비스 제공을 위해 다음 정보를 수집할 수 있습니다.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>회원 계정 정보: 이메일, 로그인 식별자, 인증 세션 정보</li>
            <li>학습 정보: 시청 기록, 저장한 표현, 좋아요, 레벨, XP, 게임 진행 상황</li>
            <li>기기 및 사용 정보: 접속 로그, 오류 로그, 기기 종류, 앱 버전, 접속 시간</li>
            {billingEnabled ? (
              <li>결제 관련 정보: 구독 상태, 상품 유형, 결제 제공자가 전달한 구독 식별 정보</li>
            ) : null}
          </ul>
        </Section>

        <Section title="2. 정보 이용 목적">
          <ul className="list-disc space-y-2 pl-5">
            <li>회원 인증, 로그인 유지, 계정 보안 관리</li>
            <li>학습 기록 저장, 추천 제공, XP 및 레벨 계산</li>
            <li>구독 상태 확인, 프리미엄 기능 제공, 구매 복원 처리</li>
            <li>오류 분석, 서비스 품질 개선, 부정 사용 방지</li>
            <li>문의 대응 및 공지 전달</li>
          </ul>
        </Section>

        <Section title="3. 결제 및 외부 서비스">
          <p>
            웹 결제는 Stripe를 통해 처리될 수 있으며, 네이티브 앱 결제는 Google Play, App Store,
            RevenueCat 연동을 통해 처리될 수 있습니다.
          </p>
          <p>
            당사는 카드 번호와 같은 민감한 결제 정보를 직접 저장하지 않습니다. 실제 결제 정보는 각 결제
            제공자의 정책에 따라 처리됩니다.
          </p>
        </Section>

        <Section title="4. 정보 보관 기간">
          <p>
            회원 정보와 학습 기록은 서비스 제공 기간 동안 보관되며, 계정 삭제 요청 시 관련 법령상 보관이
            필요한 정보를 제외하고 지체 없이 삭제 또는 비식별화합니다.
          </p>
        </Section>

        <Section title="5. 이용자 권리">
          <ul className="list-disc space-y-2 pl-5">
            <li>본인 정보 열람, 수정, 삭제 요청</li>
            <li>구독 상태 확인 및 관리</li>
            <li>계정 삭제 요청</li>
          </ul>
          <p>
            계정 삭제는 앱 내 프로필 화면에서 직접 진행할 수 있으며, 추가 문의는 지원 페이지 또는 이메일로
            접수할 수 있습니다.
          </p>
        </Section>

        <Section title="6. 문의">
          <p>개인정보 및 서비스 문의: support@shortee.app</p>
        </Section>
      </div>
    </div>
  )
}
