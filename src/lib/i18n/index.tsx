'use client'

import * as React from 'react'

export type Locale = 'en' | 'pt'

export const LOCALE_COOKIE = 'locale'

const LocaleContext = React.createContext<{
  locale: Locale
  setLocale: (l: Locale) => void
}>({ locale: 'en', setLocale: () => {} })

export function LocaleProvider({
  initialLocale = 'en',
  children,
}: {
  initialLocale?: Locale
  children: React.ReactNode
}) {
  // The server already resolved the locale (cookie, then Accept-Language) and
  // rendered the HTML with it, so starting here means the first client render
  // matches the SSR output exactly — no hydration mismatch, no language flash.
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale)

  // One-way sync only: never call setLocaleState here. localStorage is a mirror
  // of the server's decision, not an input to it.
  React.useEffect(() => {
    window.localStorage.setItem(LOCALE_COOKIE, locale)
  }, [locale])

  React.useEffect(() => {
    document.documentElement.lang = locale === 'pt' ? 'pt-BR' : 'en'
  }, [locale])

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l)
    window.localStorage.setItem(LOCALE_COOKIE, l)
    document.cookie = `${LOCALE_COOKIE}=${l};path=/;max-age=31536000;samesite=lax`
  }, [])

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return React.useContext(LocaleContext)
}

export function useT<T extends Record<Locale, unknown>>(copy: T): T[Locale] {
  const { locale } = useLocale()
  return copy[locale] as T[Locale]
}
