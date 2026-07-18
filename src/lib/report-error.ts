// Server-side error reporting without the @sentry/nextjs SDK. The full SDK
// drags OpenTelemetry (multiple MB) into the server bundle — way over the
// Cloudflare Worker budget — while everything the server actually uses is
// captureException/captureMessage. Events go straight to Sentry's store API
// via fetch. Outside production (or without a DSN) it only logs.
// The browser keeps the full SDK (instrumentation-client.ts) untouched.

function target(): { endpoint: string; authHeader: string } | null {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn || process.env.NODE_ENV !== 'production') return null
  try {
    const u = new URL(dsn)
    const projectId = u.pathname.replace(/^\//, '')
    if (!u.username || !projectId) return null
    return {
      endpoint: `${u.protocol}//${u.host}/api/${projectId}/store/`,
      authHeader: `Sentry sentry_version=7, sentry_key=${u.username}, sentry_client=socratic-lite/1.0`,
    }
  } catch {
    return null
  }
}

// Fire-and-forget: reporting must never break or slow the request path.
function send(event: Record<string, unknown>): void {
  const t = target()
  if (!t) return
  void fetch(t.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sentry-Auth': t.authHeader,
    },
    body: JSON.stringify({
      platform: 'javascript',
      timestamp: Date.now() / 1000,
      environment: process.env.NODE_ENV,
      server_name: 'socratic-server',
      ...event,
    }),
  }).catch(() => {})
}

export function captureException(e: unknown): void {
  const err = e instanceof Error ? e : new Error(String(e))
  console.error('[server-error]', err)
  send({
    level: 'error',
    exception: { values: [{ type: err.name, value: err.message }] },
    extra: { stack: err.stack },
  })
}

export function captureMessage(message: string): void {
  console.error('[server-error]', message)
  send({ level: 'warning', message })
}
