import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { TokenManager } from '@/lib/token-manager'

// モックの設定
jest.mock('@/lib/token-manager')
jest.mock('@/lib/supabase', () => ({
  auth: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
  }
}))

const mockTokenManager = TokenManager as jest.Mocked<typeof TokenManager>

// テスト用コンポーネント
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout, error } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no-user'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button onClick={() => login('test@example.com', 'password123')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('AuthProvider', () => {
    test('初期化時に認証状態をチェックする', async () => {
      mockTokenManager.isAuthenticated.mockReturnValue(false)
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // 初期状態はローディング
      expect(screen.getByTestId('loading')).toHaveTextContent('loading')
      
      // ローディング完了後
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated')
        expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      })
    })

    test('既存の有効なトークンがある場合、認証済み状態で初期化される', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' }
      mockTokenManager.isAuthenticated.mockReturnValue(true)
      mockTokenManager.getUserFromToken.mockReturnValue(mockUser)
      mockTokenManager.getToken.mockReturnValue('valid-token')
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated')
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser))
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })
    })
  })

  describe('useAuth hook', () => {
    test('ログイン成功時に状態が更新される', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' }
      const mockAuthResponse = {
        data: { user: mockUser, session: { access_token: 'new-token' } },
        error: null
      }
      
      mockTokenManager.isAuthenticated.mockReturnValue(false)
      const mockSignIn = require('@/lib/supabase').auth.signIn
      mockSignIn.mockResolvedValue(mockAuthResponse)
      mockTokenManager.getUserFromToken.mockReturnValue(mockUser)
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // 初期状態
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated')
      })
      
      // ログイン実行
      const loginButton = screen.getByText('Login')
      await act(async () => {
        loginButton.click()
      })
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
        expect(mockTokenManager.saveToken).toHaveBeenCalledWith('new-token')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated')
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser))
      })
    })

    test('ログイン失敗時にエラーが設定される', async () => {
      const mockAuthResponse = {
        data: null,
        error: { message: 'Invalid login credentials' }
      }
      
      mockTokenManager.isAuthenticated.mockReturnValue(false)
      const mockSignIn = require('@/lib/supabase').auth.signIn
      mockSignIn.mockResolvedValue(mockAuthResponse)
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // ログイン実行
      const loginButton = screen.getByText('Login')
      await act(async () => {
        loginButton.click()
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('ログインに失敗しました')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated')
      })
    })

    test('ログアウト時に状態がリセットされる', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' }
      
      // 初期状態で認証済み
      mockTokenManager.isAuthenticated.mockReturnValue(true)
      mockTokenManager.getUserFromToken.mockReturnValue(mockUser)
      mockTokenManager.getToken.mockReturnValue('valid-token')
      
      const mockSignOut = require('@/lib/supabase').auth.signOut
      mockSignOut.mockResolvedValue({ error: null })
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // 認証済み状態を確認
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated')
      })
      
      // ログアウト実行
      const logoutButton = screen.getByText('Logout')
      await act(async () => {
        logoutButton.click()
      })
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
        expect(mockTokenManager.removeToken).toHaveBeenCalled()
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated')
        expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      })
    })

    test('ネットワークエラー時に適切なエラーが設定される', async () => {
      mockTokenManager.isAuthenticated.mockReturnValue(false)
      const mockSignIn = require('@/lib/supabase').auth.signIn
      mockSignIn.mockRejectedValue(new Error('Network error'))
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // ログイン実行
      const loginButton = screen.getByText('Login')
      await act(async () => {
        loginButton.click()
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('ネットワークエラーが発生しました')
      })
    })

    test('エラー状態がログイン試行時にリセットされる', async () => {
      mockTokenManager.isAuthenticated.mockReturnValue(false)
      const mockSignIn = require('@/lib/supabase').auth.signIn
      
      // 最初はエラーを返す
      mockSignIn.mockRejectedValueOnce(new Error('Network error'))
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // 最初のログイン試行でエラー
      const loginButton = screen.getByText('Login')
      await act(async () => {
        loginButton.click()
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('ネットワークエラーが発生しました')
      })
      
      // 2回目のログイン試行でエラーがリセットされる
      const mockAuthResponse = {
        data: { user: { id: '1', email: 'test@example.com' }, session: { access_token: 'token' } },
        error: null
      }
      mockSignIn.mockResolvedValue(mockAuthResponse)
      mockTokenManager.getUserFromToken.mockReturnValue({ id: '1', email: 'test@example.com', name: 'Test User' })
      
      await act(async () => {
        loginButton.click()
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('no-error')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated')
      })
    })
  })

  describe('useAuth外でのuseAuthフック使用', () => {
    test('AuthProvider外でuseAuthを使用するとエラーが発生する', () => {
      // コンソールエラーを抑制
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth must be used within an AuthProvider')
      
      consoleSpy.mockRestore()
    })
  })
})