import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
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

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't need auth
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/callback']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Onboarding route
  const isOnboardingRoute = pathname === '/onboarding'

  // Protected routes that require completed onboarding
  const protectedRoutes = ['/dashboard', '/profile', '/projects', '/toolkits']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Not authenticated
  if (!user) {
    if (isProtectedRoute || isOnboardingRoute) {
      // Redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // User is authenticated
  // Redirect away from auth pages
  if (isPublicRoute && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Check onboarding status for protected routes
  if (isProtectedRoute) {
    // Fetch profile to check onboarding status
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    // Cast to expected type since Database types may have issues
    const profileData = profile as { onboarding_completed: boolean } | null

    // If profile doesn't exist or onboarding not completed, redirect to onboarding
    if (!profileData || !profileData.onboarding_completed) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  // If on onboarding but already completed, redirect to dashboard
  if (isOnboardingRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    // Cast to expected type
    const profileData = profile as { onboarding_completed: boolean } | null

    if (profileData?.onboarding_completed) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
