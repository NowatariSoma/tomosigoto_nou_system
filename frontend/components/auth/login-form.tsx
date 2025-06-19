'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Alert, AlertDescription } from '@/components/ui/feedback/alert';
import { User, Lock, AlertCircle } from 'lucide-react';
import { auth } from '@/lib/api';
import Image from 'next/image';

interface LoginFormProps {
  onLogin: () => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    console.log('Form submission:', { username, password: '***' });

    try {
      await auth.login(username, password);
      console.log('Login successful, calling onLogin');
      onLogin();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'ログインに失敗しました。認証情報を確認してください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-10 via-blue-10 to-gray-15 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-noisy opacity-30"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-20 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-green-20 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>
      
      <Card className="w-full max-w-md relative z-10 card-elevated-hover animate-fade-in">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mx-auto mb-6">
            <Image 
              src="/favicon.png" 
              alt="WorkerVision Logo" 
              width={120} 
              height={120} 
              className="w-32 h-32"
            />
          </div>
          <CardTitle className="text-3xl font-semibold text-gray-80 mb-2">WorkerVision</CardTitle>
          <CardDescription className="text-gray-60 text-base">
            作業員監視システムにサインイン
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-10 border-red-20 animate-fade-in">
                <AlertCircle className="h-4 w-4 text-red" />
                <AlertDescription className="text-red-70">{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-3">
              <Label htmlFor="username" className="text-gray-70 font-medium">ユーザー名</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-50" />
                <Input
                  id="username"
                  type="text"
                  placeholder="ユーザー名を入力"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 input-field border-gray-25 focus:border-blue focus:ring-blue-20"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="password" className="text-gray-70 font-medium">パスワード</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-50" />
                <Input
                  id="password"
                  type="password"
                  placeholder="パスワードを入力"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 input-field border-gray-25 focus:border-blue focus:ring-blue-20"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 btn-primary text-base font-medium shadow-soft hover:shadow-medium transition-all duration-200" 
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  サインイン中...
                </>
              ) : (
                'サインイン'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-50">
              © 2024 WorkerVision. All rights reserved.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}