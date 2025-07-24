// ユーザー関連の型定義
export interface User {
  id: string
  email: string
  name: string
  role?: string
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

// 認証関連の型定義
export interface AuthResponse {
  user: User
  token: string
  refreshToken?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  email: string
  password: string
  name: string
  confirmPassword?: string
}

// API関連の型定義
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: number
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// エラー関連の型定義
export interface ApiErrorResponse {
  message: string
  status: number
  code?: string
  errors?: Record<string, string[]>
}

// フォーム関連の型定義
export interface FormFieldError {
  message: string
  type?: string
}

export interface FormState<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isValid: boolean
}

// UI関連の型定義
export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export interface LoadingState {
  isLoading: boolean
  message?: string
}

// 練習表関連の型定義（アプリケーション固有）
export interface Schedule {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  status: 'draft' | 'published' | 'archived'
  createdBy: string
  participants: User[]
  createdAt: string
  updatedAt: string
}

export interface ScheduleSlot {
  id: string
  scheduleId: string
  title: string
  startTime: string
  endTime: string
  capacity: number
  booked: number
  instructor?: User
  location?: string
}

// 共通ユーティリティ型
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// 状態管理関連の型定義
export interface AppState {
  auth: {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
  }
  ui: {
    theme: 'light' | 'dark' | 'system'
    sidebarOpen: boolean
    toasts: ToastMessage[]
    loading: LoadingState
  }
  schedule: {
    schedules: Schedule[]
    currentSchedule: Schedule | null
    isLoading: boolean
    error: string | null
  }
}

// イベント関連の型定義
export interface AppEvent {
  type: string
  payload?: any
  timestamp: number
}

// キャッシュ関連の型定義
export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  staleTime: number
}

export interface CacheOptions {
  staleTime?: number
  cacheTime?: number
  enabled?: boolean
}

// HTTP関連の型定義
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface RequestConfig {
  method: HttpMethod
  url: string
  data?: any
  params?: Record<string, any>
  headers?: Record<string, string>
  timeout?: number
  signal?: AbortSignal
}

// 環境関連の型定義
export interface AppConfig {
  apiUrl: string
  environment: 'development' | 'staging' | 'production'
  enableDevTools: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}