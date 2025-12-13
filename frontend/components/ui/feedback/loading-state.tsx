import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = '読み込み中...',
  className,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <Loader2 className={cn("animate-spin text-blue-400 mr-2", sizeClasses[size])} />
      <span className="text-black">{message}</span>
    </div>
  );
};
