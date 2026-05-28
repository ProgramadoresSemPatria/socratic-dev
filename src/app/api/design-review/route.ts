import { aiErrorResponse, askClaude, askClaudeVision } from '@/lib/ai/client'
import { CAPS, rateLimit, requireUser, tooLarge, tooMany } from '@/lib/api/guard'
import { supabaseAdmin } from '@/lib/supabase-server'

const SYSTEM = `Você é um staff engineer revisando o diagrama de ARQUITETURA (system design) de um aluno (imagem + resumo).
Responda em NO MÁXIMO 5 bullets (markdown), direto, sem floreio. NÃO redesenhe por ele.
- 1 a 2 bullets do que está bom.
- 1 a 2 bullets do que falta ou tem risco (onde os dados vivem, gargalos, distribuição/particionamento, consistência vs latência, ponto único de falha).
- 1 pergunta final que leve o aluno a melhorar sozinho.
Cada bullet com 1 ou 2 frases curtas. Português do Brasil.`

export async function POST(req: Request) {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const userId = auth.user.id

  if (!rateLimit(`design-review:${userId}`, 20, 60_000)) return tooMany()

  const body = await req.json().catch(() => ({}))
  const title: string = body.title ?? ''
  const brief: string = body.brief ?? ''
  const summary: string = body.summary ?? ''
  const imageBase64: string | undefined = body.imageBase64
  const scene: string | undefined = body.scene
  const sessionId: string | undefined = body.session_id

  if (imageBase64 && imageBase64.length > CAPS.imageBase64) return tooLarge()
  if (summary.length > CAPS.text) return tooLarge()

  const userText = [
    `Desafio: ${title}`,
    `Briefing do cliente: ${brief}`,
    `Resumo do diagrama: ${summary}`,
    '',
    'Revise o diagrama de arquitetura.',
  ].join('\n')

  let review: string | null = null
  let aiError: unknown = null
  try {
    review = imageBase64
      ? await askClaudeVision({
          system: SYSTEM,
          userText,
          imageBase64,
          maxTokens: 1024,
          effort: 'low',
        })
      : await askClaude({
          system: SYSTEM,
          user: userText,
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
      code: scene ?? summary,
      review_response: review,
    })
  }

  if (aiError) return aiErrorResponse(aiError)
  return Response.json({ review })
}
