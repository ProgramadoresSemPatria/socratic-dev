// LABS01-204 — a stand-in for the Anthropic SDK.
//
// The point of mocking HERE rather than at `@/lib/ai/client` is that the real
// client is the one thing the audit's findings run through: it is the single
// AI chokepoint where the spend cap is reserved (LABS01-203) and where the
// prompt is finally assembled. Replacing it would mean the tests assert
// against the mock instead of against the code.
//
// So the seam is one level lower: `anthropic.messages.stream(params)`. The
// real reserve/settle, the real prompt building and the real error mapping all
// execute, and `calls` holds exactly the request body that would have been
// sent — which is how "the forged title never reaches the model" becomes an
// assertion instead of an intention.
//
// Honest limitation: `finalMessage()` here resolves on its own instead of
// waiting for the consumer to drain the stream, as the real SDK does. Nothing
// in these tests depends on that ordering, and the alternative (a mock with
// its own buffering) would be more machinery than the assertions need.

export type AnthropicCall = {
  model: string
  max_tokens: number
  system: unknown
  messages: { role: string; content: unknown }[]
  [key: string]: unknown
}

type Usage = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
}

class MockApiError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message)
    this.name = 'APIError'
  }
}

class MockRateLimitError extends MockApiError {
  constructor(message = 'rate limited') {
    super(message, 429)
    this.name = 'RateLimitError'
  }
}

class MockAuthenticationError extends MockApiError {
  constructor(message = 'invalid api key') {
    super(message, 401)
    this.name = 'AuthenticationError'
  }
}

class Recorder {
  calls: AnthropicCall[] = []
  /** The whole reply, split into one streamed chunk per sentence. */
  text = 'Primeiro: o que acontece quando dois pedidos chegam juntos?'
  chunks: string[] | null = null
  stopReason: string | null = 'end_turn'
  usage: Usage = {
    input_tokens: 1200,
    output_tokens: 180,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
  }
  /** Throw from the stream after this many chunks. null = never. */
  breakAfter: number | null = null
  breakError: Error = new Error('socket hang up')
  /** Throw from `messages.stream()` itself, before any token. */
  throwOnCall: Error | null = null

  reset(): void {
    this.calls = []
    this.text = 'Primeiro: o que acontece quando dois pedidos chegam juntos?'
    this.chunks = null
    this.stopReason = 'end_turn'
    this.usage = {
      input_tokens: 1200,
      output_tokens: 180,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    }
    this.breakAfter = null
    this.breakError = new Error('socket hang up')
    this.throwOnCall = null
  }

  /** The request body of the last (or only) call. */
  get last(): AnthropicCall {
    const call = this.calls.at(-1)
    if (!call) throw new Error('[anthropic-mock] no call was made')
    return call
  }

  /** Every piece of text in the last request: system blocks and all turns. */
  get lastTexts(): string[] {
    const out: string[] = []
    const walk = (value: unknown): void => {
      if (typeof value === 'string') {
        out.push(value)
        return
      }
      if (Array.isArray(value)) {
        for (const item of value) walk(item)
        return
      }
      if (value && typeof value === 'object') {
        const o = value as Record<string, unknown>
        if (typeof o.text === 'string') out.push(o.text)
        if (o.content !== undefined) walk(o.content)
      }
    }
    walk(this.last.system)
    walk(this.last.messages)
    return out
  }

  /** The whole request as one string, for "does X appear anywhere" checks. */
  get lastPrompt(): string {
    return this.lastTexts.join('\n')
  }

  get lastRoles(): string[] {
    return this.last.messages.map((m) => m.role)
  }

  private pieces(): string[] {
    return this.chunks ?? [this.text]
  }

  message() {
    return {
      content: [{ type: 'text', text: this.pieces().join('') }],
      stop_reason: this.stopReason,
      usage: this.usage,
    }
  }

  stream(params: AnthropicCall) {
    if (this.throwOnCall) throw this.throwOnCall
    this.calls.push(params)
    const pieces = this.pieces()
    const breakAfter = this.breakAfter
    const breakError = this.breakError
    const message = this.message()

    async function* iterate() {
      for (let i = 0; i < pieces.length; i++) {
        if (breakAfter !== null && i >= breakAfter) throw breakError
        yield {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text_delta', text: pieces[i] },
        }
      }
      if (breakAfter !== null && breakAfter >= pieces.length) throw breakError
    }

    return {
      [Symbol.asyncIterator]: () => iterate(),
      finalMessage: async () => {
        if (breakAfter !== null) throw breakError
        return message
      },
    }
  }
}

export const anthropicMock = new Recorder()

class MockAnthropic {
  static APIError = MockApiError
  static RateLimitError = MockRateLimitError
  static AuthenticationError = MockAuthenticationError

  messages = {
    stream: (params: AnthropicCall) => anthropicMock.stream(params),
  }
}

export { MockAnthropic }

/** What `vi.mock('@anthropic-ai/sdk')` should return. */
export const anthropicModule = { default: MockAnthropic }
