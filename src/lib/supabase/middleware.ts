// Supabase middleware helper — refreshes the auth session on every request
// This keeps users logged in by refreshing their session cookie before it expires
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Start with a normal response that passes the request through
  let supabaseResponse = NextResponse.next({ request })

  // Create a Supabase client that can read and write cookies on the response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies on both the request (for downstream code) and the response (for the browser)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This call refreshes the session if it's expired — IMPORTANT: don't remove this!
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { user, supabaseResponse, supabase }
}
