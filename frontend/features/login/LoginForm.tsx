'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginBackground } from './components/login-background';
import { LoginCard } from './components/login-card';
import { LoginLogo } from './components/login-logo';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';

interface LoginFormProps {
  onLogin: () => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      onLogin();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'ログインに失敗しました。メールアドレスとパスワードを確認してください。');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <LoginBackground />

      <LoginCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          <LoginLogo />

          {/* Error message */}
          {error && (
            <div className="bg-red-500/20 border border-red-400 text-red-200 px-3 py-2 rounded-md text-sm mx-4">
              {error}
            </div>
          )}

          {/* Email field */}
          <div className="relative mx-4">
            <Input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[39px] px-3 bg-transparent border border-[#8a7a5a] rounded-lg text-[#e0e0e0] placeholder-[#9a9a9a] text-[16px] focus:outline-none focus:border-[#d5a641] transition-colors"
              style={{ fontFamily: 'Crimson Text, serif' }}
              required
              disabled={isLoading}
            />
          </div>

          {/* Password field */}
          <div className="relative mx-4">
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[39px] px-3 bg-transparent border border-[#8a7a5a] rounded-lg text-[#e0e0e0] placeholder-[#9a9a9a] text-[16px] focus:outline-none focus:border-[#d5a641] transition-colors"
              style={{ fontFamily: 'Crimson Text, serif' }}
              required
              disabled={isLoading}
            />
          </div>

          {/* Sign in button */}
          <div className="mx-4">
            <Button
              type="submit"
              className="w-full h-[39px] text-white text-[18px] rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: 'Crimson Text, serif',
                background: 'linear-gradient(90deg, #A60007 0%, #D44100 25%, #D5A641 50%, #D44100 75%, #A60007 100%)'
              }}
              disabled={isLoading || !email || !password}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign in'
            )}
            </Button>
          </div>

          {/* Sign up link */}
          <div className="mx-4 text-center">
            <p className="text-[#9a9a9a] text-[14px]" style={{ fontFamily: 'Yu Gothic, YuGothic, sans-serif' }}>
              アカウントをお持ちでないですか？<br />
              <a
                href="/signup"
                className="text-[#d5a641] hover:text-[#e0b94d] transition-colors underline"
                style={{ fontFamily: 'Yu Gothic, YuGothic, sans-serif' }}
              >
                サインアップ
              </a>
            </p>
          </div>
        </form>
      </LoginCard>
    </div>
  );
}
