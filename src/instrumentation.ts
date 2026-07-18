import { captureException } from '@/lib/report-error'

// The server-side @sentry/nextjs SDK was removed on purpose: it pulls
// OpenTelemetry (multiple MB) into the server/worker bundle. Server errors
// are reported through lib/report-error (plain fetch to Sentry); the browser
// keeps the full SDK via instrumentation-client.ts.
export async function register() {}

export function onRequestError(error: unknown) {
  captureException(error)
}
