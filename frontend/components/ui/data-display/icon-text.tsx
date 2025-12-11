import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface IconTextProps {
  icon: LucideIcon;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconClassName?: string;
}

export const IconText: React.FC<IconTextProps> = ({
  icon: Icon,
  children,
  size = 'md',
  className,
  iconClassName,
}) => {
  const sizeClasses = {
    sm: { icon: 'h-3 w-3', text: 'text-xs' },
    md: { icon: 'h-4 w-4', text: 'text-sm' },
    lg: { icon: 'h-5 w-5', text: 'text-base' },
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Icon className={cn("text-black", sizeClasses[size].icon, iconClassName)} />
      <span className={cn("text-black", sizeClasses[size].text)}>
        {children}
      </span>
    </div>
  );
};
