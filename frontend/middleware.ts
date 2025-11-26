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
  const isSettingsPage = request.nextUrl.pathname === '/settings';
  const isPublicRoute = request.nextUrl.pathname === '/login' ||
                       request.nextUrl.pathname === '/signup' ||
                       request.nextUrl.pathname.startsWith('/api/') ||
                       request.nextUrl.pathname.startsWith('/_next/') ||
                       request.nextUrl.pathname === '/favicon.ico' ||
                       request.nextUrl.pathname === '/favicon.png' ||
                       request.nextUrl.pathname.startsWith('/images/') ||
                       request.nextUrl.pathname.startsWith('/icons/');

  // セッションを取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user  is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && !isSettingsPage) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (accessToken) {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        
        // プロフィール存在チェック
        const profileResponse = await fetch(`${apiBaseUrl}/account-setting/profile/exists`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (!profileData.exists) {
            return NextResponse.redirect(new URL('/settings', request.url));
          }
        }
      }
      // NOTE: ページ単位の権限チェックはクライアントサイド (AuthContext) で実施
      // Next.js Edge Runtime環境ではバックエンドAPIへのfetchに制約があるため、
      // ここでは基本的な認証チェックのみを行い、
      // 詳細な権限チェックはクライアントサイドとバックエンドAPIで実施する
    } catch (error) {
      console.error('Failed to verify profile existence in middleware:', error);
    }
  }

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