import type { ChallengeKind } from '@/domain/challenge-kinds'
import { aiErrorResponse, askClaude } from '@/lib/ai/client'
import { solvePasteSystem } from '@/lib/ai/prompts/solve-paste'
import {
  CAPS,
  jsonError,
  rateLimit,
  requireUser,
  tooLarge,
  tooMany,
} from '@/lib/api/guard'
import { consumeHints, getBalance } from '@/lib/api/hints-server'
import { SOLVE_COST } from '@/features/hints/constants'

function stripFences(raw: string): string {
  const f = raw.match(/```(?:[a-z]*)?\s*([\s\S]*?)```/i)
  return (f ? f[1] : raw).trim()
}

function parseJson(raw: string): Record<string, unknown> {
  let s = raw.trim()
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start !== -1 && end > start) s = s.slice(start, end + 1)
  return JSON.parse(s)
}

export async function POST(req: Request) {
  try {
    const auth = await requireUser(req)
    if (auth instanceof Response) return auth
    const userId = auth.user.id

    if (!rateLimit(`solve:${userId}`, 10, 60_000)) return tooMany()

    const body = await req.json()
    const kind: ChallengeKind = body.kind === 'design' ? 'design' : 'code'
    const work: string = body.work ?? ''
    const sessionId: string | undefined = body.session_id

    if (work.length > CAPS.text) return tooLarge()
    if (!sessionId) return jsonError('session_id é obrigatório.', 400)

    const balance = await getBalance(userId)
    if (balance.remaining < SOLVE_COST)
      return jsonError('Hints insuficientes para resolver.', 429)

    const user = [
      `Desafio: ${body.title ?? ''}`,
      `Briefing: ${body.briefing ?? ''}`,
      kind === 'design'
        ? `Diagrama atual (resumo): ${work}`
        : `Código atual do aluno:\n${work}`,
    ].join('\n')

    if (kind === 'design') {
      const raw = await askClaude({
        system: solvePasteSystem('design'),
        user,
        maxTokens: 1800,
        effort: 'medium',
      })
      const json = parseJson(raw)
      const nodes = Array.isArray(json.nodes) ? json.nodes : []
      const edges = Array.isArray(json.edges) ? json.edges : []
      if (nodes.length === 0)
        return jsonError('Não consegui montar o diagrama. Tente de novo.', 502)
      const remaining = await consumeHints(userId, sessionId, 3, SOLVE_COST)
      return Response.json({ nodes, edges, remaining })
    }

    const raw = await askClaude({
      system: solvePasteSystem('code'),
      user,
      maxTokens: 2048,
      effort: 'medium',
    })
    const code = stripFences(raw)
    const remaining = await consumeHints(userId, sessionId, 3, SOLVE_COST)
    return Response.json({ code, remaining })
  } catch (e) {
    return aiErrorResponse(e)
  }
}
