import { aiErrorResponse, askClaude } from '@/lib/ai/client'

const CODE_SYS = `Você resolve um desafio de programação. Retorne APENAS o código da solução final, completo e correto, na linguagem da stack, com "export" nas funções pedidas. SEM markdown, SEM cercas de código, SEM explicação — somente o código que vai direto no editor.`

const DESIGN_SYS = `Você resolve um desafio de SYSTEM DESIGN (arquitetura) para INICIANTES — seja didático, explique como para quem nunca viu arquitetura.
Responda APENAS com JSON válido (sem markdown):
{ "nodes": [{ "id": string, "label": string, "type": string, "note": string }], "edges": [{ "from": string, "to": string, "label": string }] }
- nodes: 4 a 7 componentes. "type" DEVE ser um de: "client","gateway","service","database","cache","queue","storage","external".
- "label": nome curto (ex.: "API de pedidos", "Postgres", "Redis"). "note": o que ele faz, em LINGUAGEM SIMPLES, no máximo 6 palavras (ex.: "guarda os pedidos", "deixa a leitura rápida", "avisa outros serviços").
- edges: "label" = a ação/dado que flui, 1 a 3 palavras (ex.: "envia pedido", "consulta", "salva", "avisa"). from/to = ids de nodes existentes.
- Português do Brasil, tom de quem ensina um leigo.`

function stripFences(raw: string): string {
  const f = raw.match(/```(?:[a-z]*)?\s*([\s\S]*?)```/i)
  return (f ? f[1] : raw).trim()
}

function parseJson(raw: string): Record<string, unknown> {
  const f = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  return JSON.parse((f ? f[1] : raw).trim())
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const kind = body.kind === 'design' ? 'design' : 'code'
    const work: string = body.work ?? ''
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
        maxTokens: 1500,
        effort: 'medium',
      })
      const json = parseJson(raw)
      return Response.json({
        nodes: Array.isArray(json.nodes) ? json.nodes : [],
        edges: Array.isArray(json.edges) ? json.edges : [],
      })
    }

    const raw = await askClaude({
      system: CODE_SYS,
      user,
      maxTokens: 2048,
      effort: 'medium',
    })
    return Response.json({ code: stripFences(raw) })
  } catch (e) {
    return aiErrorResponse(e)
  }
}
