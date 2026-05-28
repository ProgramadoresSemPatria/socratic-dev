import { jsonError, requireUser, serverError } from '@/lib/api/guard'
import { addBonus } from '@/lib/api/hints-server'

const PACK = 10

export async function POST(req: Request) {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth

  const bonus = await addBonus(auth.user.id, PACK)
  if (bonus === null) return serverError('hints/buy', 'addBonus failed')
  return Response.json({ bonus, added: PACK })
}

export const GET = () => jsonError('Método não permitido.', 405)
