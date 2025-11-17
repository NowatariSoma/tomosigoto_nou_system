import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const isLoginPage = request.nextUrl.pathname === '/login';
  const isSignUpPage = request.nextUrl.pathname === '/signup';
  const isAccountSettingPage = request.nextUrl.pathname === '/account-setting';
  const isPublicRoute = request.nextUrl.pathname === '/login' ||
                       request.nextUrl.pathname === '/signup' ||
                       request.nextUrl.pathname === '/account-setting' ||
                       request.nextUrl.pathname.startsWith('/api/') ||
                       request.nextUrl.pathname.startsWith('/_next/') ||
                       request.nextUrl.pathname === '/favicon.ico' ||
                       request.nextUrl.pathname === '/favicon.png' ||
                       request.nextUrl.pathname.startsWith('/images/') ||
                       request.nextUrl.pathname.startsWith('/icons/');

  // セッションを取得
  const { data: { user } } = await supabase.auth.getUser();

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated, check if profile exists
  if (user && !isPublicRoute) {
    try {
      // Get session to get access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        // Check if profile exists
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const checkResponse = await fetch(`${apiUrl}/account_setting/profile/exists`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (checkResponse.ok) {
          const { exists } = await checkResponse.json();
          
          // If profile doesn't exist and not already on account-setting page, redirect
          if (!exists && !isAccountSettingPage) {
            return NextResponse.redirect(new URL('/account-setting', request.url));
          }
        }
      }
    } catch (error) {
      // If there's an error checking profile, allow access (fail open)
      // This prevents blocking users if the API is down
      console.error('Error checking profile existence:', error);
    }
  }

  // If user is authenticated and trying to access login/signup page, redirect to home
  // if (user && (isLoginPage || isSignUpPage)) {
  //   return NextResponse.redirect(new URL('/', request.url));
  // }

  return response;
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