import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-blue-400 text-white hover:bg-blue-500',
        secondary:
          'border-transparent bg-blue-200 text-black hover:bg-blue-300',
        destructive:
          'border-transparent bg-gray-600 text-white hover:bg-gray-700',
        outline: 'text-foreground border-gray-300',
        accent:
          'border-transparent bg-accent-300 text-accent-900 hover:bg-accent-400',
        admin:
          'border-transparent bg-blue-600 text-white hover:bg-blue-700',
        success:
          'border-transparent bg-blue-400 text-white hover:bg-blue-500',
        warning:
          'border-transparent bg-accent-300 text-accent-900 hover:bg-accent-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
