'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/forms/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/data-display/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/overlays/dropdown-menu';
import { LogOut, Settings, User as UserIcon, Menu, FileText } from 'lucide-react';
import { MobileSidebarToggle } from './sidebar';

interface HeaderProps {
  onLogout?: () => void;
  onMobileSidebarToggle?: () => void;
}

export function Header({ onLogout, onMobileSidebarToggle }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 模擬ユーザーデータ
  useEffect(() => {
    const mockUser = {
      username: 'ユーザー',
      email: 'user@example.com'
    };
    setUser(mockUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    if (onLogout) {
      onLogout();
    } else {
      router.push('/login');
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="w-full px-4 bg-white">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Mobile sidebar toggle and Logo */}
          <div className="flex items-center space-x-4">
            {/* Mobile sidebar toggle */}
            {onMobileSidebarToggle && (
              <MobileSidebarToggle onToggle={onMobileSidebarToggle} />
            )}
            
            {/* Logo - Hidden on mobile when sidebar toggle is present */}
            <div 
              className={`flex items-center space-x-2 cursor-pointer ${onMobileSidebarToggle ? 'hidden md:flex' : 'flex'}`}
              onClick={() => handleNavigation('/')}
            >
              <Settings className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">tomosigoto</span>
            </div>
            
            {/* Navigation Menu - Desktop only */}
            <nav className="hidden lg:flex items-center space-x-4 ml-8">
              <Button
                variant="ghost"
                onClick={() => handleNavigation('/requirements')}
                className="flex items-center gap-2 hover-nav"
              >
                <UserIcon className="h-4 w-4" />
                要望ヒアリング
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation('/projects')}
                className="flex items-center gap-2 hover-nav"
              >
                <FileText className="h-4 w-4" />
                プロジェクト
              </Button>
            </nav>
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu - Only show when no sidebar */}
            {!onMobileSidebarToggle && (
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hover-nav">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200">
                    <DropdownMenuItem onClick={() => handleNavigation('/requirements')} className="hover-nav">
                      <UserIcon className="mr-2 h-4 w-4" />
                      要望ヒアリング
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavigation('/projects')} className="hover-nav">
                      <FileText className="mr-2 h-4 w-4" />
                      プロジェクト
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* User menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-10 w-10 rounded-full hover-icon"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={user.username} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-64 bg-white border border-gray-200" 
                  align="end" 
                  forceMount
                >
                  <div className="flex items-center justify-start gap-3 p-3 border-b border-gray-200">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="" alt={user.username} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="font-medium text-gray-900">{user.username}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="py-2">
                    <DropdownMenuItem 
                      onClick={() => handleNavigation('/settings')}
                      className="cursor-pointer hover-nav"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      設定
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}