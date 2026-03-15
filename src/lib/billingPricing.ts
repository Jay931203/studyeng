export const MONTHLY_BASE_PRICE = 9900
export const YEARLY_BASE_PRICE = 79900

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
