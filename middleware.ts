import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes yang tidak boleh diakses oleh ADMIN
const ADMIN_RESTRICTED_ROUTES = ['/projects', '/courses', '/compiler']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect old routing structure to new structure
  const materiMatch = pathname.match(/^\/courses\/([^\/]+)\/materi\/([^\/]+)(.*)$/)
  if (materiMatch) {
    const [, courseId, materiId, rest] = materiMatch
    const newUrl = new URL(`/courses/${courseId}/${materiId}${rest}`, request.url)
    return NextResponse.redirect(newUrl)
  }

  const asesmenMatch = pathname.match(/^\/courses\/([^\/]+)\/asesmen\/([^\/]+)(.*)$/)
  if (asesmenMatch) {
    const [, courseId, asesmenId, rest] = asesmenMatch
    const newUrl = new URL(`/courses/${courseId}/${asesmenId}${rest}`, request.url)
    return NextResponse.redirect(newUrl)
  }

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
  // Run middleware on all pages that might need redirect or role checking
  matcher: [
    '/projects/:path*',
    '/courses/:path*',
    '/compiler/:path*',
  ],
}
