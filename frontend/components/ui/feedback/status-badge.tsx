import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      type: {
        development: '',
        permission: '',
      },
      level: {
        // Development levels
        alpha: '',
        beta: '',
        stable: '',
        // Permission levels
        basic: '',
        instructor: '',
        admin: '',
        super: '',
      },
    },
    compoundVariants: [
      // Development status variants
      {
        type: 'development',
        level: 'alpha',
        class: 'border-transparent bg-red-500 text-white hover:bg-red-600',
      },
      {
        type: 'development',
        level: 'beta',
        class: 'border-transparent bg-orange-500 text-white hover:bg-orange-600',
      },
      {
        type: 'development',
        level: 'stable',
        class: 'border-transparent bg-green-500 text-white hover:bg-green-600',
      },
      // Permission level variants
      {
        type: 'permission',
        level: 'basic',
        class: 'border-transparent bg-gray-500 text-white hover:bg-gray-600',
      },
      {
        type: 'permission',
        level: 'instructor',
        class: 'border-transparent bg-teal-500 text-white hover:bg-teal-600',
      },
      {
        type: 'permission',
        level: 'admin',
        class: 'border-transparent bg-blue-500 text-white hover:bg-blue-600',
      },
      {
        type: 'permission',
        level: 'super',
        class: 'border-transparent bg-purple-500 text-white hover:bg-purple-600',
      },
    ],
    defaultVariants: {
      type: 'development',
      level: 'stable',
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  type: 'development' | 'permission';
  level: 'alpha' | 'beta' | 'stable' | 'basic' | 'instructor' | 'admin' | 'super';
}

function StatusBadge({ 
  className, 
  type, 
  level, 
  ...props 
}: StatusBadgeProps) {
  return (
    <div 
      className={cn(statusBadgeVariants({ type, level }), className)} 
      {...props} 
    />
  );
}

export { StatusBadge, statusBadgeVariants };