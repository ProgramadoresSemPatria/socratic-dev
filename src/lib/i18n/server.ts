import { cookies, headers } from 'next/headers'
import type { Locale } from './index'

// Kept as a literal rather than importing LOCALE_COOKIE: './index' is a
// 'use client' module, so importing a runtime value from it here would cross
// the client boundary.
const LOCALE_COOKIE = 'locale'

/**
 * The single source of truth for the active locale. An explicit cookie (set by
 * the language toggle) always wins; otherwise fall back to the browser's
 * Accept-Language so a first-time pt visitor is served Portuguese on the very
 * first paint rather than after a client-side correction.
 */
export async function getLocale(): Promise<Locale> {
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value
  if (cookie === 'pt' || cookie === 'en') return cookie

  const acceptLanguage = (await headers()).get('accept-language')?.toLowerCase()
  return acceptLanguage?.startsWith('pt') ? 'pt' : 'en'
}
