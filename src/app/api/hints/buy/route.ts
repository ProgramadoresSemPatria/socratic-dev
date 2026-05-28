import { supabaseAdmin } from '@/lib/supabase-server'

const PACK = 10

// Mock purchase: grants a pack of bonus hint credits (no payment gateway yet).
export async function POST(request: Request) {
  const { user_id } = await request.json()
  if (!user_id) {
    return Response.json({ error: 'user_id is required' }, { status: 400 })
  }

  const { data } = await supabaseAdmin.auth.admin.getUserById(user_id)
  const bonus = Number(
    (data?.user?.user_metadata as { bonus_hints?: number } | undefined)
      ?.bonus_hints ?? 0,
  )

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
    user_metadata: { bonus_hints: bonus + PACK },
  })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ bonus: bonus + PACK, added: PACK })
}
