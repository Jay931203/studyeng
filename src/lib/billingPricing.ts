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

const wonFormatter = new Intl.NumberFormat('ko-KR')

export function formatWon(value: number) {
  return `${wonFormatter.format(Math.max(0, Math.round(value)))}원`
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

export function formatDiscountText(label: string, discountPercent: number) {
  return discountPercent > 0 ? `${label} ${discountPercent}%` : `${label} 없음`
}
