import { aiErrorResponse, askClaude, askClaudeVision } from '@/lib/ai/client'
import { reviewSystem } from '@/lib/ai/prompts/review'
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
import { getLocale } from '@/lib/i18n/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const maxDuration = 60

export async function POST(req: Request) {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const userId = auth.user.id

  if (!(await rateLimit(`design-review:${userId}`, 20, 60_000))) return tooMany()

  const body = await req.json().catch(() => ({}))
  const summary: string = body.summary ?? ''
  const imageBase64: string | undefined = body.imageBase64
  const scene: string | undefined = body.scene
  const sessionId: string | undefined = body.session_id

  if (imageBase64 && imageBase64.length > CAPS.imageBase64) return tooLarge()
  if (summary.length > CAPS.text) return tooLarge()

  // LABS01-201: same as /api/review — the submission is what /replay/[id]
  // renders publicly.
  // LABS01-208: and the same conditional-guard hole — the rubric graded
  // against `body.title` / `body.brief`, which the student could write. This
  // route was missing from the original Day 3 plan; the design track is the
  // product's focus from Day 10 on, and LABS01-211's rubric needs a briefing
  // that cannot be edited.
  if (!sessionId) return jsonError('session_id é obrigatório.', 400)
  const ctx = await sessionContext(userId, sessionId)
  if (!ctx) return notOwner()

  const userText = [
    `Desafio: ${ctx.title}`,
    `Briefing do cliente: ${ctx.briefing}`,
    `Resumo do diagrama: ${summary}`,
    '',
    'Revise o diagrama de arquitetura.',
  ].join('\n')

  let review: string | null = null
  let aiError: unknown = null
  try {
    const system = reviewSystem('design', await getLocale())
    review = imageBase64
      ? await askClaudeVision({
          system,
          userText,
          imageBase64,
          maxTokens: 1024,
          effort: 'low',
          meta: {
            route: 'design-review',
            mode: 'vision',
            userId,
            sessionId,
          },
        })
      : await askClaude({
          system,
          user: userText,
          maxTokens: 1024,
          effort: 'low',
          meta: { route: 'design-review', mode: 'text', userId, sessionId },
        })
  } catch (e) {
    aiError = e
  }

  if (userId) {
    await supabaseAdmin.from('code_submissions').insert({
      session_id: sessionId,
      user_id: userId,
      code: scene ?? summary,
      review_response: review,
    })
  }

  if (aiError) return aiErrorResponse(aiError)
  return Response.json({ review })
}
