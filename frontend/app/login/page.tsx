'use client';

import { useRouter } from 'next/navigation';
import { LoginForm } from '@/features/login/LoginForm';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/');
  };

  return <LoginForm onLogin={handleLogin} />;
}
