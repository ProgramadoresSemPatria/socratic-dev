import { clientIp, rateLimit, tooMany } from '@/lib/api/guard'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    if (!rateLimit(`signup:${clientIp(req)}`, 5, 60_000)) return tooMany()

    const { email, password } = await req.json()
    if (!email || !password) {
      return Response.json(
        { error: 'E-mail e senha são obrigatórios.' },
        { status: 400 },
      )
    }
    if (String(password).length < 6) {
      return Response.json(
        { error: 'A senha precisa ter pelo menos 6 caracteres.' },
        { status: 400 },
      )
    }

    const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    return Response.json({ ok: true }, { status: 201 })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Erro ao criar conta.' },
      { status: 500 },
    )
  }
}
