import { aiErrorResponse, askClaude } from '@/lib/ai/client'
import {
  CAPS,
  jsonError,
  rateLimit,
  requireUser,
  tooLarge,
  tooMany,
} from '@/lib/api/guard'
import { consumeHints, getBalance } from '@/lib/api/hints-server'
import { SOLVE_COST } from '@/lib/hints'

const CODE_SYS = `Você resolve um desafio de programação. Retorne APENAS o código da solução final, completo e correto, na linguagem da stack, com "export" nas funções pedidas. SEM markdown, SEM cercas de código, SEM explicação — somente o código que vai direto no editor.`

const DESIGN_SYS = `Você resolve um desafio de SYSTEM DESIGN (arquitetura) para INICIANTES — seja didático, explique como para quem nunca viu arquitetura.
Responda APENAS com JSON válido (sem markdown):
{ "nodes": [{ "id": string, "label": string, "type": string, "note": string }], "edges": [{ "from": string, "to": string, "label": string }] }
- nodes: 4 a 7 componentes. "type" DEVE ser um de: "client","gateway","service","database","cache","queue","storage","external".
- "label": nome curto (ex.: "API de pedidos", "Postgres", "Redis"). "note": o que ele faz, em LINGUAGEM SIMPLES, no máximo 6 palavras (ex.: "guarda os pedidos", "deixa a leitura rápida", "avisa outros serviços").
- edges: "label" = a ação/dado que flui, 1 a 3 palavras (ex.: "envia pedido", "consulta", "salva", "avisa"). from/to = ids de nodes existentes.
- Prefira um FLUXO LINEAR de cima pra baixo (cliente → gateway → serviço → dados). Use poucas arestas (idealmente 1 por par) e evite ligar o mesmo nó a vários ao mesmo tempo, pra ficar legível.
- Varie os "type" (não use "service" pra tudo) — assim o diagrama fica em camadas distintas.
- Português do Brasil, tom de quem ensina um leigo.`

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
    const kind = body.kind === 'design' ? 'design' : 'code'
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
        system: DESIGN_SYS,
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
      system: CODE_SYS,
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
