import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'

if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/ingest`,
    ui_host: 'https://us.posthog.com',
    defaults: '2025-05-24',
    person_profiles: 'identified_only',
    capture_exceptions: false,
  })
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled:
    process.env.NODE_ENV === 'production' &&
    !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
  ],
  ignoreErrors: [
    'Failed to fetch',
    'Load failed',
    'NetworkError',
    'AbortError',
    'ResizeObserver loop',
  ],
  beforeSend(event) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return null
    return event
  },
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

// Bridge for modules that must not import @sentry/nextjs themselves:
// global-error.tsx is SSR-compiled, and importing the SDK there would drag
// the multi-MB server build of Sentry into the server bundle.
declare global {
  interface Window {
    __captureException?: (e: unknown) => void
    __posthog?: typeof posthog
  }
}
window.__captureException = (e) => Sentry.captureException(e)
// Same bridge idea for analytics: posthog-js is a ~330KB browser SDK, and a
// static import in analytics.ts was getting SSR-compiled (and duplicated)
// into the server bundle. This file is client-only, so the instance lives
// here and everyone else reaches it through window.
window.__posthog = posthog
