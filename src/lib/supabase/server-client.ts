import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '../database.types'

// Cookie-aware client for Server Components, server actions and route
// handlers. Reads the session the browser client stores in cookies.
export async function createSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Called from a Server Component: cookie writes are not allowed
            // there. The proxy refreshes sessions, so this is safe to ignore.
          }
        },
      },
    },
  )
}

export async function getServerUser(): Promise<User | null> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
