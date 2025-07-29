import * as React from 'react'
import { createPortal } from 'react-dom'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const modalVariants = cva(
  'relative w-full bg-background border border-border rounded-lg shadow-lg max-h-[90vh] overflow-y-auto',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg', 
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export interface ModalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalVariants> {
  /**
   * モーダルの表示状態
   */
  isOpen: boolean
  /**
   * 閉じる処理
   */
  onClose: () => void
  /**
   * モーダルのタイトル
   */
  title?: string
  /**
   * モーダルのサイズ
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /**
   * オーバーレイクリックで閉じるかどうか
   * @default true
   */
  closeOnOverlayClick?: boolean
  /**
   * Escキーで閉じるかどうか
   * @default true
   */
  closeOnEscape?: boolean
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ 
    className, 
    isOpen, 
    onClose, 
    title, 
    size = 'md', 
    closeOnOverlayClick = true, 
    closeOnEscape = true,
    children,
    ...props 
  }, ref) => {
    const [mounted, setMounted] = React.useState(false)
    const modalRef = React.useRef<HTMLDivElement>(null)
    const titleId = React.useId()

    React.useEffect(() => {
      setMounted(true)
    }, [])

    // Escapeキーのハンドリング
    React.useEffect(() => {
      if (!isOpen || !closeOnEscape) return

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, closeOnEscape, onClose])

    // フォーカストラップ
    React.useEffect(() => {
      if (!isOpen) return

      // DOMが完全にレンダリングされるまで待機
      const focusTimeout = setTimeout(() => {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

          // 初期フォーカス
          firstElement.focus()

          const handleTabKey = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return

            if (event.shiftKey) {
              if (document.activeElement === firstElement) {
                event.preventDefault()
                lastElement.focus()
              }
            } else {
              if (document.activeElement === lastElement) {
                event.preventDefault()
                firstElement.focus()
              }
            }
          }

          document.addEventListener('keydown', handleTabKey)
          return () => document.removeEventListener('keydown', handleTabKey)
        }
      }, 0)

      return () => clearTimeout(focusTimeout)
    }, [isOpen])

    // オーバーレイクリックのハンドリング
    const handleOverlayClick = (event: React.MouseEvent) => {
      if (closeOnOverlayClick && event.target === event.currentTarget) {
        onClose()
      }
    }

    if (!mounted || !isOpen) return null

    const modalContent = (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={handleOverlayClick}
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          className={cn(modalVariants({ size }), className)}
          {...props}
        >
          {title && (
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 id={titleId} className="text-lg font-semibold text-foreground">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-md transition-colors"
                aria-label="モーダルを閉じる"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    )

    return createPortal(modalContent, document.body)
  }
)

Modal.displayName = 'Modal'

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between space-y-1.5 pb-4',
          className
        )}
        {...props}
      />
    )
  }
)

ModalHeader.displayName = 'ModalHeader'

export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex-1 py-4', className)}
        {...props}
      />
    )
  }
)

ModalBody.displayName = 'ModalBody'

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex justify-end gap-2 pt-4',
          className
        )}
        {...props}
      />
    )
  }
)

ModalFooter.displayName = 'ModalFooter'

export { Modal, ModalHeader, ModalBody, ModalFooter, modalVariants }