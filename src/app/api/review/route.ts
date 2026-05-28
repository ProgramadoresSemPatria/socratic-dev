import { aiErrorResponse, askClaude } from '@/lib/ai/client'
import { reviewSystem } from '@/lib/ai/prompts/review'
import {
  CAPS,
  jsonError,
  rateLimit,
  requireUser,
  tooLarge,
  tooMany,
} from '@/lib/api/guard'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const userId = auth.user.id

  if (!rateLimit(`review:${userId}`, 20, 60_000)) return tooMany()

  const body = await req.json().catch(() => ({}))
  const code: string = body.code ?? ''
  const title: string = body.title ?? ''
  const briefing: string = body.briefing ?? ''
  const sessionId: string | undefined = body.session_id
  const testsPassed: number = body.tests_passed ?? 0
  const testsTotal: number = body.tests_total ?? 0

  if (!code) return jsonError('code é obrigatório', 400)
  if (code.length > CAPS.text) return tooLarge()

  const testLine =
    testsTotal > 0
      ? `Testes automáticos: passou ${testsPassed}/${testsTotal}.${testsPassed < testsTotal ? ' O código AINDA NÃO resolve o desafio — foque no que está falhando.' : ' Está resolvido — agora questione as escolhas.'}`
      : 'Sem testes automáticos.'

  const user = [
    `Desafio: ${title}`,
    `Briefing do cliente: ${briefing}`,
    testLine,
    '',
    'Código submetido:',
    '```',
    code,
    '```',
    '',
    'Faça o review.',
  ].join('\n')

  let review: string | null = null
  let aiError: unknown = null
  try {
    review = await askClaude({
      system: reviewSystem('code'),
      user,
      maxTokens: 1024,
      effort: 'low',
    })
  } catch (e) {
    aiError = e
  }

  if (sessionId && userId) {
    await supabaseAdmin.from('code_submissions').insert({
      session_id: sessionId,
      user_id: userId,
      code,
      review_response: review,
    })
  }

  if (aiError) return aiErrorResponse(aiError)
  return Response.json({ review })
}
