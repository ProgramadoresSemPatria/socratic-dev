import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Refreshes the Supabase session cookie on navigation so Server Components
// always see a valid token (Next 16's proxy — formerly middleware).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Triggers a token refresh when the access token expired.
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    // Everything except static assets, images and the AI/stripe endpoints
    // (those authenticate via Bearer token / signature, not cookies).
    '/((?!_next/static|_next/image|favicon.ico|monitoring|ingest|api/).*)',
  ],
}
