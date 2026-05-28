import type { ChallengeKind } from '@/domain/challenge-kinds'
import { aiErrorResponse, askClaude } from '@/lib/ai/client'
import { solveSystem, solveTask } from '@/lib/ai/prompts/solve'
import { hintGuide, tutorSystem, tutorTask } from '@/lib/ai/prompts/tutor'
import type { ChatMsg } from '@/lib/ai/types'
import {
  CAPS,
  jsonError,
  rateLimit,
  requireUser,
  tooLarge,
  tooMany,
} from '@/lib/api/guard'
import { consumeHints } from '@/lib/api/hints-server'

type Mode = 'reply' | 'hint' | 'solve'

export async function POST(req: Request) {
  try {
    const auth = await requireUser(req)
    if (auth instanceof Response) return auth
    const userId = auth.user.id

    if (!rateLimit(`tutor:${userId}`, 40, 60_000)) return tooMany()

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
      const level = mode === 'solve' ? 3 : (Number(body.hintLevel) || 1)
      const cost = mode === 'solve' ? 5 : 1
      const r = await consumeHints(
        userId,
        sessionId,
        (level as 1 | 2 | 3),
        cost,
      )
      if (r === null) return jsonError('Limite de hints atingido.', 429)
      remaining = r
    }

    const system = mode === 'solve' ? solveSystem(kind) : tutorSystem(kind)

    const transcript = messages
      .map((m) => `${m.role === 'ai' ? 'Tutor' : 'Aluno'}: ${m.text}`)
      .join('\n')

    const task =
      mode === 'solve'
        ? solveTask(kind)
        : mode === 'hint'
          ? hintGuide(kind, (Number(body.hintLevel) || 1) as 1 | 2 | 3)
          : tutorTask(kind)

    const user = [
      `Desafio: ${title}`,
      `Briefing do cliente: ${briefing}`,
      '',
      kind === 'design'
        ? 'Estado atual do diagrama (resumo):'
        : 'Código atual do aluno:',
      kind === 'design'
        ? work || '(canvas vazio)'
        : `\`\`\`\n${work || '(vazio)'}\n\`\`\``,
      '',
      'Conversa até agora:',
      transcript || '(início — primeira interação)',
      '',
      task,
    ].join('\n')

    const text = await askClaude({
      system,
      user,
      maxTokens: mode === 'solve' ? 2048 : 800,
      effort: 'medium',
    })
    return Response.json({ text, remaining })
  } catch (e) {
    return aiErrorResponse(e)
  }
}
