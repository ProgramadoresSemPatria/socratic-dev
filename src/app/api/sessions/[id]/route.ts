import { jsonError, requireUser, serverError } from '@/lib/api/guard'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth

  const { id } = await params
  const { status, duration_seconds } = await req.json()
  if (!status) return jsonError('status é obrigatório.', 400)

  const owner = await supabaseAdmin
    .from('sessions')
    .select('user_id')
    .eq('id', id)
    .maybeSingle()
  if (!owner.data) return jsonError('Sessão não encontrada.', 404)
  if (owner.data.user_id !== auth.user.id) {
    return jsonError('Sem permissão.', 403)
  }

  const update: {
    status: string
    completed_at?: string
    duration_seconds?: number
  } = { status }
  if (status === 'completed' || status === 'abandoned') {
    update.completed_at = new Date().toISOString()
  }
  if (typeof duration_seconds === 'number') {
    update.duration_seconds = Math.max(0, Math.floor(duration_seconds))
  }

  const { data, error } = await supabaseAdmin
    .from('sessions')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return serverError('sessions.PATCH', error)
  return Response.json(data)
}
