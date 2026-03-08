'use client'

import Link from 'next/link'
import { isBillingEnabled } from '@/lib/billing'

const OPTIONAL_COLLECTION_NO_BILLING = [
  '결제 기능은 현재 제공하지 않으며, 결제 정보는 수집하지 않습니다.',
]

const OPTIONAL_COLLECTION_WITH_BILLING = [
  '결제 기능 이용 시 결제 대행사를 통해 필요한 결제 정보가 처리될 수 있습니다.',
]

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

      <div className="mx-auto max-w-2xl space-y-8 px-5 py-6 pb-20 text-sm leading-relaxed text-[var(--text-secondary)]">
        <p className="text-xs text-[var(--text-muted)]">시행일: 2026년 3월 7일</p>

        <section>
          <h2 className="mb-3 text-base font-bold text-[var(--text-primary)]">1. 수집 항목</h2>
          <div className="space-y-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--text-primary)]">필수 항목</p>
              <p className="text-xs">이메일, 이름, 프로필 이미지, 학습 기록, 기기/브라우저 로그</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--text-primary)]">선택 항목</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                {(billingEnabled
                  ? OPTIONAL_COLLECTION_WITH_BILLING
                  : OPTIONAL_COLLECTION_NO_BILLING
                ).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-[var(--text-primary)]">2. 이용 목적</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>회원 식별, 계정 관리, 부정 이용 방지</li>
            <li>학습 콘텐츠 제공, 진행률 기록, 개인화 추천</li>
            <li>서비스 품질 개선, 장애 대응, 고객 문의 처리</li>
            {billingEnabled && <li>결제 처리, 구독 상태 확인, 환불 및 해지 처리</li>}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-[var(--text-primary)]">3. 보관 기간</h2>
          <p>
            개인정보는 수집 및 이용 목적이 달성되면 지체 없이 파기합니다. 다만 관계 법령에 따라
            일정 기간 보관이 필요한 정보는 해당 기간 동안 안전하게 보관합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-[var(--text-primary)]">4. 제3자 제공 및 처리 위탁</h2>
          <p className="mb-2">회사는 원칙적으로 개인정보를 외부에 제공하지 않습니다. 다만 아래 서비스가 처리에 관여할 수 있습니다.</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Supabase: 인증 및 데이터 저장</li>
            <li>Vercel: 서비스 호스팅</li>
            <li>Google/Kakao: 로그인 인증</li>
            {billingEnabled && <li>결제 대행사: 결제 및 구독 관리</li>}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-[var(--text-primary)]">5. 이용자 권리</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>개인정보 열람, 정정, 삭제, 처리 정지 요구</li>
            <li>동의 철회 및 회원 탈퇴</li>
            <li>문의 채널을 통한 처리 요청</li>
          </ul>
        </section>

        <section className="border-t border-[var(--border-card)] pt-6">
          <p className="text-xs text-[var(--text-muted)]">문의: privacy@studyeng.app</p>
        </section>
      </div>
    </div>
  )
}
