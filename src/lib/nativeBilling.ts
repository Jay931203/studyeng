/**
 * Native in-app purchase billing via RevenueCat.
 *
 * RevenueCat handles both Google Play Billing and Apple IAP through a single API.
 * This module is only used on native platforms (iOS/Android).
 *
 * Setup required:
 * 1. Create RevenueCat account at https://app.revenuecat.com
 * 2. Create a project and add your app (iOS + Android)
 * 3. Configure Google Play / App Store credentials in RevenueCat dashboard
 * 4. Create "Entitlements" (e.g., "premium") and "Offerings" in RevenueCat
 * 5. Set NEXT_PUBLIC_REVENUECAT_API_KEY_APPLE and NEXT_PUBLIC_REVENUECAT_API_KEY_GOOGLE env vars
 */

import { Purchases } from '@revenuecat/purchases-capacitor'
import type { CustomerInfo, PurchasesOfferings } from '@revenuecat/purchases-typescript-internal-esm'
import { hasPlaceholderValue } from '@/lib/billing'
import { getPlatform } from '@/lib/platform'

const ENTITLEMENT_ID = 'premium'

let initialized = false

function getRevenueCatApiKey() {
  const platform = getPlatform()
  return (
    platform === 'ios'
      ? process.env.NEXT_PUBLIC_REVENUECAT_API_KEY_APPLE
      : process.env.NEXT_PUBLIC_REVENUECAT_API_KEY_GOOGLE
  )
}

export function isNativeBillingConfigured() {
  return !hasPlaceholderValue(getRevenueCatApiKey())
}

export async function initRevenueCat(userId?: string) {
  if (initialized) return true

  const platform = getPlatform()
  const apiKey = getRevenueCatApiKey()

  if (!apiKey || hasPlaceholderValue(apiKey)) {
    console.warn('[billing] RevenueCat API key not configured for', platform)
    return false
  }

  await Purchases.configure({
    apiKey,
    appUserID: userId ?? null,
  })

  initialized = true
  return true
}

export async function loginRevenueCat(userId: string) {
  const ready = await initRevenueCat(userId)
  if (!ready) return
  await Purchases.logIn({ appUserID: userId })
}

export async function logoutRevenueCat() {
  if (!initialized) return
  await Purchases.logOut()
}

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  try {
    const ready = await initRevenueCat()
    if (!ready) {
      return null
    }

    const offerings = await Purchases.getOfferings()
    return offerings
  } catch (error) {
    console.warn('[billing] failed to get offerings:', error)
    return null
  }
}

export async function purchasePackage(packageId: string): Promise<CustomerInfo | null> {
  try {
    const ready = await initRevenueCat()
    if (!ready) {
      throw new Error('billing-not-configured')
    }

    const offerings = await getOfferings()
    const currentOffering = offerings?.current
    if (!currentOffering) {
      throw new Error('no-current-offering')
    }

    const pkg = currentOffering.availablePackages.find((p) => p.identifier === packageId)
    if (!pkg) {
      throw new Error(`package-not-found:${packageId}`)
    }

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
    return customerInfo
  } catch (error) {
    console.warn('[billing] purchase failed:', error)
    throw error
  }
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    const ready = await initRevenueCat()
    if (!ready) {
      return null
    }

    const { customerInfo } = await Purchases.restorePurchases()
    return customerInfo
  } catch (error) {
    console.warn('[billing] restore failed:', error)
    return null
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    const ready = await initRevenueCat()
    if (!ready) {
      return null
    }

    const { customerInfo } = await Purchases.getCustomerInfo()
    return customerInfo
  } catch (error) {
    console.warn('[billing] customer info fetch failed:', error)
    return null
  }
}

export function isPremiumFromCustomerInfo(info: CustomerInfo | null): boolean {
  if (!info) return false
  const entitlement = info.entitlements.active[ENTITLEMENT_ID]
  return Boolean(entitlement)
}

export async function checkNativePremiumStatus(): Promise<boolean> {
  const info = await getCustomerInfo()
  return isPremiumFromCustomerInfo(info)
}
