// LABS01-204 — /api/design-review: the route the design track depends on.
//
// Two reasons this one carries more weight than its three siblings. It was
// missing from the original Day 3 plan and had the same conditional-guard hole
// as /api/review. And it is where the only trustworthy evidence in the whole
// scoring rule is produced: `node_count` and `edge_count` are counted HERE, by
// the server, from the scene it stores — the design track has no tests, so
// after LABS01-215 removes the code track this is the entire correctness
// signal behind the ranking.

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

import { anthropicMock } from '@/test/anthropic-mock'
import { requestHeaders } from '@/test/next-headers-mock'
import { supabaseMock } from '@/test/supabase-mock'
import { POST } from './route'

const TOKEN = 'token-do-aluno'

const SCENE = JSON.stringify({
  nodes: [
    { id: 'web', label: 'Web' },
    { id: 'api', label: 'API' },
    { id: 'db', label: 'Postgres' },
  ],
  edges: [
    { source: 'web', target: 'api' },
    { source: 'api', target: 'db' },
    // aresta pendurada: um dos lados não existe
    { source: 'api', target: 'fantasma' },
  ],
})

function post(body: unknown, token: string | null = TOKEN): Request {
  return new Request('http://localhost/api/design-review', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/design-review', () => {
  let userId: string

  beforeEach(() => {
    supabaseMock.reset()
    anthropicMock.reset()
    requestHeaders.reset()
    userId = supabaseMock.seedUser(TOKEN)
    anthropicMock.text = 'Onde esse cache invalida?'
  })

  it('responde 401 sem token', async () => {
    const res = await POST(post({ summary: 'três caixas' }, null))
    expect(res.status).toBe(401)
    expect(anthropicMock.calls).toHaveLength(0)
  })

  it('responde 400 sem session_id', async () => {
    const res = await POST(post({ summary: 'três caixas' }))
    expect(res.status).toBe(400)
    expect(anthropicMock.calls).toHaveLength(0)
    expect(supabaseMock.rows('code_submissions')).toHaveLength(0)
  })

  it('responde 403 na sessão de outro usuário, sem gastar token nem gravar', async () => {
    const outro = supabaseMock.seedUser('token-do-outro')
    const { sessionId } = supabaseMock.seedSession({
      userId: outro,
      kind: 'design',
    })

    const res = await POST(post({ summary: 'três caixas', session_id: sessionId }))
    expect(res.status).toBe(403)
    expect(anthropicMock.calls).toHaveLength(0)
    expect(supabaseMock.rows('code_submissions')).toHaveLength(0)
  })

  it('usa título e briefing do banco e ignora os do corpo', async () => {
    const { sessionId } = supabaseMock.seedSession({
      userId,
      kind: 'design',
      title: 'Catálogo com 10M de leituras',
      briefing: 'A home cai no horário de pico.',
    })

    const res = await POST(
      post({
        summary: 'três caixas',
        scene: SCENE,
        session_id: sessionId,
        title: 'FORJADO-TITULO',
        brief: 'FORJADO-BRIEFING',
      }),
    )
    expect(res.status).toBe(200)
    expect(anthropicMock.lastPrompt).toContain('Catálogo com 10M de leituras')
    expect(anthropicMock.lastPrompt).toContain('A home cai no horário de pico.')
    expect(anthropicMock.lastPrompt).not.toContain('FORJADO')
  })

  it('conta o grafo no servidor e ignora a contagem do corpo', async () => {
    const { sessionId } = supabaseMock.seedSession({ userId, kind: 'design' })

    const res = await POST(
      post({
        summary: 'três caixas',
        scene: SCENE,
        session_id: sessionId,
        // o que um cliente forjado mandaria para satisfazer o portão
        node_count: 99,
        edge_count: 99,
      }),
    )
    expect(res.status).toBe(200)

    const [row] = supabaseMock.rows('code_submissions')
    expect(row.node_count).toBe(3)
    // a aresta pendurada não conta
    expect(row.edge_count).toBe(2)
    expect(row.code).toBe(SCENE)
  })

  it('grava contagem nula quando não há cena para contar', async () => {
    const { sessionId } = supabaseMock.seedSession({ userId, kind: 'design' })

    await POST(post({ summary: 'três caixas', session_id: sessionId }))

    const [row] = supabaseMock.rows('code_submissions')
    expect(row.node_count).toBeNull()
    expect(row.edge_count).toBeNull()
    // sem cena, o que sobra é o resumo em texto — o formato histórico
    expect(row.code).toBe('três caixas')
  })

  it('grava contagem nula quando a cena não é um grafo', async () => {
    const { sessionId } = supabaseMock.seedSession({ userId, kind: 'design' })

    await POST(
      post({
        summary: 'três caixas',
        scene: '{"nao":"é um grafo"}',
        session_id: sessionId,
      }),
    )

    const [row] = supabaseMock.rows('code_submissions')
    expect(row.node_count).toBeNull()
    expect(row.edge_count).toBeNull()
  })

  it('manda a imagem do canvas quando ela vem no corpo', async () => {
    const { sessionId } = supabaseMock.seedSession({ userId, kind: 'design' })

    const res = await POST(
      post({
        summary: 'três caixas',
        scene: SCENE,
        imageBase64: 'iVBORw0KGgo=',
        session_id: sessionId,
      }),
    )
    expect(res.status).toBe(200)

    const content = anthropicMock.last.messages[0].content as {
      type: string
      source?: { data: string }
    }[]
    expect(content.map((b) => b.type)).toEqual(['image', 'text'])
    expect(content[0].source?.data).toBe('iVBORw0KGgo=')
    // a contagem continua vindo da cena, não da imagem
    expect(supabaseMock.rows('code_submissions')[0].node_count).toBe(3)
  })

  it('guarda a evidência mesmo quando a IA falha', async () => {
    const { sessionId } = supabaseMock.seedSession({ userId, kind: 'design' })
    anthropicMock.throwOnCall = new Error('socket hang up')

    const res = await POST(
      post({ summary: 'três caixas', scene: SCENE, session_id: sessionId }),
    )
    expect(res.status).toBe(500)

    const [row] = supabaseMock.rows('code_submissions')
    expect(row.node_count).toBe(3)
    expect(row.review_response).toBeNull()
  })
})
