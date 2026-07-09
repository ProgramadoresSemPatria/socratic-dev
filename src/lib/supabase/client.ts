import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../database.types'

// Cookie-backed session (via @supabase/ssr) so the server can identify the
// user on the first request — the foundation for Server Components.
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
