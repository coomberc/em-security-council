import { NextRequest, NextResponse } from 'next/server'

const SKIP_PATHS = ['/login', '/api/auth', '/_next', '/icon', '/favicon.ico']

export function middleware(request: NextRequest) {
  const sitePassword = process.env.SITE_PASSWORD

  // Skip if no password configured (local dev)
  if (!sitePassword) return NextResponse.next()

  // Skip login page, auth API, and static assets
  if (SKIP_PATHS.some((p) => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check for auth cookie
  const authCookie = request.cookies.get('site-auth')?.value
  if (authCookie === sitePassword) {
    return NextResponse.next()
  }

  // Redirect to login
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
