import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/login-form'

// モックの設定
const mockOnLogin = jest.fn()
const mockSupabaseAuth = {
  signIn: jest.fn(),
}

jest.mock('@/lib/supabase', () => ({
  auth: mockSupabaseAuth,
}))

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('レンダリング', () => {
    test('ログインフォームが正しく表示される', () => {
      render(<LoginForm onLogin={mockOnLogin} />)
      
      // フォーム要素の存在確認
      expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument()
    })

    test('初期状態ではエラーメッセージが表示されない', () => {
      render(<LoginForm onLogin={mockOnLogin} />)
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('入力検証', () => {
    test('メールアドレス形式が正しくない場合エラーが表示される', async () => {
      const user = userEvent.setup()
      render(<LoginForm onLogin={mockOnLogin} />)
      
      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const submitButton = screen.getByRole('button', { name: /ログイン/i })
      
      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)
      
      expect(await screen.findByText(/正しいメールアドレスを入力してください/i)).toBeInTheDocument()
    })

    test('パスワードが空の場合エラーが表示される', async () => {
      const user = userEvent.setup()
      render(<LoginForm onLogin={mockOnLogin} />)
      
      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const submitButton = screen.getByRole('button', { name: /ログイン/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)
      
      expect(await screen.findByText(/パスワードを入力してください/i)).toBeInTheDocument()
    })

    test('パスワードが6文字未満の場合エラーが表示される', async () => {
      const user = userEvent.setup()
      render(<LoginForm onLogin={mockOnLogin} />)
      
      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const passwordInput = screen.getByLabelText(/パスワード/i)
      const submitButton = screen.getByRole('button', { name: /ログイン/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, '12345')
      await user.click(submitButton)
      
      expect(await screen.findByText(/パスワードは6文字以上で入力してください/i)).toBeInTheDocument()
    })
  })

  describe('フォーム送信', () => {
    test('正しい入力でログインが成功する', async () => {
      const user = userEvent.setup()
      const mockAuthResponse = {
        data: { user: { id: '1', email: 'test@example.com' }, session: { access_token: 'token' } },
        error: null
      }
      mockSupabaseAuth.signIn.mockResolvedValue(mockAuthResponse)
      
      render(<LoginForm onLogin={mockOnLogin} />)
      
      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const passwordInput = screen.getByLabelText(/パスワード/i)
      const submitButton = screen.getByRole('button', { name: /ログイン/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockSupabaseAuth.signIn).toHaveBeenCalledWith('test@example.com', 'password123')
        expect(mockOnLogin).toHaveBeenCalled()
      })
    })

    test('認証失敗時にエラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      const mockAuthResponse = {
        data: null,
        error: { message: 'Invalid login credentials' }
      }
      mockSupabaseAuth.signIn.mockResolvedValue(mockAuthResponse)
      
      render(<LoginForm onLogin={mockOnLogin} />)
      
      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const passwordInput = screen.getByLabelText(/パスワード/i)
      const submitButton = screen.getByRole('button', { name: /ログイン/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)
      
      expect(await screen.findByText(/ログインに失敗しました/i)).toBeInTheDocument()
    })

    test('ログイン処理中はボタンが無効化される', async () => {
      const user = userEvent.setup()
      mockSupabaseAuth.signIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<LoginForm onLogin={mockOnLogin} />)
      
      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const passwordInput = screen.getByLabelText(/パスワード/i)
      const submitButton = screen.getByRole('button', { name: /ログイン/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      expect(submitButton).toBeDisabled()
    })
  })

  describe('パスワード表示切り替え', () => {
    test('パスワード表示ボタンでパスワードの表示/非表示が切り替わる', async () => {
      const user = userEvent.setup()
      render(<LoginForm onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText(/パスワード/i) as HTMLInputElement
      const toggleButton = screen.getByLabelText(/パスワードを表示/i)
      
      // 初期状態はpassword type
      expect(passwordInput.type).toBe('password')
      
      // クリックでtext typeに変更
      await user.click(toggleButton)
      expect(passwordInput.type).toBe('text')
      
      // 再度クリックでpassword typeに戻る
      await user.click(toggleButton)
      expect(passwordInput.type).toBe('password')
    })
  })
})