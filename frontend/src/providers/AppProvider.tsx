'use client'

import React, { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { store } from '../store'
import { AuthProvider } from '../lib/auth/AuthProvider'
import { ErrorBoundary } from '../lib/error/ErrorBoundary'
import { setApiClient } from '../lib/api/hooks'
import { api } from '../lib/api/client'

// アプリプロバイダーのプロパティ型
interface AppProviderProps {
  children: ReactNode
}

// APIクライアントの初期化
setApiClient(api)

export function AppProvider({ children }: AppProviderProps) {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </Provider>
    </ErrorBoundary>
  )
}