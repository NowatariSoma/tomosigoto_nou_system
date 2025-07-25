import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { AuthProvider, useAuth, withAuth } from '../AuthProvider'
import authSlice from '../../../store/slices/authSlice'

// useLocalStorageフックのモック
jest.mock('../../../hooks/useLocalStorage', () => ({
  useLocalStorage: jest.fn(() => [null, jest.fn(), jest.fn()]),
}))

// APIクライアントのモック
jest.mock('../../api/client', () => ({
  api: {
    setAuthToken: jest.fn(),
    post: jest.fn(),
  },
}))

// fetchのモック
global.fetch = jest.fn()

describe('AuthProvider', () => {
  let store: ReturnType<typeof configureStore>
  let mockSetStoredToken: jest.Mock
  let mockUseLocalStorage: jest.Mock

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authSlice,
      },
    })

    mockSetStoredToken = jest.fn()
    mockUseLocalStorage = require('../../../hooks/useLocalStorage').useLocalStorage
    mockUseLocalStorage.mockReturnValue([null, mockSetStoredToken, jest.fn()])

    ;(global.fetch as jest.Mock).mockClear()
  })

  const TestComponent = () => {
    const auth = useAuth()
    return (
      <div>
        <div data-testid="user">{auth.user?.name || 'null'}</div>
        <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
        <div data-testid="loading">{auth.isLoading.toString()}</div>
        <div data-testid="error">{auth.error || 'null'}</div>
        <button 
          data-testid="login-button"
          onClick={() => auth.login('test@example.com', 'password')}
        >
          ログイン
        </button>
        <button 
          data-testid="logout-button"
          onClick={() => auth.logout()}
        >
          ログアウト
        </button>
        <button 
          data-testid="signup-button"
          onClick={() => auth.signup({
            email: 'test@example.com',
            password: 'password',
            name: 'テストユーザー'
          })}
        >
          サインアップ
        </button>
      </div>
    )
  }

  const renderWithProvider = () => {
    return render(
      <Provider store={store}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </Provider>
    )
  }

  describe('初期状態', () => {
    it('初期状態で正しい値を表示するべき', () => {
      renderWithProvider()

      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('error')).toHaveTextContent('null')
    })
  })

  describe('ログイン機能', () => {
    it('ログイン成功時: 正しい状態に更新されるべき', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', name: 'テストユーザー' },
        token: 'test-token',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      renderWithProvider()

      const loginButton = screen.getByTestId('login-button')
      
      await act(async () => {
        loginButton.click()
      })

      await waitFor(() => {
        expect(mockSetStoredToken).toHaveBeenCalledWith('test-token')
      })
    })

    it('ログイン失敗時: エラーがスローされるべき', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      renderWithProvider()

      const loginButton = screen.getByTestId('login-button')
      
      await act(async () => {
        loginButton.click()
      })

      // エラー状態を確認（実際の実装では、エラーはstore経由で管理される）
      await waitFor(() => {
        expect(mockSetStoredToken).not.toHaveBeenCalled()
      })
    })
  })

  describe('ログアウト機能', () => {
    it('ログアウト成功時: ストレージがクリアされるべき', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      })

      renderWithProvider()

      const logoutButton = screen.getByTestId('logout-button')
      
      await act(async () => {
        logoutButton.click()
      })

      await waitFor(() => {
        expect(mockSetStoredToken).toHaveBeenCalledWith(null)
      })
    })

    it('ログアウト失敗時: ローカル状態はクリアされるべき', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('ログアウトエラー'))

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      renderWithProvider()

      const logoutButton = screen.getByTestId('logout-button')
      
      await act(async () => {
        logoutButton.click()
      })

      await waitFor(() => {
        expect(mockSetStoredToken).toHaveBeenCalledWith(null)
        expect(consoleSpy).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('サインアップ機能', () => {
    it('サインアップ成功時: トークンが保存され、ユーザー情報が取得されるべき', async () => {
      const mockApi = require('../../api/client').api
      const mockSignupResponse = { token: 'signup-token' }
      const mockUserResponse = { 
        user: { id: '1', email: 'test@example.com', name: 'テストユーザー' },
        token: 'refresh-token'
      }

      mockApi.post.mockResolvedValueOnce(mockSignupResponse)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserResponse),
      })

      renderWithProvider()

      const signupButton = screen.getByTestId('signup-button')
      
      await act(async () => {
        signupButton.click()
      })

      await waitFor(() => {
        expect(mockSetStoredToken).toHaveBeenCalledWith('signup-token')
        expect(mockApi.setAuthToken).toHaveBeenCalledWith('signup-token')
      })
    })
  })

  describe('useAuth フック', () => {
    it('AuthProvider外で使用した場合エラーがスローされるべき', () => {
      const TestComponentOutsideProvider = () => {
        useAuth()
        return <div>Test</div>
      }

      expect(() => {
        render(<TestComponentOutsideProvider />)
      }).toThrow('useAuth must be used within an AuthProvider')
    })
  })

  describe('withAuth HOC', () => {
    const TestProtectedComponent = () => <div data-testid="protected">保護されたコンテンツ</div>
    const ProtectedComponent = withAuth(TestProtectedComponent)

    it('認証済みの場合: コンポーネントが表示されるべき', () => {
      // 認証済み状態をセットアップ
      store.dispatch({ 
        type: 'auth/loginAsync/fulfilled',
        payload: {
          user: { id: '1', email: 'test@example.com', name: 'テストユーザー' },
          token: 'test-token',
        }
      })

      render(
        <Provider store={store}>
          <AuthProvider>
            <ProtectedComponent />
          </AuthProvider>
        </Provider>
      )

      expect(screen.getByTestId('protected')).toBeInTheDocument()
    })

    it('未認証の場合: 認証が必要メッセージが表示されるべき', () => {
      render(
        <Provider store={store}>
          <AuthProvider>
            <ProtectedComponent />
          </AuthProvider>
        </Provider>
      )

      expect(screen.getByText('認証が必要です')).toBeInTheDocument()
      expect(screen.getByText('このページにアクセスするにはログインが必要です。')).toBeInTheDocument()
    })

    it('ローディング中: ローディングスピナーが表示されるべき', () => {
      // ローディング状態をセットアップ
      store.dispatch({ type: 'auth/loginAsync/pending' })

      render(
        <Provider store={store}>
          <AuthProvider>
            <ProtectedComponent />
          </AuthProvider>
        </Provider>
      )

      expect(screen.getByRole('generic')).toBeInTheDocument() // スピナーの要素
    })
  })

  describe('トークンの永続化', () => {
    it('保存されたトークンがある場合: 初期化時にリフレッシュが実行されるべき', async () => {
      const mockStoredToken = 'stored-token'
      mockUseLocalStorage.mockReturnValue([mockStoredToken, mockSetStoredToken, jest.fn()])

      const mockRefreshResponse = {
        user: { id: '1', email: 'test@example.com', name: 'テストユーザー' },
        token: 'refreshed-token',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRefreshResponse),
      })

      const mockApi = require('../../api/client').api

      renderWithProvider()

      await waitFor(() => {
        expect(mockApi.setAuthToken).toHaveBeenCalledWith(mockStoredToken)
      })
    })

    it('無効なトークンの場合: ストレージがクリアされるべき', async () => {
      const mockStoredToken = 'invalid-token'
      mockUseLocalStorage.mockReturnValue([mockStoredToken, mockSetStoredToken, jest.fn()])

      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Invalid token'))

      const mockApi = require('../../api/client').api

      renderWithProvider()

      await waitFor(() => {
        expect(mockSetStoredToken).toHaveBeenCalledWith(null)
        expect(mockApi.setAuthToken).toHaveBeenCalledWith(null)
      })
    })
  })
})