'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
// import { LoginForm } from '@/features/login/LoginForm';

export default function LoginPage() {
  const router = useRouter();

  // ログイン機能をコメントアウト: ログインフォームを表示せず、直接ホームにリダイレクト
  useEffect(() => {
    router.push('/');
  }, [router]);

  // const handleLogin = () => {
  //   router.push('/');
  // };

  // return <LoginForm onLogin={handleLogin} />;
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>ログイン機能は現在無効化されています。ホームにリダイレクトしています...</p>
    </div>
  );
} 