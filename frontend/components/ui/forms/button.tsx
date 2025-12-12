import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // プライマリ: 保存、登録、送信など最重要アクション（1画面に1-2個）
        default: 'bg-blue-400 text-white hover:bg-blue-500',
        // デストラクティブ: 削除のみ
        destructive: 'bg-red-400 text-white hover:bg-red-500',
        // アクセント: 注目させたい重要なボタン（黄色）
        accent: 'bg-yellow-300 text-black hover:bg-yellow-400',
        // アウトライン: 編集、追加など補助的アクション
        outline: 'border border-blue-300 bg-white text-black hover:bg-blue-50 hover:border-blue-400',
        // セカンダリ: サブアクション（青背景上で使用）
        secondary: 'bg-white text-black hover:bg-blue-50 border border-blue-200',
        // ゴースト: キャンセル、閉じるなど（ホバーは青系）
        ghost: 'text-black hover:bg-blue-50',
        // リンク
        link: 'text-black underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
