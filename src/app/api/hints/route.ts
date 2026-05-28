import { jsonError, requireUser } from '@/lib/api/guard'
import { consumeHints, getBalance } from '@/lib/api/hints-server'

export async function GET(req: Request) {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  return Response.json(await getBalance(auth.user.id))
}

export async function POST(req: Request) {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const userId = auth.user.id

  const { session_id, hint_level, cost } = await req.json()
  if (!session_id || !hint_level) {
    return jsonError('session_id e hint_level são obrigatórios.', 400)
  }
  if (![1, 2, 3].includes(hint_level)) {
    return jsonError('hint_level deve ser 1, 2 ou 3.', 400)
  }

  const spend = Math.min(Math.max(Number(cost) || 1, 1), 10)
  const remaining = await consumeHints(userId, session_id, hint_level, spend)
  if (remaining === null) {
    return jsonError('Limite de hints atingido', 429)
  }
  return Response.json({ remaining }, { status: 201 })
}
