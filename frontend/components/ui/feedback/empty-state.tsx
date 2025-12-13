import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn("text-center py-12", className)}>
      {Icon && (
        <Icon className="h-12 w-12 text-black mx-auto mb-4" />
      )}
      <div className="text-black text-lg mb-2">
        {title}
      </div>
      {description && (
        <p className="text-black text-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
};
