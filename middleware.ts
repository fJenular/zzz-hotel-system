import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = [
    '/', 
    '/login', 
    '/register', 
    '/forgot-password', 
    '/reset-password',
    '/verify-email',
    '/about', 
    '/contact-us', 
    '/facilities', 
    '/callback',
    '/booking/select-room',
  ]
  const isPublicRoute = publicRoutes.includes(pathname) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/rooms') ||
    pathname.startsWith('/rooms/') ||
    pathname.startsWith('/booking/select-room') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')

  if (isPublicRoute) {
    return supabaseResponse
  }

  // Protected routes - require auth
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role, email_verified')
    .eq('id', user.id)
    .single()

  // Check email verification
  if (!userData?.email_verified && pathname !== '/verify-email') {
    const url = request.nextUrl.clone()
    url.pathname = '/verify-email'
    return NextResponse.redirect(url)
  }

  // Role-based access control
  const role = userData?.role || 'guest'

  // Admin routes
  if (pathname.startsWith('/admin') && !['admin', 'super_admin'].includes(role)) {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }

  // Manager routes
  if (pathname.startsWith('/manager') && !['manager', 'admin', 'super_admin'].includes(role)) {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }

  // Receptionist routes
  if (pathname.startsWith('/receptionist') && !['receptionist', 'manager', 'admin', 'super_admin'].includes(role)) {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }

  // Restaurant routes
  if (pathname.startsWith('/restaurant') && !['rest_staff', 'manager', 'admin', 'super_admin'].includes(role)) {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }

  // Housekeeping routes
  if (pathname.startsWith('/housekeeping') && !['housekeeping', 'manager', 'admin', 'super_admin'].includes(role)) {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }

  // Redirect based on role after login
  if (pathname === '/dashboard') {
    if (['admin', 'super_admin'].includes(role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    } else if (role === 'manager') {
      const url = request.nextUrl.clone()
      url.pathname = '/manager/dashboard'
      return NextResponse.redirect(url)
    } else if (role === 'receptionist') {
      const url = request.nextUrl.clone()
      url.pathname = '/receptionist/dashboard'
      return NextResponse.redirect(url)
    } else if (role === 'rest_staff') {
      const url = request.nextUrl.clone()
      url.pathname = '/restaurant/dashboard'
      return NextResponse.redirect(url)
    } else if (role === 'housekeeping') {
      const url = request.nextUrl.clone()
      url.pathname = '/housekeeping/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}