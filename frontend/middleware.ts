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

  const isSettingsPage = request.nextUrl.pathname === '/settings';
  const isPublicRoute = request.nextUrl.pathname === '/login' ||
                       request.nextUrl.pathname === '/signup';

  // 公開ルートではSupabase接続不要 - そのまま返す
  if (isPublicRoute) {
    return response;
  }

  // セッションを取得（タイムアウト付き）
  let user = null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    clearTimeout(timeoutId);
    user = authUser;
  } catch (error) {
    console.error('Supabase auth check failed:', error);
    // 認証チェック失敗時はログインページへリダイレクト
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 未認証ユーザーはログインページへ
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // プロフィール存在チェック（設定ページ以外）
  if (!isSettingsPage) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (accessToken) {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

        const profileResponse = await fetch(`${apiBaseUrl}/account-setting/profile/exists`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: AbortSignal.timeout(5000),
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (!profileData.exists) {
            return NextResponse.redirect(new URL('/settings', request.url));
          }
        }
      }
    } catch (error) {
      console.error('Profile check failed in middleware:', error);
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
