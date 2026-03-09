import { Capacitor } from '@capacitor/core'

export function isNative() {
  return Capacitor.isNativePlatform()
}

export function getPlatform() {
  return Capacitor.getPlatform() as 'web' | 'ios' | 'android'
}

export function isIOS() {
  return getPlatform() === 'ios'
}

export function isAndroid() {
  return getPlatform() === 'android'
}
