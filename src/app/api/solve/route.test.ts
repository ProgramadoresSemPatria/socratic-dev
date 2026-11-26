// LABS01-204 — /api/solve: the guards and the prompt the student pays for.
//
// This route is the one Day 3 could not test at all: every happy-path run
// debits five hint credits from a real account and spends a real solve on the
// Anthropic bill, so the verification stopped at the 401/400/403 answers. With
// a synthetic user and a stand-in SDK it costs nothing.
//
// The case that matters most is `tests` (audit 3.3): the challenge's tests
// reach the prompt as "TESTES OBRIGATÓRIOS", so while the route read them from
// the request body an empty value turned a paid solve into an unconstrained
// code generator. They now come from the challenge behind the session.

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', async () => {
  const { supabaseMock } = await import('@/test/supabase-mock')
  return supabaseMock.module
})
vi.mock(
  '@anthropic-ai/sdk',
  async () => (await import('@/test/anthropic-mock')).anthropicModule,
)
vi.mock('next/headers', async () => await import('@/test/next-headers-mock'))

import { SOLVE_COST } from '@/features/hints/constants'
import { anthropicMock } from '@/test/anthropic-mock'
import { requestHeaders } from '@/test/next-headers-mock'
import { supabaseMock } from '@/test/supabase-mock'
import { POST } from './route'

const TOKEN = 'token-do-aluno'

function post(body: unknown, token: string | null = TOKEN): Request {
  return new Request('http://localhost/api/solve', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/solve', () => {
  let userId: string

  beforeEach(() => {
    supabaseMock.reset()
    anthropicMock.reset()
    requestHeaders.reset()
    userId = supabaseMock.seedUser(TOKEN)
    anthropicMock.text = '```js\nexport function fila() { return [] }\n```'
  })

  it('responde 401 sem token', async () => {
    const res = await POST(post({ work: 'x' }, null))
    expect(res.status).toBe(401)
    expect(supabaseMock.rpcArgs('consume_hints')).toHaveLength(0)
  })

  it('responde 400 sem session_id, sem debitar hint', async () => {
    const res = await POST(post({ work: 'x' }))
    expect(res.status).toBe(400)
    expect(supabaseMock.rpcArgs('consume_hints')).toHaveLength(0)
    expect(anthropicMock.calls).toHaveLength(0)
  })

  it('responde 403 na sessão de outro usuário, sem debitar hint', async () => {
    const outro = supabaseMock.seedUser('token-do-outro')
    const { sessionId } = supabaseMock.seedSession({ userId: outro })

    const res = await POST(post({ work: 'x', session_id: sessionId }))
    expect(res.status).toBe(403)
    // LABS01-201: a cobrança nunca cai na sessão alheia
    expect(supabaseMock.rpcArgs('consume_hints')).toHaveLength(0)
    expect(anthropicMock.calls).toHaveLength(0)
  })

  it('debita o solve antes de gerar e devolve o código', async () => {
    const { sessionId } = supabaseMock.seedSession({
      userId,
      title: 'Fila de pedidos',
      tests: "test('fila', () => expect(fila()).toEqual([]))",
    })

    const res = await POST(post({ work: '// rascunho', session_id: sessionId }))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { code: string; remaining: number }
    expect(body.code).toBe('export function fila() { return [] }')
    expect(body.remaining).toBe(34)

    const [args] = supabaseMock.rpcArgs('consume_hints')
    expect(args.p_session).toBe(sessionId)
    expect(args.p_user).toBe(userId)
    expect(args.p_cost).toBe(SOLVE_COST)
    expect(args.p_is_solve).toBe(true)
  })

  it('usa os testes do desafio e ignora os do corpo', async () => {
    const { sessionId } = supabaseMock.seedSession({
      userId,
      title: 'Fila de pedidos',
      briefing: 'O cliente perde pedidos no pico.',
      tests: "test('fila', () => expect(fila()).toEqual([]))",
    })

    await POST(
      post({
        work: '// rascunho',
        session_id: sessionId,
        title: 'FORJADO-TITULO',
        briefing: 'FORJADO-BRIEFING',
        tests: '',
      }),
    )

    const prompt = anthropicMock.lastPrompt
    expect(prompt).toContain('TESTES OBRIGATÓRIOS')
    expect(prompt).toContain("test('fila'")
    expect(prompt).toContain('Fila de pedidos')
    expect(prompt).not.toContain('FORJADO')
  })

  it('não inventa testes quando o desafio não tem, mesmo se o corpo mandar', async () => {
    const { sessionId } = supabaseMock.seedSession({ userId, tests: '' })

    await POST(
      post({
        work: '// rascunho',
        session_id: sessionId,
        tests: "test('forjado', () => expect(1).toBe(1))",
      }),
    )

    expect(anthropicMock.lastPrompt).not.toContain('TESTES OBRIGATÓRIOS')
    expect(anthropicMock.lastPrompt).not.toContain('forjado')
  })

  it('responde 429 quando não há hints suficientes, sem chamar a IA', async () => {
    const { sessionId } = supabaseMock.seedSession({ userId })
    supabaseMock.rpc('consume_hints', () => ({ data: null }))

    const res = await POST(post({ work: 'x', session_id: sessionId }))
    expect(res.status).toBe(429)
    expect(anthropicMock.calls).toHaveLength(0)
  })

  it('responde 502 quando a solução vem cortada pelo limite de tokens', async () => {
    const { sessionId } = supabaseMock.seedSession({ userId })
    anthropicMock.stopReason = 'max_tokens'

    const res = await POST(post({ work: 'x', session_id: sessionId }))
    expect(res.status).toBe(502)
  })

  it('monta o diagrama no desafio de design, seguindo o kind do banco', async () => {
    const { sessionId } = supabaseMock.seedSession({
      userId,
      kind: 'design',
      title: 'Catálogo com 10M de leituras',
    })
    anthropicMock.text = JSON.stringify({
      nodes: [
        { id: 'web', label: 'Web', type: 'client' },
        { id: 'api', label: 'API', type: 'service' },
        { id: 'db', label: 'Postgres', type: 'database' },
      ],
      edges: [
        { from: 'web', to: 'api' },
        { from: 'api', to: 'db' },
        // aresta para um nó que não existe: a rota tem de descartá-la
        { from: 'api', to: 'fantasma' },
      ],
    })

    const res = await POST(
      post({ work: 'um retângulo', session_id: sessionId, domain: 'code' }),
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      nodes: unknown[]
      edges: { from: string; to: string }[]
    }
    expect(body.nodes).toHaveLength(3)
    expect(body.edges).toHaveLength(2)
    expect(anthropicMock.lastPrompt).toContain('Catálogo com 10M de leituras')
  })
})
