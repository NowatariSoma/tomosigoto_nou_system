'use client';

import { useState, ReactNode } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

interface AppTemplateProps {
  children: ReactNode;
  title?: string;
  description?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  className?: string;
}

export function AppTemplate({ 
  children, 
  title, 
  description, 
  maxWidth = '7xl',
  className = ''
}: AppTemplateProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
            {(title || description) && (
              <div className="mb-8">
                {title && (
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {title}
                  </h1>
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