// LABS01-204 — `next/headers` outside a request.
//
// Every AI route reads the locale through `getLocale()` (src/lib/i18n/server),
// which calls `cookies()` and `headers()`. Those only exist inside Next's
// request context, so without this a route test dies on the import rather than
// on anything it meant to assert.

export const requestHeaders = {
  locale: undefined as 'pt' | 'en' | undefined,
  acceptLanguage: 'pt-BR,pt;q=0.9' as string | null,

  reset(): void {
    this.locale = undefined
    this.acceptLanguage = 'pt-BR,pt;q=0.9'
  },
}

export async function cookies() {
  return {
    get(name: string) {
      if (name === 'locale' && requestHeaders.locale) {
        return { name, value: requestHeaders.locale }
      }
      return undefined
    },
  }
}

export async function headers() {
  return {
    get(name: string) {
      if (name.toLowerCase() === 'accept-language') {
        return requestHeaders.acceptLanguage
      }
      return null
    },
  }
}
