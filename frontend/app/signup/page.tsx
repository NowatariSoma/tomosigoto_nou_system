'use client';

import { useRouter } from 'next/navigation';
import { SignUpForm } from '@/features/login/SignUpForm';

export default function SignUpPage() {
  const router = useRouter();

  const handleSignUp = () => {
    router.push('/');
  };

  return <SignUpForm onSignUp={handleSignUp} />;
}