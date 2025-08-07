'use client';

import React from 'react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/forms/button';
import { 
  Upload, 
  History, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  Settings,
  Users,
  X,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Home,
  Building
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <button
          onClick={handleChevronClick}
          className="flex-shrink-0 ml-2 p-1 hover-icon transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
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
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleAnalysisClick = () => {
    setIsAnalysisExpanded(!isAnalysisExpanded);
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
        <div className="fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-200 shadow-lg z-50 md:hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">SlideHub</h2>
                  <p className="text-xs text-gray-500">PowerPoint差分比較</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onMobileClose}
                className="w-8 h-8 p-0 hover-icon"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
              <NavTitle label="メイン" />
              
              <NavItem
                icon={<Home className="w-4 h-4" />}
                label="ダッシュボード"
                active={pathname === '/'}
                onClick={() => handleNavigateAndClose('/')}
              />
              
              <NavItem
                icon={<Upload className="w-4 h-4" />}
                label="ファイルアップロード"
                active={pathname === '/upload'}
                onClick={() => handleNavigateAndClose('/upload')}
              />
              
              <NavItem
                icon={<History className="w-4 h-4" />}
                label="差分履歴"
                active={pathname === '/history'}
                onClick={() => handleNavigateAndClose('/history')}
              />

              <div className="pt-6">
                <NavTitle label="分析・レビュー" />
                
                <NavItem
                  icon={<FileText className="w-4 h-4" />}
                  label="差分分析"
                  active={pathname.startsWith('/diff')}
                  hasChildren={true}
                  isExpanded={isAnalysisExpanded}
                  onToggleExpand={handleAnalysisClick}
                  onClick={() => handleNavigateAndClose('/history')}
                />
                
                {isAnalysisExpanded && (
                  <div className="space-y-1">
                    <SubNavItem
                      icon={<MessageCircle className="w-4 h-4" />}
                      label="注釈・コメント"
                      active={pathname.startsWith('/annotate')}
                      onClick={() => handleNavigateAndClose('/annotate/1')}
                    />
                  </div>
                )}
                
                <NavItem
                  icon={<BarChart3 className="w-4 h-4" />}
                  label="統計・レポート"
                  onClick={() => {}}
                />
              </div>

              <div className="pt-6">
                <NavTitle label="設定" />
                
                <NavItem
                  icon={<Building className="w-4 h-4" />}
                  label="会場設定"
                  active={pathname === '/room-settings'}
                  onClick={() => handleNavigateAndClose('/room-settings')}
                />
                
                <NavItem
                  icon={<Users className="w-4 h-4" />}
                  label="チーム管理"
                  active={pathname === '/settings' && new URLSearchParams(window.location.search).get('tab') === 'team'}
                  onClick={() => handleNavigateAndClose('/settings?tab=team')}
                />
                
                <NavItem
                  icon={<Settings className="w-4 h-4" />}
                  label="システム設定"
                  active={pathname === '/settings'}
                  onClick={() => handleNavigateAndClose('/settings')}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>システム正常稼働中</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop collapsed sidebar
  if (isCollapsed) {
    return (
      <div className="hidden md:flex w-16 bg-white border-r border-gray-200 flex-col items-center py-4 shadow-sm">
        <div className="mb-6">
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer"
            title="サイドバーを展開"
          >
            <FileText className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <div className="flex flex-col space-y-2 w-full px-2">
          <button
            onClick={() => router.push('/')}
            className={cn(
              "w-12 h-12 rounded-md flex items-center justify-center transition-colors hover-button",
              pathname === '/' 
                ? "active-button" 
                : ""
            )}
            title="ダッシュボード"
          >
            <Home className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => router.push('/upload')}
            className={cn(
              "w-12 h-12 rounded-md flex items-center justify-center transition-colors hover-button",
              pathname === '/upload' 
                ? "active-button" 
                : ""
            )}
            title="ファイルアップロード"
          >
            <Upload className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => router.push('/history')}
            className={cn(
              "w-12 h-12 rounded-md flex items-center justify-center transition-colors hover-button",
              pathname === '/history' 
                ? "active-button" 
                : ""
            )}
            title="差分履歴"
          >
            <History className="w-5 h-5" />
          </button>

          <div className="pt-2 border-t border-gray-200 space-y-2">
            <button
              onClick={() => router.push('/settings')}
              className={cn(
                "w-12 h-12 rounded-md flex items-center justify-center transition-colors hover-button",
                pathname === '/settings' 
                  ? "active-button" 
                  : ""
              )}
              title="設定"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="mt-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-12 h-12 p-0 hover-icon"
            title="サイドバーを展開"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Desktop expanded sidebar
  return (
    <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">SlideHub</h2>
            <p className="text-xs text-gray-500">PowerPoint差分比較</p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-8 h-8 p-0 hover-icon"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <NavTitle label="メイン" />
        
        <NavItem
          icon={<Home className="w-4 h-4" />}
          label="ダッシュボード"
          active={pathname === '/'}
          href="/"
        />
        
        <NavItem
          icon={<Upload className="w-4 h-4" />}
          label="ファイルアップロード"
          active={pathname === '/upload'}
          href="/upload"
        />
        
        <NavItem
          icon={<History className="w-4 h-4" />}
          label="差分履歴"
          active={pathname === '/history'}
          href="/history"
        />

        <div className="pt-6">
          <NavTitle label="分析・レビュー" />
          
          <NavItem
            icon={<FileText className="w-4 h-4" />}
            label="差分分析"
            active={pathname.startsWith('/diff')}
            hasChildren={true}
            isExpanded={isAnalysisExpanded}
            onToggleExpand={handleAnalysisClick}
            onClick={() => handleNavigateAndClose('/history')}
          />
          
          {isAnalysisExpanded && (
            <div className="space-y-1">
              <SubNavItem
                icon={<MessageCircle className="w-4 h-4" />}
                label="注釈・コメント"
                active={pathname.startsWith('/annotate')}
                href="/annotate/1"
              />
            </div>
          )}
          
          <NavItem
            icon={<BarChart3 className="w-4 h-4" />}
            label="統計・レポート"
            onClick={() => {}}
          />
        </div>

        <div className="pt-6">
          <NavTitle label="設定" />
          
          <NavItem
            icon={<Building className="w-4 h-4" />}
            label="会場設定"
            active={pathname === '/room-settings'}
            href="/room-settings"
          />
          
          <NavItem
            icon={<Users className="w-4 h-4" />}
            label="チーム管理"
            active={pathname === '/settings'}
            href="/settings"
          />
          
          <NavItem
            icon={<Settings className="w-4 h-4" />}
            label="システム設定"
            active={pathname === '/settings'}
            href="/settings"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>システム正常稼働中</span>
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