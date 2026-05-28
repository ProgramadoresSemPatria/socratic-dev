import { aiErrorResponse, askClaude } from '@/lib/ai/client'
import { supabaseAdmin } from '@/lib/supabase-server'

const SYSTEM = `Você gera desafios de programação realistas para uma plataforma de tutoria socrática.
Responda APENAS com um objeto JSON válido (sem markdown, sem comentários), com exatamente estas chaves:
{ "title": string, "description": string, "client_briefing": string, "intro": string, "initial_code": string, "tests_source": string }

Regras:
- title: curto e concreto. description: 1 frase do que implementar.
- client_briefing: 2 a 4 frases, com um cliente fictício e o FORMATO dos dados de entrada.
- intro: a primeira fala do tutor socrático — uma pergunta que faça o aluno pensar. NUNCA a resposta.
- initial_code: a(s) assinatura(s) da(s) função(ões) com "export", corpo vazio e comentários. SEM a solução. Código válido na linguagem da stack.
- tests_source: testes no formato test('nome', () => { expect(exports.NOME(args)).toBe(valor) }). Use exports.<funcao> para acessar a solução do aluno. Cubra os edge cases adequados ao nível.
- Tudo em português do Brasil. A DIFICULDADE deve seguir estritamente o nível pedido.`

const LEVEL_GUIDE: Record<string, string> = {
  beginner:
    'Nível INICIANTE: variáveis, condicionais, loops, arrays e strings. UMA função simples, sem algoritmos complexos. 2 a 3 testes diretos.',
  intermediate:
    'Nível INTERMEDIÁRIO: estruturas de dados (Map/Set), manipulação de objetos e arrays, async/await, e vários edge cases. Problema realista de produto. 3 a 4 testes, incluindo casos de borda.',
  advanced:
    'Nível AVANÇADO, pegada de entrevista de BIG TECH (Google, Meta, Amazon): algoritmo ou estrutura de dados NÃO-trivial, exija complexidade de tempo/espaço ótima, e cubra muitos edge cases (entrada vazia, muito grande, duplicados, limites/overflow). Inspire-se em problemas estilo LeetCode Hard / entrevista FAANG, mas embrulhados num briefing de cliente realista. 4 a 6 testes, incluindo os casos de borda difíceis. O initial_code pode ter assinatura com a complexidade esperada no comentário.',
}

function parseJson(raw: string): Record<string, unknown> {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  const text = (fenced ? fenced[1] : raw).trim()
  return JSON.parse(text)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const stack = body.stack === 'javascript' ? 'javascript' : 'typescript'
    const level: 'beginner' | 'intermediate' | 'advanced' =
      body.level === 'intermediate' || body.level === 'advanced'
        ? body.level
        : 'beginner'

    const raw = await askClaude({
      system: SYSTEM,
      user: `Gere um desafio novo. stack: ${stack}. nível: ${level}.\n\n${LEVEL_GUIDE[level]}`,
      maxTokens: level === 'advanced' ? 6000 : 4096,
      effort: 'high',
    })

    const json = parseJson(raw)
    const row = {
      title: String(json.title ?? 'Desafio'),
      description: String(json.description ?? ''),
      stack,
      level,
      client_briefing: String(json.client_briefing ?? ''),
      intro: String(json.intro ?? ''),
      initial_code: String(json.initial_code ?? ''),
      tests_source: String(json.tests_source ?? ''),
    }

    const { data, error } = await supabaseAdmin
      .from('challenges')
      .insert(row as never)
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }
    return Response.json(data, { status: 201 })
  } catch (e) {
    return aiErrorResponse(e)
  }
}
