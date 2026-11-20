import Anthropic from '@anthropic-ai/sdk'
import { captureException } from '@/lib/report-error'
import { recordAiUsage, recordBlocked, type UsageMeta } from '@/lib/ai/usage'
import {
  AiBudgetError,
  reserve,
  settle,
  type Reservation,
} from '@/lib/ai/budget'
import { estimateMicros } from '@/lib/ai/pricing'

export type { UsageMeta }
export { AiBudgetError }

let client: Anthropic | null = null

function getClient(): Anthropic {
  client ??= new Anthropic()
  return client
}

export const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    const c = getClient()
    return Reflect.get(c, prop, c)
  },
})

type Effort = 'low' | 'medium' | 'high'

export const MODELS = {
  default: 'claude-sonnet-5',
  fast: 'claude-haiku-4-5',
} as const

export type TextBlock = {
  type: 'text'
  text: string
  cache_control?: { type: 'ephemeral' }
}

export type ChatTurn = {
  role: 'user' | 'assistant'
  content: string | TextBlock[]
}

function systemBlocks(system: string | TextBlock[]): TextBlock[] {
  if (typeof system !== 'string') return system
  return [
    { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
  ]
}

function modelParams(model: string, effort: Effort) {
  if (model === MODELS.fast) return {}
  return {
    thinking: { type: 'adaptive' },
    output_config: { effort },
  }
}

type AskOpts = {
  system: string | TextBlock[]
  user?: string
  messages?: ChatTurn[]
  maxTokens?: number
  effort?: Effort
  model?: string
  // Passing meta is what puts the call in the ai_usage ledger. Omit it only
  // for calls that cost nothing.
  meta?: UsageMeta
}

// LABS01-203 — every paid call goes through the four functions below, so the
// spend cap lives here instead of in each of the ten call sites. Routes use
// `requireUser` and server actions use `authActionUser`, so there is no single
// auth chokepoint to hang it on — but there is a single AI chokepoint.

/**
 * Size of the text going into a request. Walks the rendered params instead of
 * the options so it sees exactly what will be sent. Image blocks contribute
 * nothing here — they are priced per image (pricing.IMAGE_TOKENS), because a
 * base64 payload is nothing like its token count.
 */
function promptChars(params: { system?: unknown; messages?: unknown }): number {
  let total = 0
  const walk = (value: unknown): void => {
    if (typeof value === 'string') {
      total += value.length
      return
    }
    if (Array.isArray(value)) {
      for (const item of value) walk(item)
      return
    }
    if (value && typeof value === 'object') {
      const o = value as Record<string, unknown>
      if (typeof o.text === 'string') total += o.text.length
      if (o.content !== undefined) walk(o.content)
    }
  }
  walk(params.system)
  walk(params.messages)
  return total
}

/** Reserves the pessimistic cost, or throws AiBudgetError. */
async function reserveFor(args: {
  meta: UsageMeta | undefined
  model: string
  maxTokens: number
  chars: number
  images?: number
}): Promise<Reservation | null> {
  const micros = estimateMicros({
    model: args.model,
    promptChars: args.chars,
    maxTokens: args.maxTokens,
    images: args.images,
  })
  try {
    return await reserve(args.meta?.userId, micros)
  } catch (e) {
    // The block itself is worth a ledger row: it is how we learn that a cap
    // is too tight, or that someone is hammering one.
    if (e instanceof AiBudgetError) void recordBlocked(args.meta, args.model, e.scope)
    throw e
  }
}

function textParams(opts: AskOpts) {
  const model = opts.model ?? MODELS.default
  return {
    model,
    max_tokens: opts.maxTokens ?? 1024,
    system: systemBlocks(opts.system),
    messages: opts.messages ?? [{ role: 'user', content: opts.user ?? '' }],
    ...modelParams(model, opts.effort ?? 'medium'),
  }
}

export async function askClaude(opts: AskOpts): Promise<string> {
  const { text } = await askClaudeChecked(opts)
  return text
}

export async function askClaudeChecked(
  opts: AskOpts,
): Promise<{ text: string; truncated: boolean }> {
  const started = Date.now()
  const params = textParams(opts)
  const reservation = await reserveFor({
    meta: opts.meta,
    model: params.model,
    maxTokens: params.max_tokens,
    chars: promptChars(params),
  })
  const res = await anthropic.messages.stream(params as never).finalMessage()
  await recordAiUsage(
    opts.meta,
    params.model,
    res,
    Date.now() - started,
    reservation,
  )
  return {
    text: extractText(res),
    truncated: (res as { stop_reason?: string }).stop_reason === 'max_tokens',
  }
}

// Async because the budget has to be reserved before the first token is
// requested — the whole point is that the check happens before the spend.
export async function askClaudeStream(opts: AskOpts) {
  const started = Date.now()
  const params = textParams(opts)
  const chars = promptChars(params)
  const reservation = await reserveFor({
    meta: opts.meta,
    model: params.model,
    maxTokens: params.max_tokens,
    chars,
  })
  const stream = anthropic.messages.stream(params as never)
  // Token counts only exist on the final message, and the caller is busy
  // piping this same stream to the student. finalMessage() resolves once the
  // stream ends, so the ledger is written then — fire and forget, because a
  // telemetry failure must never surface as a broken answer.
  void stream
    .finalMessage()
    .then((res: unknown) =>
      recordAiUsage(opts.meta, params.model, res, Date.now() - started, reservation),
    )
    .catch(() =>
      // The stream broke, so the real cost is unknown — but the prompt was
      // sent and Anthropic billed it. Settle down to the input-only estimate:
      // give the output half back, keep what was certainly spent.
      settle(
        reservation,
        estimateMicros({ model: params.model, promptChars: chars, maxTokens: 0 }),
      ),
    )
  return stream
}

export async function askClaudeVision(opts: {
  system: string | TextBlock[]
  userText: string
  imageBase64: string
  mediaType?: 'image/png' | 'image/jpeg'
  maxTokens?: number
  effort?: Effort
  model?: string
  meta?: UsageMeta
}): Promise<string> {
  const started = Date.now()
  const model = opts.model ?? MODELS.default
  const params = {
    model,
    max_tokens: opts.maxTokens ?? 1024,
    system: systemBlocks(opts.system),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: opts.mediaType ?? 'image/png',
              data: opts.imageBase64,
            },
          },
          { type: 'text', text: opts.userText },
        ],
      },
    ],
    ...modelParams(model, opts.effort ?? 'medium'),
  }
  const reservation = await reserveFor({
    meta: opts.meta,
    model,
    maxTokens: params.max_tokens,
    chars: promptChars(params),
    images: 1,
  })
  const res = await anthropic.messages.stream(params as never).finalMessage()
  await recordAiUsage(opts.meta, model, res, Date.now() - started, reservation)
  return extractText(res)
}

function extractText(res: unknown): string {
  const blocks = (res as { content: Array<{ type: string; text?: string }> })
    .content
  return blocks
    .map((b) => (b.type === 'text' ? (b.text ?? '') : ''))
    .join('')
    .trim()
}

export function aiErrorMessage(e: unknown): string {
  // A spend cap being hit is a business rule, not an incident: it must not
  // reach Sentry, and the student has to be told which limit and when it
  // resets instead of a generic "Erro na IA".
  if (e instanceof AiBudgetError) return e.userMessage
  captureException(e)
  const msg = e instanceof Error ? e.message : ''
  if (/credit balance|too low|billing/i.test(msg)) {
    return 'A conta da Anthropic está sem créditos. Adicione em console.anthropic.com → Plans & Billing.'
  }
  if (e instanceof Anthropic.RateLimitError) {
    return 'A IA está sobrecarregada. Tente de novo em instantes.'
  }
  if (e instanceof Anthropic.APIError) {
    return 'Erro na IA. Tente novamente.'
  }
  return msg || 'Erro inesperado'
}

export function aiErrorResponse(e: unknown): Response {
  if (e instanceof AiBudgetError) {
    // 429 for a real cap (come back later); 503 when the check itself could
    // not run, which is a server problem and not the user's fault.
    return Response.json(
      { error: e.userMessage },
      { status: e.scope === 'unavailable' ? 503 : 429 },
    )
  }
  captureException(e)
  if (e instanceof Anthropic.AuthenticationError) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY ausente ou inválida no servidor.' },
      { status: 500 },
    )
  }
  const msg = e instanceof Error ? e.message : ''
  if (/credit balance|too low|billing/i.test(msg)) {
    return Response.json(
      {
        error:
          'A conta da Anthropic está sem créditos. Adicione em console.anthropic.com → Plans & Billing.',
      },
      { status: 402 },
    )
  }
  if (e instanceof Anthropic.RateLimitError) {
    return Response.json(
      { error: 'A IA está sobrecarregada. Tente de novo em instantes.' },
      { status: 429 },
    )
  }
  return Response.json(
    { error: 'Erro na IA. Tente novamente.' },
    { status: 500 },
  )
}
