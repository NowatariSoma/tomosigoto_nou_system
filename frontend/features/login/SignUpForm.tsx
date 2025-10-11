'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginBackground } from './components/login-background';
import { LoginCard } from './components/login-card';
import { LoginLogo } from './components/login-logo';

interface SignUpFormProps {
  onSignUp: () => void;
}

export function SignUpForm({ onSignUp }: SignUpFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const { signUp, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください。');
      return;
    }

    try {
      await signUp(email, password);
      setShowEmailConfirmation(true);
    } catch (err: any) {
      console.error('SignUp error:', err);
      setError(err.message || 'サインアップに失敗しました。メールアドレスとパスワードを確認してください。');
    }
  };

  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <LoginBackground />
        <LoginCard>
          <div className="space-y-5">
            <LoginLogo />
            <div className="bg-green-500/20 border border-green-400 text-green-200 px-4 py-3 rounded-md text-sm mx-4">
              <h3 className="font-semibold mb-2">メール確認が必要です</h3>
              <p>
                <strong>{email}</strong> に確認メールを送信しました。
                <br />
                メール内のリンクをクリックして、アカウントを確認してください。
              </p>
            </div>
            <div className="mx-4 text-center">
              <a
                href="/login"
                className="text-[#d5a641] hover:text-[#e0b94d] transition-colors underline"
                style={{ fontFamily: 'Crimson Text, serif' }}
              >
                ログインページに戻る
              </a>
            </div>
          </div>
        </LoginCard>
      </div>
    );
  }

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
            <input
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
            <input
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

          {/* Confirm Password field */}
          <div className="relative mx-4">
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-[39px] px-3 bg-transparent border border-[#8a7a5a] rounded-lg text-[#e0e0e0] placeholder-[#9a9a9a] text-[16px] focus:outline-none focus:border-[#d5a641] transition-colors"
              style={{ fontFamily: 'Crimson Text, serif' }}
              required
              disabled={isLoading}
            />
          </div>

          {/* Sign up button */}
          <div className="mx-4">
            <button
              type="submit"
              className="w-full h-[39px] text-white text-[18px] rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: 'Crimson Text, serif',
                background: 'linear-gradient(90deg, #A60007 0%, #D44100 25%, #D5A641 50%, #D44100 75%, #A60007 100%)'
              }}
              disabled={isLoading || !email || !password || !confirmPassword}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Creating account...</span>
              </div>
            ) : (
              'Sign up'
            )}
            </button>
          </div>

          {/* Sign in link */}
          <div className="mx-4 text-center">
            <p className="text-[#9a9a9a] text-[14px]" style={{ fontFamily: 'Yu Gothic, YuGothic, sans-serif' }}>
              すでにアカウントをお持ちですか？<br />
              <a
                href="/login"
                className="text-[#d5a641] hover:text-[#e0b94d] transition-colors underline"
                style={{ fontFamily: 'Yu Gothic, YuGothic, sans-serif' }}
              >
                ログイン
              </a>
            </p>
          </div>
        </form>
      </LoginCard>
    </div>
  );
}