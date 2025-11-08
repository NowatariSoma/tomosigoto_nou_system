'use client';

import React from 'react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/forms/button';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Users,
  User,
  X,
  Home,
  Settings,
  ChevronUp,
  ChevronDown,
  Calendar,
  CalendarDays,
  Theater,
  BookOpen,
  Building,
  ReceiptText,
  Clock,
  Edit3,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

function NavItem({ icon, label, active, onClick, href, className, hasChildren, isExpanded, onToggleExpand }: NavItemProps) {
  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleExpand) {
      onToggleExpand();
    }
  };

  const content = (
    <>
      <span className="flex-shrink-0">{icon}</span>
      <span className="ml-3 truncate flex-1 text-left">{label}</span>
      {hasChildren && (
        <div
          onClick={handleChevronClick}
          className="flex-shrink-0 ml-2 p-1 hover-icon transition-colors cursor-pointer"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleChevronClick(e as any);
            }
          }}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      )}
    </>
  );

  const baseClassName = cn(
    "flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 hover-nav",
    active 
      ? "active-nav" 
      : "",
    className
  );

  if (href) {
    return (
      <Link href={href} className={baseClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={baseClassName}>
      {content}
    </button>
  );
}

function SubNavItem({ icon, label, active, onClick, href, className }: NavItemProps) {
  const content = (
    <>
      <span className="flex-shrink-0">{icon}</span>
      <span className="ml-3 truncate">{label}</span>
    </>
  );

  const baseClassName = cn(
    "flex items-center w-full pl-10 pr-3 py-2 text-sm font-medium rounded-md transition-all duration-200 hover-nav",
    active 
      ? "active-nav" 
      : "",
    className
  );

  if (href) {
    return (
      <Link href={href} className={baseClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={baseClassName}>
      {content}
    </button>
  );
}

function NavTitle({ label }: { label: string }) {
  return (
    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {label}
    </div>
  );
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };


  const handleNavigateAndClose = (path: string) => {
    router.push(path);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  // Mobile overlay
  if (isMobileOpen) {
    return (
      <>
        {/* Mobile backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
        
        {/* Mobile sidebar */}
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg md:hidden transform transition-transform duration-300 ease-in-out">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <Image 
                    src="/favicon.png" 
                    alt="トモシゴト" 
                    width={32} 
                    height={32}
                    className="rounded"
                  />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">トモシゴト</h2>
                  <p className="text-xs text-gray-500">能楽部練習表</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMobileClose}
                className="hover-icon"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
              <NavTitle label="メイン" />
              
              <NavItem
                icon={<Home className="w-4 h-4" />}
                label="ダッシュボード"
                active={pathname === '/'}
                onClick={() => handleNavigateAndClose('/')}
              />

              <NavTitle label="練習管理" />

              <NavItem
                icon={<Calendar className="w-4 h-4" />}
                label="登録"
                active={pathname === '/practice-schedule'}
                onClick={() => handleNavigateAndClose('/practice-schedule')}
              />

              <NavItem
                icon={<CalendarDays className="w-4 h-4" />}
                label="スケジュール"
                active={pathname === '/schedule'}
                onClick={() => handleNavigateAndClose('/schedule')}
              />

              <NavItem
                icon={<BookOpen className="w-4 h-4" />}
                label="練習表"
                active={pathname === '/practice-slots'}
                onClick={() => handleNavigateAndClose('/practice-slots')}
              />

              <NavItem
                icon={<Edit3 className="w-4 h-4" />}
                label="練習表編集"
                active={pathname.startsWith('/practice-schedule-editor')}
                onClick={() => handleNavigateAndClose('/practice-schedule-editor')}
              />

              <NavItem
                icon={<Building className="w-4 h-4" />}
                label="部屋設定"
                active={pathname === '/room-settings'}
                onClick={() => handleNavigateAndClose('/room-settings')}
              />

              <NavItem
                icon={<Theater className="w-4 h-4" />}
                label="舞台・パート登録"
                active={pathname === '/parts-setting'}
                onClick={() => handleNavigateAndClose('/parts-setting')}
              />

              <NavItem
                icon={<UserCheck className="w-4 h-4" />}
                label="メンバー所属設定"
                active={pathname === '/member-assignments-setting'}
                onClick={() => handleNavigateAndClose('/member-assignments-setting')}
              />

              <NavItem
                icon={<ReceiptText className="w-4 h-4" />}
                label="演目一覧"
                active={pathname === '/performances-list'}
                onClick={() => handleNavigateAndClose('/performances-list')}
              />

              <NavItem
                icon={<Clock className="w-4 h-4" />}
                label="出席管理"
                active={pathname === '/attendance'}
                onClick={() => handleNavigateAndClose('/attendance')}
              />

              <NavItem
                icon={<Users className="w-4 h-4" />}
                label="管理者用出席管理"
                active={pathname === '/admin/attendance'}
                onClick={() => handleNavigateAndClose('/admin/attendance')}
              />

              <NavTitle label="その他" />

              <NavItem
                icon={<User className="w-4 h-4" />}
                label="アカウント設定"
                active={pathname === '/account-setting'}
                onClick={() => handleNavigateAndClose('/account-setting')}
              />

              <NavItem
                icon={<Settings className="w-4 h-4" />}
                label="設定"
                active={pathname === '/settings'}
                onClick={() => handleNavigateAndClose('/settings')}
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div className={cn(
      "hidden md:flex flex-col fixed inset-y-0 left-0 transition-all duration-300 z-50",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200 shadow-sm">
        {/* Header */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200 flex-shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <Image 
                  src="/favicon.png" 
                  alt="トモシゴト" 
                  width={32} 
                  height={32}
                  className="rounded"
                />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">トモシゴト</h2>
                <p className="text-xs text-gray-500">能楽部練習表</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 flex items-center justify-center mx-auto">
              <Image 
                src="/favicon.png" 
                alt="トモシゴト" 
                width={32} 
                height={32}
                className="rounded"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {!isCollapsed && <NavTitle label="メイン" />}
          
          <NavItem
            icon={<Home className="w-4 h-4" />}
            label={isCollapsed ? "" : "ダッシュボード"}
            active={pathname === '/'}
            href="/"
            className={isCollapsed ? "justify-center px-2" : ""}
          />

          {!isCollapsed && <NavTitle label="練習管理" />}

          <NavItem
            icon={<Calendar className="w-4 h-4" />}
            label={isCollapsed ? "" : "登録"}
            active={pathname === '/practice-schedule'}
            href="/practice-schedule"
            className={isCollapsed ? "justify-center px-2" : ""}
          />

          <NavItem
            icon={<CalendarDays className="w-4 h-4" />}
            label={isCollapsed ? "" : "スケジュール"}
            active={pathname === '/schedule'}
            href="/schedule"
            className={isCollapsed ? "justify-center px-2" : ""}
          />

          <NavItem
            icon={<BookOpen className="w-4 h-4" />}
            label={isCollapsed ? "" : "練習表"}
            active={pathname === '/practice-slots'}
            href="/practice-slots"
            className={isCollapsed ? "justify-center px-2" : ""}
          />

          <NavItem
            icon={<Edit3 className="w-4 h-4" />}
            label={isCollapsed ? "" : "練習表編集"}
            active={pathname.startsWith('/practice-schedule-editor')}
            href="/practice-schedule-editor"
            className={isCollapsed ? "justify-center px-2" : ""}
          />

          <NavItem
            icon={<Building className="w-4 h-4" />}
            label={isCollapsed ? "" : "部屋設定"}
            active={pathname === '/room-settings'}
            href="/room-settings"
            className={isCollapsed ? "justify-center px-2" : ""}
          />
          <NavItem
            icon={<Theater className="w-4 h-4" />}
            label={isCollapsed ? "" : "舞台・パート登録"}
            active={pathname === '/parts-setting'}
            href="/parts-setting"
            className={isCollapsed ? "justify-center px-2" : ""}
          /> 

          <NavItem
            icon={<UserCheck className="w-4 h-4" />}
            label={isCollapsed ? "" : "メンバー所属設定"}
            active={pathname === '/member-assignments-setting'}
            href="/member-assignments-setting"
            className={isCollapsed ? "justify-center px-2" : ""}
          />

          <NavItem
            icon={<ReceiptText className="w-4 h-4" />}
            label={isCollapsed ? "" : "演目一覧"}
            active={pathname === '/performances-list'}
            href="/performances-list"
            className={isCollapsed ? "justify-center px-2" : ""}
          />

          <NavItem
            icon={<Clock className="w-4 h-4" />}
            label={isCollapsed ? "" : "出席管理"}
            active={pathname === '/attendance'}
            href="/attendance"
            className={isCollapsed ? "justify-center px-2" : ""}
          />

          <NavItem
            icon={<Users className="w-4 h-4" />}
            label={isCollapsed ? "" : "管理者用出席管理"}
            active={pathname === '/admin/attendance'}
            href="/admin/attendance"
            className={isCollapsed ? "justify-center px-2" : ""}
          />

          {!isCollapsed && <NavTitle label="その他" />}

          <NavItem
            icon={<User className="w-4 h-4" />}
            label={isCollapsed ? "" : "アカウント設定"}
            active={pathname === '/account-setting'}
            href="/account-setting"
            className={isCollapsed ? "justify-center px-2" : ""}
          />

          <NavItem
            icon={<Settings className="w-4 h-4" />}
            label={isCollapsed ? "" : "設定"}
            active={pathname === '/settings'}
            href="/settings"
            className={isCollapsed ? "justify-center px-2" : ""}
          />
        </div>

        {/* Collapse toggle */}
        <div className="flex-shrink-0 border-t border-gray-200 p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full justify-center hover-icon"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Mobile toggle button component for header
export function MobileSidebarToggle({ onToggle }: { onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="md:hidden w-10 h-10 p-0 hover:bg-gray-100"
    >
      <FileText className="w-6 h-6 text-blue-600" />
    </Button>
  );
} 