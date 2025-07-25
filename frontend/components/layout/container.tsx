import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const containerVariants = cva(
  'w-full', // ベース幅
  {
    variants: {
      maxWidth: {
        xs: 'max-w-xs',
        sm: 'max-w-sm', 
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        '7xl': 'max-w-7xl',
        full: 'max-w-full',
      },
      center: {
        true: 'mx-auto',
        false: '',
      },
    },
    defaultVariants: {
      maxWidth: '7xl',
      center: true,
    },
  }
)

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  /**
   * パディングの設定
   * - boolean: true (デフォルト) でレスポンシブパディング、false で無効
   * - string: カスタムパディングクラス
   */
  padding?: boolean | string
  /**
   * 中央寄せするかどうか
   * @default true
   */
  center?: boolean
  /**
   * 最大幅の設定
   * @default '7xl'
   */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, maxWidth, center = true, padding = true, ...props }, ref) => {
    // パディングのクラスを決定
    const paddingClass = React.useMemo(() => {
      if (padding === false) return ''
      if (typeof padding === 'string') return padding
      // デフォルトのレスポンシブパディング
      return 'px-4 sm:px-6 lg:px-8'
    }, [padding])

    return (
      <div
        className={cn(
          containerVariants({ maxWidth, center }),
          paddingClass,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Container.displayName = 'Container'

export { Container, containerVariants }