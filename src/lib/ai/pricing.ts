// LABS01-203 — turning tokens into money.
//
// Migration 026 stores raw tokens plus the model on purpose: prices change,
// token counts do not. That left the conversion undone — before this file
// there was no price table anywhere in the codebase, so nothing could answer
// "how much has this cost?". The table lives here, in code, where it can be
// corrected without a backfill.
//
// Prices are US dollars per million tokens, from the Anthropic pricing page.

export type ModelPrice = {
  /** Uncached input. */
  input: number
  output: number
  /** Cache hit — an order of magnitude cheaper than fresh input. */
  cacheRead: number
  /** Writing the cache costs more than plain input. */
  cacheWrite: number
}

export const PRICES: Record<string, ModelPrice> = {
  'claude-sonnet-5': { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  'claude-haiku-4-5': {
    input: 1,
    output: 5,
    cacheRead: 0.1,
    cacheWrite: 1.25,
  },
}

/**
 * What an unknown model costs: the most expensive value known for each field.
 * Deliberately pessimistic — swapping MODELS.default for something not in the
 * table must never silently uncap the budget. It makes the cap tighter, never
 * looser, and the worst case is a user hitting their limit early.
 */
export const FALLBACK_PRICE: ModelPrice = Object.values(PRICES).reduce(
  (worst, p) => ({
    input: Math.max(worst.input, p.input),
    output: Math.max(worst.output, p.output),
    cacheRead: Math.max(worst.cacheRead, p.cacheRead),
    cacheWrite: Math.max(worst.cacheWrite, p.cacheWrite),
  }),
  { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
)

export function priceFor(model: string): ModelPrice {
  return PRICES[model] ?? FALLBACK_PRICE
}

/** Dollars to micro-dollars, rounded up so a reservation never under-charges. */
export function toMicros(usd: number): number {
  return Math.ceil(usd * 1_000_000)
}

export type TokenUsage = {
  input_tokens?: number
  output_tokens?: number
  cache_read_tokens?: number
  cache_write_tokens?: number
}

/** What a finished call actually cost, in micro-dollars. */
export function actualMicros(model: string, usage: TokenUsage): number {
  const p = priceFor(model)
  const usd =
    ((usage.input_tokens ?? 0) * p.input +
      (usage.output_tokens ?? 0) * p.output +
      (usage.cache_read_tokens ?? 0) * p.cacheRead +
      (usage.cache_write_tokens ?? 0) * p.cacheWrite) /
    1_000_000
  return toMicros(usd)
}

/**
 * Chars per token used to size the prompt before sending it. Real Portuguese
 * and source code land around 3.5–4; 3 overestimates, which is the direction
 * a reservation should err in.
 */
export const CHARS_PER_TOKEN = 3

/**
 * Tokens charged for one image. The API scales images so the long edge is at
 * most 1568px and charges about (width × height) / 750 tokens, so a single
 * image cannot exceed roughly this — which is why the 8 MB base64 a
 * design-review accepts is nowhere near 8 MB of prompt.
 */
export const IMAGE_TOKENS = 1600

/**
 * The pessimistic cost of a call that has not happened yet, in micro-dollars:
 * every input token billed as uncached, and the full `maxTokens` billed as
 * output. Reconciliation gives the difference back once the real usage lands
 * (see settle in src/lib/ai/budget.ts).
 */
export function estimateMicros(args: {
  model: string
  promptChars: number
  maxTokens: number
  images?: number
}): number {
  const p = priceFor(args.model)
  const inputTokens =
    Math.ceil(Math.max(0, args.promptChars) / CHARS_PER_TOKEN) +
    (args.images ?? 0) * IMAGE_TOKENS
  const usd =
    (inputTokens * p.input + Math.max(0, args.maxTokens) * p.output) / 1_000_000
  return toMicros(usd)
}
