'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'

// エラー情報型
interface ErrorBoundaryState {
  error: Error | null
  errorInfo: ErrorInfo | null
}

// エラーバウンダリーのプロパティ型
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode)
  onError?: (error: Error, info: ErrorInfo) => void
}

// エラーバウンダリークラス
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      error: null,
      errorInfo: null,
    }
  }

  // エラーが発生した時に呼ばれる
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      error,
      errorInfo: null,
    }
  }

  // エラー情報をキャッチして処理
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    })

    // エラーログの記録
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // 外部のエラーハンドラーを呼び出し
    this.props.onError?.(error, errorInfo)

    // 本番環境では外部のエラー追跡サービスに送信
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo)
    }
  }

  // エラー状態をリセット
  resetError = (): void => {
    this.setState({
      error: null,
      errorInfo: null,
    })
  }

  // エラーレポート送信（プレースホルダー）
  private reportError(error: Error, errorInfo: ErrorInfo): void {
    // TODO: Sentry、LogRocket、Bugsnagなどのエラー追跡サービスと連携
    console.log('Error reported to external service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    })
  }

  render(): ReactNode {
    const { error, errorInfo } = this.state
    const { children, fallback } = this.props

    if (error) {
      // カスタムフォールバックコンポーネントがある場合
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, this.resetError)
        }
        return fallback
      }

      // デフォルトのエラー表示
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  エラーが発生しました
                </h3>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                申し訳ございませんが、予期しないエラーが発生しました。
                ページを再読み込みするか、しばらく時間をおいて再度お試しください。
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-3 bg-gray-100 rounded-md">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                    エラー詳細 (開発環境)
                  </summary>
                  <div className="text-red-600">
                    <p className="font-mono text-xs mb-2">{error.message}</p>
                    {error.stack && (
                      <pre className="text-xs overflow-auto max-h-32 bg-white p-2 rounded border">
                        {error.stack}
                      </pre>
                    )}
                    {errorInfo?.componentStack && (
                      <div className="mt-2">
                        <p className="font-medium text-xs mb-1">Component Stack:</p>
                        <pre className="text-xs overflow-auto max-h-32 bg-white p-2 rounded border">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={this.resetError}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                再試行
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                ページ再読み込み
              </button>
            </div>
          </div>
        </div>
      )
    }

    return children
  }
}

// エラーバウンダリーでコンポーネントをラップするHOC
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// フック形式のエラーハンドラー
export function useErrorHandler() {
  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Manual error handling:', error, errorInfo)
    
    // 本番環境では外部のエラー追跡サービスに送信
    if (process.env.NODE_ENV === 'production') {
      // TODO: 外部サービスと連携
      console.log('Error reported to external service:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      })
    }
  }

  return { handleError }
}