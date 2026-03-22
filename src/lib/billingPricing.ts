export type SupportedLocale = 'ko' | 'ja' | 'zh-TW' | 'vi'

export const MONTHLY_BASE_PRICE = 9900
export const MONTHLY_REFERENCE_PRICE = 12000
export const YEARLY_BASE_PRICE = 79900
export const YEARLY_REFERENCE_PRICE = MONTHLY_REFERENCE_PRICE * 12

const YEARLY_MONTHLY_MARGIN = 1000
const YEARLY_SAVINGS_MARGIN_PERCENT = 3

export const MONTHLY_BASE_SAVINGS_PERCENT = Math.round(
  ((MONTHLY_REFERENCE_PRICE - MONTHLY_BASE_PRICE) / MONTHLY_REFERENCE_PRICE) * 100,
)

export const YEARLY_BASE_SAVINGS_PERCENT = Math.round(
  ((YEARLY_REFERENCE_PRICE - YEARLY_BASE_PRICE) / YEARLY_REFERENCE_PRICE) * 100,
)

export function formatPrice(value: number, locale: SupportedLocale = 'ko'): string {
  if (locale === 'ja') {
    const jpy = Math.max(0, Math.round(value * 0.11))
    return `≈¥${new Intl.NumberFormat('ja-JP').format(jpy)}`
  }
  if (locale === 'zh-TW') {
    const twd = Math.max(0, Math.round(value * 0.024))
    return `≈NT$${new Intl.NumberFormat('zh-TW').format(twd)}`
  }
  if (locale === 'vi') {
    const vnd = Math.max(0, Math.round(value * 18.5))
    return `≈${new Intl.NumberFormat('vi-VN').format(vnd)}\u20AB`
  }
  return `${new Intl.NumberFormat('ko-KR').format(Math.max(0, Math.round(value)))}원`
}

/** @deprecated Use formatPrice() instead */
export function formatWon(value: number) {
  return formatPrice(value, 'ko')
}

export function getDiscountedPrice(basePrice: number, discountPercent: number) {
  return Math.round((basePrice * (100 - discountPercent)) / 100)
}

export function getMonthlyDiscountedPrice(discountPercent: number) {
  return getDiscountedPrice(MONTHLY_BASE_PRICE, discountPercent)
}

export function getYearlyRenewalPrice(
  yearlyDiscountPercent: number,
  monthlyDiscountPercent = 0,
) {
  const discountedYearly = getDiscountedPrice(YEARLY_BASE_PRICE, yearlyDiscountPercent)
  const monthlyEquivalent = getMonthlyDiscountedPrice(monthlyDiscountPercent) * 12
  const monthlySavingsPercent = getSavingsPercent(
    MONTHLY_REFERENCE_PRICE,
    getMonthlyDiscountedPrice(monthlyDiscountPercent),
  )
  const yearlySavingsFloorPrice = Math.round(
    (YEARLY_REFERENCE_PRICE * (100 - Math.min(99, monthlySavingsPercent + YEARLY_SAVINGS_MARGIN_PERCENT))) /
      100,
  )

  return Math.min(
    discountedYearly,
    Math.max(0, monthlyEquivalent - YEARLY_MONTHLY_MARGIN),
    yearlySavingsFloorPrice,
  )
}

export function getSavingsPercent(referencePrice: number, currentPrice: number) {
  if (referencePrice <= 0) return 0
  return Math.max(
    0,
    Math.round(((referencePrice - currentPrice) / referencePrice) * 100),
  )
}

export function formatDiscountText(label: string, discountPercent: number, locale: SupportedLocale = 'ko') {
  const noneMap: Record<string, string> = { ko: '없음', ja: 'なし', 'zh-TW': '無', vi: 'Không' }
  const none = noneMap[locale] ?? '없음'
  return discountPercent > 0 ? `${label} ${discountPercent}%` : `${label} ${none}`
}
