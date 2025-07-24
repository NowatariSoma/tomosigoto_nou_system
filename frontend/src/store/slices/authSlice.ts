import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

// 型定義
export interface User {
  id: string
  email: string
  name: string
  role?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// 初期状態
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

// 非同期アクション
export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // TODO: APIクライアントと連携
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('ログインに失敗しました')
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'ログインエラー')
    }
  }
)

export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: APIクライアントと連携
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      return true
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'ログアウトエラー')
    }
  }
)

export const refreshTokenAsync = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: APIクライアントと連携
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('トークンの更新に失敗しました')
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'トークン更新エラー')
    }
  }
)

// スライス
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearAuthError: (state) => {
      state.error = null
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
    },
  },
  extraReducers: (builder) => {
    // ログインアクション
    builder
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

    // ログアウトアクション
    builder
      .addCase(logoutAsync.pending, (state) => {
        state.isLoading = true
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.isLoading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = null
      })
      .addCase(logoutAsync.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // トークン更新アクション
    builder
      .addCase(refreshTokenAsync.pending, (state) => {
        state.isLoading = true
      })
      .addCase(refreshTokenAsync.fulfilled, (state, action) => {
        state.isLoading = false
        state.token = action.payload.token
        state.user = action.payload.user
        state.error = null
      })
      .addCase(refreshTokenAsync.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

// セレクター
export const selectUser = (state: { auth: AuthState }) => state.auth.user
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error

// アクションのエクスポート
export const { setAuthError, clearAuthError, updateUser } = authSlice.actions
export default authSlice.reducer