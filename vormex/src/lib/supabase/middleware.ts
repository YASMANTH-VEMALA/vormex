import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/auth', '/auth/callback']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // If user is authenticated
  if (user) {
    // Check if user has completed profile setup
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_profile_complete')
      .eq('id', user.id)
      .single()

    const isProfileComplete = profile?.is_profile_complete === true
    const isProfileSetupRoute = pathname === '/profile-setup'
    const isAuthRoute = pathname.startsWith('/auth')

    // Debug logging
    console.log('Middleware check:', { pathname, isProfileComplete, isProfileSetupRoute, profile })

    // Redirect authenticated users away from auth pages
    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = isProfileComplete ? '/home' : '/profile-setup'
      return NextResponse.redirect(url)
    }

    // If profile is not complete, redirect to profile setup (but not if already there)
    if (!isProfileComplete && !isProfileSetupRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/profile-setup'
      return NextResponse.redirect(url)
    }

    // If profile is complete and user is on profile setup, redirect to home
    if (isProfileComplete && isProfileSetupRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return NextResponse.redirect(url)
    }

    // Redirect root to home
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = isProfileComplete ? '/home' : '/profile-setup'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
