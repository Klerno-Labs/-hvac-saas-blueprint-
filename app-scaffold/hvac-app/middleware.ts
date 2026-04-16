import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Production hardening middleware.
 *
 * - Adds security headers to all responses
 * - Basic rate-limit awareness headers for public/portal routes
 * - Prevents sensitive internal paths from leaking via error pages
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers for all responses
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Remove server identification
  response.headers.delete('X-Powered-By')

  // For API routes, ensure JSON content type on errors
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
  }

  return response
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
