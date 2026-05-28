import { aiErrorResponse } from '@/lib/ai/client'
import { generateChallenge, type GenLevel } from '@/lib/ai/generate-challenge'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const level: GenLevel =
      body.level === 'intermediate' || body.level === 'advanced'
        ? body.level
        : 'beginner'
    const kind = body.kind === 'design' ? 'design' : 'code'

    const { data, error } = await generateChallenge({
      kind,
      stack: body.stack,
      level,
    })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data, { status: 201 })
  } catch (e) {
    return aiErrorResponse(e)
  }
}
