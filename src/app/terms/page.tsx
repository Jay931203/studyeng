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

export default function TermsPage() {
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
        <h1 className="text-lg font-bold">이용약관</h1>
      </div>

      <div className="mx-auto max-w-2xl space-y-8 px-5 py-6 pb-20">
        <p className="text-xs text-[var(--text-muted)]">시행일: 2026년 3월 15일</p>

        <Section title="1. 서비스 개요">
          <p>
            StudyEng는 영상 기반 영어 학습 서비스를 제공합니다. 사용자는 계정을 생성해 학습 기록, 저장 표현,
            게임 진행 상황, 구독 상태를 관리할 수 있습니다.
          </p>
        </Section>

        <Section title="2. 계정과 이용">
          <ul className="list-disc space-y-2 pl-5">
            <li>사용자는 정확한 계정 정보를 제공해야 합니다.</li>
            <li>계정 보안 책임은 사용자에게 있으며, 비정상 접근이 의심되면 즉시 알려야 합니다.</li>
            <li>서비스 남용, 불법 이용, 타인 권리 침해가 확인되면 이용이 제한될 수 있습니다.</li>
          </ul>
        </Section>

        <Section title="3. 유료 구독">
          {billingEnabled ? (
            <>
              <p>
                프리미엄 구독은 월간 또는 연간 플랜으로 제공될 수 있으며, 실제 결제와 갱신은 웹 결제 제공자
                또는 각 앱스토어 결제 시스템을 통해 처리됩니다.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>가격, 할인, 갱신 조건은 결제 전 화면과 스토어 표시에 따릅니다.</li>
                <li>네이티브 앱 구독의 해지 및 관리 는 Google Play 또는 App Store에서 진행합니다.</li>
                <li>웹 결제 구독의 관리 는 별도의 결제 관리 페이지에서 진행합니다.</li>
              </ul>
            </>
          ) : (
            <p>
              현재 버전에서는 유료 구독이 비활성화되어 있을 수 있습니다. 유료 기능이 활성화되면 가격과 이용
              조건은 앱 및 스토어 화면에 별도로 안내됩니다.
            </p>
          )}
        </Section>

        <Section title="4. 콘텐츠와 기능">
          <p>
            서비스 내 영상, 자막, 표현, 게임 콘텐츠는 학습 목적에 맞춰 제공되며, 콘텐츠 구성과 기능은 사전
            고지 없이 업데이트될 수 있습니다.
          </p>
        </Section>

        <Section title="5. 계정 삭제와 종료">
          <p>
            사용자는 앱 내 계정 삭제 기능을 통해 계정을 종료할 수 있습니다. 법령상 보관 의무가 있는 정보를
            제외한 개인 데이터는 삭제 정책에 따라 처리됩니다.
          </p>
        </Section>

        <Section title="6. 책임 제한">
          <p>
            당사는 서비스의 안정적 운영을 위해 노력하지만, 네트워크 환경, 외부 플랫폼 장애, 스토어 정책 변경,
            기기 호환성 문제 등으로 일부 기능이 제한될 수 있습니다.
          </p>
        </Section>

        <Section title="7. 문의">
          <p>서비스 및 약관 문의: support@shortee.app</p>
        </Section>
      </div>
    </div>
  )
}
