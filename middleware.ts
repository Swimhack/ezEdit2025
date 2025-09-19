import { NextRequest, NextResponse } from 'next/server'

/**
 * IMPORTANT: Content Security Policy Configuration
 *
 * This middleware includes CSP headers for security, but they MUST be configured
 * carefully to avoid breaking Next.js hydration and causing white screen issues.
 *
 * Key requirements:
 * - 'unsafe-inline' is required for Next.js inline scripts and styles
 * - 'unsafe-eval' is required for Next.js development mode and some production features
 * - CSP should only be applied to HTML pages, not static assets or API routes
 *
 * DO NOT make CSP more restrictive without thorough testing!
 * Previous issues: Nonce-based CSP caused white screens due to hydration failures.
 */
export function middleware(request: NextRequest) {
  // CRITICAL: Block CVE-2025-29927 exploitation
  const subrequestHeader = request.headers.get('x-middleware-subrequest');
  if (subrequestHeader && subrequestHeader.includes('middleware:')) {
    console.warn('Blocked CVE-2025-29927 exploitation attempt', {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      header: subrequestHeader,
      timestamp: new Date().toISOString()
    });

    return new NextResponse('Security violation detected', {
      status: 401,
      headers: {
        'x-security-violation': 'middleware-bypass-attempt',
        'x-blocked-at': new Date().toISOString()
      }
    });
  }

  // Skip CSP for static assets and Next.js internals
  const pathname = request.nextUrl.pathname;
  const isStaticAsset = pathname.startsWith('/_next/') ||
                        pathname.startsWith('/static/') ||
                        pathname.includes('.') ||
                        pathname === '/favicon.ico';

  const response = NextResponse.next();

  // Only apply CSP to HTML pages, not to static assets or API routes
  if (!isStaticAsset && !pathname.startsWith('/api/')) {
    // Create a more permissive CSP for Next.js compatibility
    // We need 'unsafe-inline' for Next.js hydration to work properly
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.supabase.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com",
      "connect-src 'self' https://sctzykgcfkhadowyqcrj.supabase.co wss://sctzykgcfkhadowyqcrj.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests"
    ].join('; ');

    response.headers.set('Content-Security-Policy', cspHeader);
  }

  // Set other security headers for all responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};