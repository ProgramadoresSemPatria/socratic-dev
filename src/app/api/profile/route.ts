import { requireUser, serverError } from '@/lib/api/guard'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', auth.user.id)
    .single()

  if (error) return serverError('profile.GET', error)
  return Response.json(data)
}

export async function POST(req: Request) {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth

  const { preferred_stack, preferred_level } = await req.json()

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ preferred_stack, preferred_level })
    .eq('id', auth.user.id)
    .select()
    .single()

  if (error) return serverError('profile.POST', error)
  return Response.json(data)
}
