// Main middleware — runs on every request to protect routes
// - Refreshes the auth session (keeps users logged in)
// - Redirects unauthenticated users away from app pages
// - Redirects users without a subscription to /subscribe
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { user, supabaseResponse, supabase } = await updateSession(request)
  const path = request.nextUrl.pathname

  // --- Public routes: anyone can visit these ---
  const isPublicRoute =
    path === '/' ||
    path.startsWith('/login') ||
    path.startsWith('/signup') ||
    path.startsWith('/api/stripe/webhook') // Stripe needs to reach this without auth

  if (isPublicRoute) {
    return supabaseResponse
  }

  // --- Protected routes: must be logged in ---
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // --- Subscription check: logged-in users need an active subscription ---
  // (Skip this check for the subscribe page itself and API routes)
  const isSubscribePage = path === '/subscribe'
  const isApiRoute = path.startsWith('/api/')

  if (!isSubscribePage && !isApiRoute) {
    // Fetch the user's profile to check their subscription status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    const isSubscribed =
      profile?.subscription_status === 'active' ||
      profile?.subscription_status === 'trialing'

    if (!isSubscribed) {
      const url = request.nextUrl.clone()
      url.pathname = '/subscribe'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

// Tell Next.js which routes this middleware should run on
// (Skip static files and images — they don't need auth checks)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
