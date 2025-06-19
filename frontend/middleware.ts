import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isPublicRoute = request.nextUrl.pathname === '/login' || 
                       request.nextUrl.pathname.startsWith('/api/') ||
                       request.nextUrl.pathname.startsWith('/_next/') ||
                       request.nextUrl.pathname === '/favicon.ico' ||
                       request.nextUrl.pathname === '/favicon.png' ||
                       request.nextUrl.pathname.startsWith('/images/') ||
                       request.nextUrl.pathname.startsWith('/icons/');

  // If user is not authenticated and trying to access protected route
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and trying to access login page, redirect to home
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - favicon.png (favicon file)
     * - images/ (image files)
     * - icons/ (icon files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|favicon.png|images|icons).*)',
  ],
}; 