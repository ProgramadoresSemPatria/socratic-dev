'use client'

// No static `posthog-js` import here on purpose: this module is imported by
// dozens of client components, and the SDK was being duplicated into the
// server (SSR) bundle — ~1.6MB of worker cold-start weight. The instance is
// created in instrumentation-client.ts (browser-only) and shared via window.
function ph() {
  if (typeof window === 'undefined') return null
  const p = window.__posthog
  return p && p.__loaded ? p : null
}

export function track(event: string, props?: Record<string, unknown>) {
  try {
    ph()?.capture(event, props)
  } catch {}
}

export function identify(id: string, props?: Record<string, unknown>) {
  try {
    ph()?.identify(id, props)
  } catch {}
}

export function resetAnalytics() {
  try {
    ph()?.reset()
  } catch {}
}
