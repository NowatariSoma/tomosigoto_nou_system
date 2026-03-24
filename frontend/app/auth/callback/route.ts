import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', requestUrl.origin));
  }

  // バックエンドに検証を委譲してリダイレクト
  return NextResponse.redirect(new URL(`/verify-email?token=${token}`, requestUrl.origin));
}
