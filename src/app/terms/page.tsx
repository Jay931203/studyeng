'use client'

import Link from 'next/link'
import { isBillingEnabled } from '@/lib/billing'

const PAYMENT_TERMS = [
  '유료 구독 상품의 가격과 적용 조건은 서비스 화면에 명확히 표시합니다.',
  '결제와 구독 관리는 회사가 지정한 결제 대행사 및 관리 수단을 통해 처리합니다.',
  '결제 완료, 자동 갱신, 해지, 환불 기준은 서비스 화면과 결제 대행사 정책에 함께 표시합니다.',
  '환불과 철회 가능 범위는 전자상거래 등 관련 법령과 결제 대행사 정책을 따릅니다.',
]

const NO_PAYMENT_TERMS = [
  '현재 버전의 서비스는 앱 내 유료 결제 및 구독 상품을 제공하지 않습니다.',
  '향후 유료 상품이 도입되는 경우, 가격과 적용 조건을 서비스 화면에 별도로 표시하고 사전 공지합니다.',
  '결제 기능 도입 이후의 결제 수단, 환불 기준, 해지 절차는 별도 정책으로 안내합니다.',
  '실제 결제 및 환불이 발생하는 경우 관련 법령을 따릅니다.',
]

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
      {children}
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

      <div className="mx-auto max-w-2xl space-y-8 px-5 py-6 pb-20 text-sm leading-relaxed text-[var(--text-secondary)]">
        <p className="text-xs text-[var(--text-muted)]">시행일: 2026년 3월 7일</p>

        <Section title="제1조 (목적)">
          <p>
            이 약관은 Shortee가 제공하는 영어 학습 서비스의 이용 조건과 회사 및 이용자의
            권리, 의무, 책임사항을 규정하는 것을 목적으로 합니다.
          </p>
        </Section>

        <Section title="제2조 (정의)">
          <ol className="list-decimal list-inside space-y-2">
            <li>서비스는 회사가 제공하는 학습 콘텐츠, 복습 기능, 추천 기능, 관련 부가 기능을 말합니다.</li>
            <li>이용자는 이 약관에 동의하고 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
            <li>회원은 소셜 로그인 등 회사가 제공하는 방식으로 계정을 연동한 이용자를 말합니다.</li>
            <li>콘텐츠는 서비스에 제공되는 영상, 텍스트, 자막, 이미지 등 학습 자료를 말합니다.</li>
          </ol>
        </Section>

        <Section title="제3조 (서비스 이용)">
          <ol className="list-decimal list-inside space-y-2">
            <li>회사는 안정적인 서비스 제공을 위해 시스템 점검, 교체, 장애 대응을 수행할 수 있습니다.</li>
            <li>서비스 중 일부 기능은 로그인 여부, 운영 정책, 시스템 상태에 따라 제한될 수 있습니다.</li>
            <li>이용자는 회사의 사전 승인 없이 서비스를 복제, 전송, 배포하거나 상업적으로 이용할 수 없습니다.</li>
          </ol>
        </Section>

        <Section title="제4조 (회원가입 및 탈퇴)">
          <ol className="list-decimal list-inside space-y-2">
            <li>회원가입은 이용자가 약관에 동의하고 회사가 제공하는 로그인 방식을 통해 완료됩니다.</li>
            <li>회원은 서비스 설정 또는 고객지원 채널을 통해 탈퇴를 요청할 수 있습니다.</li>
            <li>탈퇴 후 보관이 필요한 정보는 관련 법령 및 개인정보처리방침에 따라 처리됩니다.</li>
          </ol>
        </Section>

        <Section title="제5조 (결제 및 환불)">
          <ol className="list-decimal list-inside space-y-2">
            {(billingEnabled ? PAYMENT_TERMS : NO_PAYMENT_TERMS).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </Section>

        <Section title="제6조 (면책)">
          <ol className="list-decimal list-inside space-y-2">
            <li>회사는 천재지변, 통신 장애, 외부 플랫폼 장애 등 불가항력 사유로 인한 손해에 책임을 지지 않습니다.</li>
            <li>서비스에 제공되는 학습 콘텐츠는 참고 자료이며, 회사는 완전성이나 특정 목적 적합성을 보증하지 않습니다.</li>
            <li>외부 플랫폼 콘텐츠에는 해당 플랫폼의 정책과 약관이 함께 적용될 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제7조 (문의)">
          <p>서비스 문의: support@studyeng.app</p>
        </Section>
      </div>
    </div>
  )
}
