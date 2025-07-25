import { configureStore } from '@reduxjs/toolkit'
import authSlice, {
  loginAsync,
  logoutAsync,
  refreshTokenAsync,
  setAuthError,
  clearAuthError,
  updateUser,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  AuthState,
  User,
} from '../authSlice'

// モックされたfetchのセットアップ
global.fetch = jest.fn()

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authSlice,
      },
    })
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('初期状態', () => {
    it('正しい初期状態を持つべき', () => {
      const state = store.getState().auth
      expect(state).toEqual({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    })
  })

  describe('同期アクション', () => {
    it('setAuthError: エラーメッセージを設定できるべき', () => {
      const errorMessage = 'テストエラー'
      store.dispatch(setAuthError(errorMessage))
      
      const state = store.getState().auth
      expect(state.error).toBe(errorMessage)
    })

    it('clearAuthError: エラーをクリアできるべき', () => {
      store.dispatch(setAuthError('テストエラー'))
      store.dispatch(clearAuthError())
      
      const state = store.getState().auth
      expect(state.error).toBeNull()
    })

    it('updateUser: ユーザー情報を更新できるべき', () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'テストユーザー',
        role: 'user',
      }
      
      store.dispatch(updateUser(user))
      
      const state = store.getState().auth
      expect(state.user).toEqual(user)
    })
  })

  describe('セレクター', () => {
    it('selectUser: ユーザー情報を取得できるべき', () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'テストユーザー',
      }
      
      store.dispatch(updateUser(user))
      const selectedUser = selectUser(store.getState())
      expect(selectedUser).toEqual(user)
    })

    it('selectIsAuthenticated: 認証状態を取得できるべき', () => {
      expect(selectIsAuthenticated(store.getState())).toBe(false)
    })

    it('selectAuthLoading: ローディング状態を取得できるべき', () => {
      expect(selectAuthLoading(store.getState())).toBe(false)
    })

    it('selectAuthError: エラー状態を取得できるべき', () => {
      store.dispatch(setAuthError('テストエラー'))
      expect(selectAuthError(store.getState())).toBe('テストエラー')
    })
  })

  describe('loginAsync', () => {
    it('ログイン成功時: 正しい状態に更新されるべき', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', name: 'テストユーザー' },
        token: 'test-token',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      await store.dispatch(loginAsync({
        email: 'test@example.com',
        password: 'password',
      }))

      const state = store.getState().auth
      expect(state.user).toEqual(mockResponse.user)
      expect(state.token).toBe(mockResponse.token)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('ログイン失敗時: エラー状態に更新されるべき', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      await store.dispatch(loginAsync({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      }))

      const state = store.getState().auth
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBe('ログインに失敗しました')
    })

    it('ネットワークエラー時: エラー状態に更新されるべき', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('ネットワークエラー'))

      await store.dispatch(loginAsync({
        email: 'test@example.com',
        password: 'password',
      }))

      const state = store.getState().auth
      expect(state.error).toBe('ネットワークエラー')
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('logoutAsync', () => {
    beforeEach(() => {
      // ログイン状態を設定
      store.dispatch(updateUser({
        id: '1',
        email: 'test@example.com',
        name: 'テストユーザー',
      }))
    })

    it('ログアウト成功時: 状態がクリアされるべき', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      })

      await store.dispatch(logoutAsync())

      const state = store.getState().auth
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('ログアウト失敗時: エラー状態に更新されるべき', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('ログアウトエラー'))

      await store.dispatch(logoutAsync())

      const state = store.getState().auth
      expect(state.error).toBe('ログアウトエラー')
    })
  })

  describe('refreshTokenAsync', () => {
    it('トークン更新成功時: 新しいトークンで状態が更新されるべき', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', name: 'テストユーザー' },
        token: 'new-token',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      await store.dispatch(refreshTokenAsync())

      const state = store.getState().auth
      expect(state.user).toEqual(mockResponse.user)
      expect(state.token).toBe(mockResponse.token)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('トークン更新失敗時: エラー状態に更新されるべき', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      await store.dispatch(refreshTokenAsync())

      const state = store.getState().auth
      expect(state.error).toBe('トークンの更新に失敗しました')
      expect(state.isLoading).toBe(false)
    })
  })
})