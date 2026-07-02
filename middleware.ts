import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protected routes
  const protectedPaths = ['/dashboard', '/booking/confirmation', '/booking/payment']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  // Check for auth cookie (Supabase sets this automatically)
  const hasAuthCookie = request.cookies.getAll().some(
    cookie => cookie.name.includes('auth-token') || cookie.name.includes('sb-') && cookie.name.includes('auth-token')
  )

  // For now, allow access (real auth check happens in components)
  // This is a simplified version - enhance later with proper session check
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}