import {
  aiErrorResponse,
  askClaudeStream,
  type TextBlock,
} from '@/lib/ai/client'
import { captureException } from '@/lib/report-error'
import { solveSystem, solveTask } from '@/lib/ai/prompts/solve'
import { hintGuide, tutorSystem, tutorTask } from '@/lib/ai/prompts/tutor'
import { buildHistory } from '@/lib/ai/tutor-history'
import {
  CAPS,
  jsonError,
  notOwner,
  rateLimit,
  requireUser,
  tooLarge,
  tooMany,
} from '@/lib/api/guard'
import { sessionContext } from '@/lib/api/session-context'
import { loadTranscript, saveTurns } from '@/lib/api/tutor-transcript'
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
    const mode: Mode =
      body.mode === 'hint' ? 'hint' : body.mode === 'solve' ? 'solve' : 'reply'
    const work: string = body.code ?? ''
    // The only thing the client still contributes to the conversation: the
    // message the student just typed. Roles, title, briefing and tests are
    // read on the server (LABS01-208 / audit 3.3).
    const text: string = typeof body.text === 'string' ? body.text : ''
    const sessionId: string | undefined = body.session_id

    if (work.length > CAPS.text) return tooLarge()
    if (text.length > CAPS.text) return tooLarge()

    // Every mode needs the session now: it is where the challenge comes from.
    // `reply` used to pass without one, which is what forced title/briefing to
    // travel in the body in the first place.
    if (!sessionId) return jsonError('session_id é obrigatório.', 400)
    const ctx = await sessionContext(userId, sessionId)
    if (!ctx) return notOwner()
    const kind = ctx.kind

    let remaining: number | undefined
    if (mode === 'hint' || mode === 'solve') {
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
        text: `Desafio: ${ctx.title}\nBriefing do cliente: ${ctx.briefing}`,
        cache_control: { type: 'ephemeral' },
      },
    ]

    const task =
      mode === 'solve'
        ? solveTask(kind)
        : mode === 'hint'
          ? hintGuide(kind, (Number(body.hintLevel) || 1) as 1 | 2 | 3)
          : tutorTask(kind)

    // Real multi-turn history, rebuilt from the stored transcript so the
    // conversation prefix caches and grows incrementally. Volatile content
    // (current code + task) goes after the breakpoint, in the final user turn.
    const history = buildHistory(await loadTranscript(userId, sessionId), text)

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

    // LABS01-203: the spend cap is reserved inside askClaudeStream, which is
    // after consumeHints above — so in theory a hint could be debited for an
    // answer the cap then refuses. It cannot happen to a legitimate user: 35
    // free hints a week is at most US$ 0.67 of AI a month, against a US$ 3
    // monthly cap. Reaching the cap means spending on the hint-free surfaces
    // too, deliberately.
    const stream = await askClaudeStream({
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
      // Nothing was produced, so the turn never happened: keep the student's
      // message out of the transcript rather than record a question the tutor
      // never saw an answer to.
      return aiErrorResponse(e)
    }

    const encoder = new TextEncoder()
    const responseBody = new ReadableStream<Uint8Array>({
      async start(controller) {
        let reply = ''
        // Persisting before close keeps the write inside the request: the
        // response body is still open, so the worker is still alive.
        const persist = () =>
          saveTurns(userId, sessionId, [
            { role: 'user', content: text },
            { role: 'assistant', content: reply },
          ])
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
              const chunk = event.delta.text ?? ''
              reply += chunk
              controller.enqueue(encoder.encode(chunk))
            }
            cur = await iterator.next()
          }
          await persist()
          controller.close()
        } catch (e) {
          captureException(e)
          // The student read whatever arrived, so it is part of the
          // conversation even though the stream broke.
          await persist()
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
