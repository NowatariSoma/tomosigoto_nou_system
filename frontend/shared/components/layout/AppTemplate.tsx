'use client';

import { useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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

          <main className="flex-1 w-full px-4 py-8 bg-gradient-to-br from-indigo-950 via-purple-950 to-violet-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
            <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl"></div>

            <div className={`${getMaxWidthClass()} mx-auto ${className} relative z-10`}>
              <div className="flex items-center justify-center py-24">
                <div className="text-center w-full max-w-[600px] mx-auto">
                  <div className="mb-[200px] relative group flex justify-center">
                    <div className="relative w-[420px] h-[420px]">
                      <div className="absolute inset-0 -m-8 bg-gradient-to-r from-cyan-400/30 via-purple-400/30 to-pink-400/30 rounded-full blur-3xl group-hover:blur-2xl transition-all duration-700"></div>
                      <div className="absolute inset-0 -m-4 bg-gradient-to-br from-cyan-500/40 via-purple-500/40 to-violet-500/40 rounded-full blur-2xl"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-purple-500 to-violet-600 rounded-full blur-sm opacity-60 animate-pulse"></div>
                      <Image
                        src="/god_takuichi.jpg"
                        alt="アクセス拒否"
                        width={420}
                        height={420}
                        className="rounded-full shadow-[0_0_80px_rgba(139,92,246,0.6),0_0_40px_rgba(6,182,212,0.4)] ring-[6px] ring-white/10 backdrop-blur-sm relative z-10 transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 relative z-30">
                    <h2 className="text-5xl font-black bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.5)] tracking-tight">
                      やっと会えたね（はあと）
                    </h2>
                    <p className="text-purple-200/80 text-2xl font-light tracking-wide">
                      君のこと、ずっと考えていたんだ。
                    </p>
                  </div>
                  <div className="mt-10 relative z-30">
                    <button
                      onClick={() => router.push('/')}
                      className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-violet-600 text-white rounded-full font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(168,85,247,0.6)]"
                    >
                      <span className="relative z-10">ホームに戻る</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </div>
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