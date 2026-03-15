import { useMemo } from 'react'
import { useLocaleStore } from '@/stores/useLocaleStore'
import { getLocaleStrings, type LocaleStrings } from './index'

type PathKeys<T, Prefix extends string = ''> = T extends string | ((...args: never[]) => string)
  ? Prefix
  : {
      [K in keyof T & string]: PathKeys<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>
    }[keyof T & string]

type PathValue<T, P extends string> = P extends `${infer Head}.${infer Tail}`
  ? Head extends keyof T
    ? PathValue<T[Head], Tail>
    : never
  : P extends keyof T
    ? T[P]
    : never

export type TranslationKey = PathKeys<LocaleStrings>

/**
 * Lightweight translation hook.
 *
 * Usage:
 *   const { t, locale } = useTranslation()
 *   t('common.save')           // '저장' or '保存'
 *   t('explore.nextEpisode')   // (title: string) => string
 *
 * For function-valued keys, `t` returns the function itself.
 * Call it: `t('explore.nextEpisode')('Episode 5')`
 */
export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale)
  const strings = useMemo(() => getLocaleStrings(locale), [locale])

  function t<K extends TranslationKey>(key: K): PathValue<LocaleStrings, K> {
    const parts = key.split('.')
    let current: unknown = strings

    for (const part of parts) {
      if (current == null || typeof current !== 'object') return key as never
      current = (current as Record<string, unknown>)[part]
    }

    return (current ?? key) as PathValue<LocaleStrings, K>
  }

  return { t, locale, strings } as const
}
