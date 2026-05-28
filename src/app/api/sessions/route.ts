import { jsonError, requireUser, serverError } from '@/lib/api/guard'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const userId = auth.user.id

  const { challenge_id } = await req.json()
  if (!challenge_id) return jsonError('challenge_id é obrigatório.', 400)

  const existing = await supabaseAdmin
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challenge_id)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing.data) return Response.json(existing.data)

  const { data, error } = await supabaseAdmin
    .from('sessions')
    .insert({ user_id: userId, challenge_id })
    .select()
    .single()

  if (error) return serverError('sessions.POST', error)
  return Response.json(data, { status: 201 })
}

export async function GET(req: Request) {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth

  const { data, error } = await supabaseAdmin
    .from('sessions')
    .select('*, challenges(*)')
    .eq('user_id', auth.user.id)
    .order('started_at', { ascending: false })

  if (error) return serverError('sessions.GET', error)
  return Response.json(data)
}
