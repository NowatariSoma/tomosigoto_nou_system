'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/forms/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/data-display/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/overlays/dropdown-menu';
import { Settings, LogOut } from 'lucide-react';
import { MobileSidebarToggle } from './sidebar';

interface HeaderProps {
  onMobileSidebarToggle?: () => void;
}

export function Header({ onMobileSidebarToggle }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.email?.split('@')[0] || 'ユーザー';
  };

  const getUserInitial = () => {
    const displayName = getUserDisplayName();
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="w-full px-4 bg-white">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Mobile sidebar toggle only */}
          <div className="flex items-center">
            {onMobileSidebarToggle && (
              <MobileSidebarToggle onToggle={onMobileSidebarToggle} />
            )}
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full hover-icon"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={getUserDisplayName()} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {getUserInitial()}
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
                      <AvatarImage src="" alt={getUserDisplayName()} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {getUserInitial()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="font-medium text-gray-900">{getUserDisplayName()}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">ID: {user.id}</p>
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer hover-nav text-gray-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      ログアウト
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