import { supabaseAdmin } from '@/lib/supabase/server'
import { settle, type Reservation } from '@/lib/ai/budget'
import { actualMicros } from '@/lib/ai/pricing'

// Where the spend came from. Every paid call to Claude carries one of these so
// the ledger can answer "which route, which user, which session".
export type UsageMeta = {
  route:
    | 'tutor'
    | 'review'
    | 'design-review'
    | 'solve'
    | 'generate-challenge'
    | 'recommendation'
    | 'editorial'
  mode?: string
  userId?: string | null
  sessionId?: string | null
}

type MessageWithUsage = {
  usage?: {
    input_tokens?: number
    output_tokens?: number
    cache_read_input_tokens?: number
    cache_creation_input_tokens?: number
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type AiUsageRow = {
  user_id: string | null
  session_id: string | null
  route: string
  mode: string | null
  model: string
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_write_tokens: number
  latency_ms: number
}

/**
 * Maps an Anthropic response onto a ledger row. Pure on purpose — the column
 * mapping is the part that silently rots when the SDK renames a usage field,
 * so it is unit-tested rather than only exercised in production.
 *
 * Returns null when there is nothing worth recording (no meta, or a response
 * that carries no usage block).
 */
export function usageRow(
  meta: UsageMeta | undefined,
  model: string,
  message: unknown,
  latencyMs: number,
): AiUsageRow | null {
  if (!meta) return null
  const usage = (message as MessageWithUsage)?.usage
  if (!usage) return null

  return {
    user_id: meta.userId ?? null,
    // The column has no FK, but a malformed id is still worthless — drop it
    // rather than store garbage the pipeline would have to clean later.
    session_id:
      meta.sessionId && UUID.test(meta.sessionId) ? meta.sessionId : null,
    route: meta.route,
    mode: meta.mode ?? null,
    model,
    input_tokens: usage.input_tokens ?? 0,
    output_tokens: usage.output_tokens ?? 0,
    cache_read_tokens: usage.cache_read_input_tokens ?? 0,
    cache_write_tokens: usage.cache_creation_input_tokens ?? 0,
    latency_ms: Math.max(0, Math.round(latencyMs)),
  }
}

/**
 * Writes one row per Claude call. Never throws and never rejects: a failure to
 * record telemetry must not break an answer the student is already reading.
 *
 * LABS01-203: this is also where the budget reservation is reconciled, because
 * this is the first moment the real token count exists.
 */
export async function recordAiUsage(
  meta: UsageMeta | undefined,
  model: string,
  message: unknown,
  latencyMs: number,
  reservation?: Reservation | null,
): Promise<void> {
  const row = usageRow(meta, model, message, latencyMs)
  // No row means no usage block came back, so the real cost is unknown. The
  // call still happened, so the pessimistic reservation stays charged — the
  // safe direction.
  if (!row) return
  try {
    const { error } = await supabaseAdmin.from('ai_usage').insert(row)
    if (error) console.error('[recordAiUsage]', error.message)
  } catch (e) {
    console.error('[recordAiUsage]', e)
  }
  await settle(reservation ?? null, actualMicros(model, row))
}

/**
 * A call the spend cap refused, recorded with zero tokens. It costs nothing,
 * so it cannot distort any cost aggregation — and it is the only way to find
 * out later that a cap is too tight or that someone is hammering one.
 */
export async function recordBlocked(
  meta: UsageMeta | undefined,
  model: string,
  scope: string,
): Promise<void> {
  if (!meta) return
  try {
    const { error } = await supabaseAdmin.from('ai_usage').insert({
      user_id: meta.userId ?? null,
      session_id:
        meta.sessionId && UUID.test(meta.sessionId) ? meta.sessionId : null,
      route: meta.route,
      mode: `blocked:${scope}`,
      model,
      input_tokens: 0,
      output_tokens: 0,
      cache_read_tokens: 0,
      cache_write_tokens: 0,
      latency_ms: 0,
    })
    if (error) console.error('[recordBlocked]', error.message)
  } catch (e) {
    console.error('[recordBlocked]', e)
  }
}
