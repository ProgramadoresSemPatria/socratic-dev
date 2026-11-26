// LABS01-204 — /api/review: the guard that used to be optional, and the
// evidence the award reads.
//
// Until Day 3 the ownership check here was written `if (sessionId && ...)`:
// omitting `session_id` skipped it entirely and still spent tokens. That is
// the shape of hole a test catches and a reading does not, because the code
// looks like it checks.
//
// The submission this route writes is also what award_session_points now
// requires as evidence (LABS01-219), so the columns it records are part of the
// scoring rule, not telemetry.

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

import { periodKeys } from '@/lib/ai/budget'
import { anthropicMock } from '@/test/anthropic-mock'
import { requestHeaders } from '@/test/next-headers-mock'
import { supabaseMock } from '@/test/supabase-mock'
import { POST } from './route'

const TOKEN = 'token-do-aluno'

function post(body: unknown, token: string | null = TOKEN): Request {
  return new Request('http://localhost/api/review', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/review', () => {
  let userId: string

  beforeEach(() => {
    supabaseMock.reset()
    anthropicMock.reset()
    requestHeaders.reset()
    userId = supabaseMock.seedUser(TOKEN)
    anthropicMock.text = 'Por que você escolheu um array e não um mapa?'
  })

  it('responde 401 sem token', async () => {
    const res = await POST(post({ code: 'const x = 1' }, null))
    expect(res.status).toBe(401)
    expect(anthropicMock.calls).toHaveLength(0)
  })

  it('responde 400 sem código', async () => {
    const { sessionId } = supabaseMock.seedSession({ userId })
    const res = await POST(post({ session_id: sessionId }))
    expect(res.status).toBe(400)
    expect(anthropicMock.calls).toHaveLength(0)
  })

  it('responde 400 sem session_id — a checagem não é mais opcional', async () => {
    const res = await POST(post({ code: 'const x = 1' }))
    expect(res.status).toBe(400)
    expect(anthropicMock.calls).toHaveLength(0)
    expect(supabaseMock.rows('code_submissions')).toHaveLength(0)
  })

  it('responde 403 na sessão de outro usuário, sem gastar token nem gravar', async () => {
    const outro = supabaseMock.seedUser('token-do-outro')
    const { sessionId } = supabaseMock.seedSession({ userId: outro })

    const res = await POST(post({ code: 'const x = 1', session_id: sessionId }))
    expect(res.status).toBe(403)
    expect(anthropicMock.calls).toHaveLength(0)
    expect(supabaseMock.rows('code_submissions')).toHaveLength(0)
  })

  it('usa o briefing do banco e ignora o do corpo', async () => {
    const { sessionId } = supabaseMock.seedSession({
      userId,
      title: 'Fila de pedidos',
      briefing: 'O cliente perde pedidos no pico.',
    })

    const res = await POST(
      post({
        code: 'const x = 1',
        session_id: sessionId,
        title: 'FORJADO-TITULO',
        brief: 'FORJADO-BRIEFING',
        briefing: 'FORJADO-BRIEFING',
      }),
    )
    expect(res.status).toBe(200)
    expect(anthropicMock.lastPrompt).toContain('O cliente perde pedidos no pico.')
    expect(anthropicMock.lastPrompt).not.toContain('FORJADO')
  })

  it('grava o resultado dos testes na submissão (LABS01-219)', async () => {
    const { sessionId } = supabaseMock.seedSession({ userId })

    const res = await POST(
      post({
        code: 'const x = 1',
        session_id: sessionId,
        tests_passed: 3,
        tests_total: 3,
      }),
    )
    expect(res.status).toBe(200)

    const [row] = supabaseMock.rows('code_submissions')
    expect(row.session_id).toBe(sessionId)
    expect(row.user_id).toBe(userId)
    expect(row.tests_passed).toBe(3)
    expect(row.tests_total).toBe(3)
    expect(row.review_response).toBe('Por que você escolheu um array e não um mapa?')
  })

  it('normaliza contagens negativas ou fracionárias', async () => {
    const { sessionId } = supabaseMock.seedSession({ userId })

    await POST(
      post({
        code: 'const x = 1',
        session_id: sessionId,
        tests_passed: -5,
        tests_total: 2.7,
      }),
    )

    const [row] = supabaseMock.rows('code_submissions')
    expect(row.tests_passed).toBe(0)
    expect(row.tests_total).toBe(2)
  })

  it('diz ao revisor quando o código ainda não passa nos testes', async () => {
    const { sessionId } = supabaseMock.seedSession({ userId })

    await POST(
      post({
        code: 'const x = 1',
        session_id: sessionId,
        tests_passed: 1,
        tests_total: 4,
      }),
    )

    expect(anthropicMock.lastPrompt).toContain('passou 1/4')
    expect(anthropicMock.lastPrompt).toContain('AINDA NÃO resolve')
  })

  it('grava a submissão mesmo quando a IA falha', async () => {
    const { sessionId } = supabaseMock.seedSession({ userId })
    anthropicMock.throwOnCall = new Error('socket hang up')

    const res = await POST(
      post({
        code: 'const x = 1',
        session_id: sessionId,
        tests_passed: 2,
        tests_total: 2,
      }),
    )
    expect(res.status).toBe(500)

    // A evidência que o award lê não pode depender da IA ter respondido.
    const [row] = supabaseMock.rows('code_submissions')
    expect(row.tests_passed).toBe(2)
    expect(row.review_response).toBeNull()
  })

  it('responde 429 no teto de gasto, e ainda assim guarda a evidência', async () => {
    const { sessionId } = supabaseMock.seedSession({ userId })
    const { day } = periodKeys()
    supabaseMock.rpc('check_ai_budget', () => ({ data: `user:${userId}:${day}` }))

    const res = await POST(
      post({
        code: 'const x = 1',
        session_id: sessionId,
        tests_passed: 2,
        tests_total: 2,
      }),
    )
    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({
      error: 'Limite diário de uso de IA atingido. Tente de novo amanhã.',
    })
    expect(anthropicMock.calls).toHaveLength(0)
    expect(supabaseMock.rows('code_submissions')).toHaveLength(1)
  })
})
