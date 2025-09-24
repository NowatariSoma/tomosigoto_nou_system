'use client';

import { useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Badge } from '@/components/ui/feedback/badge';
import { StatusBadge } from '@/components/ui/feedback/status-badge';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface AppTemplateProps {
  children: ReactNode;
  title?: string;
  description?: string;
  icon?: ReactNode;
  badge?: string;
  badgeVariant?: 'default' | 'destructive' | 'outline' | 'secondary';
  developmentBadge?: {
    level: 'alpha' | 'beta' | 'stable';
    text: string;
  };
  permissionBadge?: {
    level: 'basic' | 'admin' | 'super';
    text: string;
  };
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  className?: string;
}

export function AppTemplate({
  children,
  title,
  description,
  icon,
  badge,
  badgeVariant = 'default',
  developmentBadge,
  permissionBadge,
  maxWidth = '7xl',
  className = ''
}: AppTemplateProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isAdmin, isLoading, user } = useAuth();
  const router = useRouter();

  // 自動アクセス制御：permissionBadge.level が 'admin' または 'super' の場合
  const requiresAdmin = permissionBadge?.level === 'admin' || permissionBadge?.level === 'super';

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case '2xl': return 'max-w-2xl';
      case '7xl': return 'max-w-7xl';
      case 'full': return 'max-w-full';
      default: return 'max-w-7xl';
    }
  };

  // 管理者権限が必要だが、管理者でない場合はアクセス拒否画面を表示
  if (requiresAdmin && !isLoading && !isAdmin) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={handleMobileSidebarClose}
        />

        <div className="flex flex-col min-h-screen md:pl-64">
          <Header onMobileSidebarToggle={handleMobileSidebarToggle} />

          <main className="flex-1 w-full px-4 py-8 bg-white">
            <div className={`${getMaxWidthClass()} mx-auto ${className}`}>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <ShieldAlert className="h-24 w-24 text-red-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">アクセス権限がありません</h2>
                  <p className="text-gray-600 mb-4">
                    この機能は管理者のみが利用できます。
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    ホームに戻る
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ローディング中の表示（管理者権限が必要な場合のみ）
  if (requiresAdmin && isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={handleMobileSidebarClose}
        />

        <div className="flex flex-col min-h-screen md:pl-64">
          <Header onMobileSidebarToggle={handleMobileSidebarToggle} />

          <main className="flex-1 w-full px-4 py-8 bg-white">
            <div className={`${getMaxWidthClass()} mx-auto ${className}`}>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">読み込み中...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={handleMobileSidebarClose}
      />
      
      <div className="flex flex-col min-h-screen md:pl-64">
        <Header onMobileSidebarToggle={handleMobileSidebarToggle} />
        
        <main className="flex-1 w-full px-4 py-8 bg-white">
          <div className={`${getMaxWidthClass()} mx-auto ${className}`}>
            {(title || description || icon || badge || developmentBadge || permissionBadge) && (
              <div className="mb-8">
                {(title || icon) && (
                  <div className="flex items-center gap-3 mb-4">
                    {icon}
                    {title && (
                      <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-gray-900">
                          {title}
                        </h1>
                        {developmentBadge && (
                          <StatusBadge 
                            type="development" 
                            level={developmentBadge.level}
                          >
                            {developmentBadge.text}
                          </StatusBadge>
                        )}
                        {permissionBadge && (
                          <StatusBadge 
                            type="permission" 
                            level={permissionBadge.level}
                          >
                            {permissionBadge.text}
                          </StatusBadge>
                        )}
                        {badge && (
                          <Badge variant={badgeVariant}>
                            {badge}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {description && (
                  <p className="text-gray-600">
                    {description}
                  </p>
                )}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 