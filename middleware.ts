import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes yang tidak boleh diakses oleh ADMIN
const ADMIN_RESTRICTED_ROUTES = ['/projects', '/courses', '/compiler']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Cek role dari cookie/session
  const userCookie = request.cookies.get('user')?.value
  if (userCookie) {
    try {
      const user = JSON.parse(decodeURIComponent(userCookie))
      if (user.role === 'ADMIN') {
        const isRestricted = ADMIN_RESTRICTED_ROUTES.some(route => pathname.startsWith(route))
        if (isRestricted) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }
    } catch {
      // Cookie parsing failed, continue
    }
  }

  return NextResponse.next()
}

export const config = {
  // Only run middleware on specific page routes that need role checking
  // Exclude API routes, static files, images, etc.
  matcher: [
    '/projects/:path*',
    '/courses/:path*',
    '/compiler/:path*',
  ],
}
