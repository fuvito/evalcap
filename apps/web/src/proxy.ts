import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Stale/invalid refresh token — clear dead sb-* cookies so the browser stops
  // replaying the bad token. Redirect protected routes to login; let public/auth
  // pages render normally (avoids a redirect loop on /auth/login itself).
  if (error && !user) {
    const stale = request.cookies.getAll().filter(c => c.name.startsWith('sb-'))
    const isProtectedPath = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
    if (isProtectedPath) {
      const redirect = NextResponse.redirect(new URL('/auth/login', request.url))
      stale.forEach(c => redirect.cookies.delete(c.name))
      return redirect
    }
    stale.forEach(c => supabaseResponse.cookies.delete(c.name))
    return supabaseResponse
  }

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  const isAuthPage = pathname.startsWith('/auth')

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage && !pathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

const PROTECTED_PREFIXES = [
  '/dashboard', '/checkin', '/history', '/summary', '/summaries',
  '/cycles', '/goals', '/profile', '/settings', '/account', '/admin',
]

export const config = {
  // Exclude Next.js internals, static assets, and API routes.
  // API routes handle auth themselves and should return 401 JSON, not an HTML redirect.
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
