export const MONTHLY_BASE_PRICE = 9900
export const MONTHLY_REFERENCE_PRICE = 12000
export const YEARLY_BASE_PRICE = 79900
export const YEARLY_REFERENCE_PRICE = MONTHLY_REFERENCE_PRICE * 12
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
  return Math.round(basePrice * (100 - discountPercent) / 100)
}

export function getMonthlyDiscountedPrice(discountPercent: number) {
  return getDiscountedPrice(MONTHLY_BASE_PRICE, discountPercent)
}

export function getYearlyRenewalPrice(discountPercent: number) {
  return getDiscountedPrice(YEARLY_BASE_PRICE, discountPercent)
}

export function formatDiscountText(label: string, discountPercent: number) {
  return discountPercent > 0 ? `${label} ${discountPercent}%` : `${label} 없음`
}
