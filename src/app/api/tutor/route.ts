import type { ChallengeKind } from '@/domain/challenge-kinds'
import {
  aiErrorResponse,
  askClaudeStream,
  type ChatTurn,
  type TextBlock,
} from '@/lib/ai/client'
import { captureException } from '@/lib/report-error'
import { solveSystem, solveTask } from '@/lib/ai/prompts/solve'
import { hintGuide, tutorSystem, tutorTask } from '@/lib/ai/prompts/tutor'
import type { ChatMsg } from '@/lib/ai/types'
import {
  CAPS,
  jsonError,
  notOwner,
  ownsSession,
  rateLimit,
  requireUser,
  tooLarge,
  tooMany,
} from '@/lib/api/guard'
import { consumeHints } from '@/lib/api/hints-server'
import { getLocale } from '@/lib/i18n/server'

type Mode = 'reply' | 'hint' | 'solve'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const auth = await requireUser(req)
    if (auth instanceof Response) return auth
    const userId = auth.user.id

    if (!(await rateLimit(`tutor:${userId}`, 40, 60_000))) return tooMany()

    const body = await req.json()
    const kind: ChallengeKind = body.domain === 'design' ? 'design' : 'code'
    const mode: Mode =
      body.mode === 'hint' ? 'hint' : body.mode === 'solve' ? 'solve' : 'reply'
    const messages: ChatMsg[] = Array.isArray(body.messages)
      ? body.messages
      : []
    const work: string = body.code ?? ''
    const title: string = body.title ?? ''
    const briefing: string = body.briefing ?? ''
    const sessionId: string | undefined = body.session_id

    if (work.length > CAPS.text) return tooLarge()
    if (messages.reduce((n, m) => n + (m.text?.length ?? 0), 0) > CAPS.transcript)
      return tooLarge()

    let remaining: number | undefined
    if (mode === 'hint' || mode === 'solve') {
      if (!sessionId) return jsonError('session_id é obrigatório.', 400)
      // LABS01-201: hints and solves are charged to the session's owner.
      if (!(await ownsSession(userId, sessionId))) return notOwner()
      const level = mode === 'solve' ? 3 : (Number(body.hintLevel) || 1)
      const cost = mode === 'solve' ? 5 : 1
      const r = await consumeHints(
        userId,
        sessionId,
        (level as 1 | 2 | 3),
        cost,
        mode === 'solve',
      )
      if (r === null) return jsonError('Limite de hints atingido.', 429)
      remaining = r
    }

    const locale = await getLocale()
    const systemText =
      mode === 'solve' ? solveSystem(kind, locale) : tutorSystem(kind, locale)

    // Two cache breakpoints on the system side: the shared tutor prompt
    // (reused across all users) and the per-challenge context.
    const system: TextBlock[] = [
      {
        type: 'text',
        text: systemText,
        cache_control: { type: 'ephemeral' },
      },
      {
        type: 'text',
        text: `Desafio: ${title}\nBriefing do cliente: ${briefing}`,
        cache_control: { type: 'ephemeral' },
      },
    ]

    const task =
      mode === 'solve'
        ? solveTask(kind)
        : mode === 'hint'
          ? hintGuide(kind, (Number(body.hintLevel) || 1) as 1 | 2 | 3)
          : tutorTask(kind)

    // Real multi-turn history so the conversation prefix caches and grows
    // incrementally; the breakpoint sits on the last history turn. Volatile
    // content (current code + task) goes after it, in the final user turn.
    const history: ChatTurn[] = messages.map((m) => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.text ?? '',
    }))
    if (!history.length || history[0].role !== 'user') {
      history.unshift({ role: 'user', content: '(início — primeira interação)' })
    }
    const last = history[history.length - 1]
    last.content = [
      {
        type: 'text',
        text: typeof last.content === 'string' ? last.content : '',
        cache_control: { type: 'ephemeral' },
      },
    ]

    const finalUser = [
      kind === 'design'
        ? 'Estado atual do diagrama (resumo):'
        : 'Código atual do aluno:',
      kind === 'design'
        ? work || '(canvas vazio)'
        : `\`\`\`\n${work || '(vazio)'}\n\`\`\``,
      '',
      task,
    ].join('\n')

    const stream = askClaudeStream({
      system,
      messages: [...history, { role: 'user', content: finalUser }],
      maxTokens: mode === 'solve' ? 2600 : 1024,
      effort: 'medium',
      meta: { route: 'tutor', mode, userId, sessionId },
    })

    const iterator = stream[Symbol.asyncIterator]()
    let first: IteratorResult<{ type: string }>
    try {
      first = await iterator.next()
    } catch (e) {
      return aiErrorResponse(e)
    }

    const encoder = new TextEncoder()
    const responseBody = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          let cur = first
          while (!cur.done) {
            const event = cur.value as {
              type: string
              delta?: { type: string; text?: string }
            }
            if (
              event.type === 'content_block_delta' &&
              event.delta?.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text ?? ''))
            }
            cur = await iterator.next()
          }
          controller.close()
        } catch (e) {
          captureException(e)
          controller.error(e)
        }
      },
    })

    const headers: Record<string, string> = {
      'Content-Type': 'text/plain; charset=utf-8',
    }
    if (typeof remaining === 'number') {
      headers['X-Hints-Remaining'] = String(remaining)
    }
    return new Response(responseBody, { headers })
  } catch (e) {
    return aiErrorResponse(e)
  }
}
