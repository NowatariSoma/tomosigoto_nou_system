import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../input'

describe('Input Component', () => {
  describe('基本機能', () => {
    it('入力フィールドをレンダリングできる', () => {
      render(<Input placeholder="テスト入力" />)
      const input = screen.getByPlaceholderText('テスト入力')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'text')
    })

    it('値の変更が正しく動作する', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'テスト入力')
      
      expect(handleChange).toHaveBeenCalled()
      expect(input).toHaveValue('テスト入力')
    })

    it('制御コンポーネントとして動作する', () => {
      render(<Input value="制御された値" readOnly />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('制御された値')
    })

    it('disabled状態では入力できない', () => {
      render(<Input disabled placeholder="無効な入力" />)
      const input = screen.getByPlaceholderText('無効な入力')
      expect(input).toBeDisabled()
    })
  })

  describe('入力タイプ', () => {
    it('passwordタイプが設定される', () => {
      render(<Input type="password" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'password')
    })

    it('emailタイプが設定される', () => {
      render(<Input type="email" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('numberタイプが設定される', () => {
      render(<Input type="number" />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('type', 'number')
    })

    it('telタイプが設定される', () => {
      render(<Input type="tel" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'tel')
    })
  })

  describe('スタイリング', () => {
    it('デフォルトのスタイルが適用される', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass(
        'flex',
        'h-10',
        'w-full',
        'rounded-md',
        'border',
        'border-input',
        'bg-background',
        'px-3',
        'py-2',
        'text-sm'
      )
    })

    it('フォーカス時のスタイルが適用される', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      input.focus()
      expect(input).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('disabled時のスタイルが適用される', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なrole属性を持つ', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })

    it('aria-label属性が設定できる', () => {
      render(<Input aria-label="ユーザー名入力" />)
      const input = screen.getByRole('textbox', { name: 'ユーザー名入力' })
      expect(input).toBeInTheDocument()
    })

    it('aria-describedby属性が設定できる', () => {
      render(
        <>
          <Input aria-describedby="help-text" />
          <div id="help-text">ヘルプテキスト</div>
        </>
      )
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('required属性が設定できる', () => {
      render(<Input required />)
      const input = screen.getByRole('textbox')
      expect(input).toBeRequired()
    })
  })

  describe('カスタマイズ', () => {
    it('カスタムクラス名がマージされる', () => {
      render(<Input className="custom-input" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('custom-input', 'border-input')
    })

    it('name属性が設定できる', () => {
      render(<Input name="username" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('name', 'username')
    })

    it('id属性が設定できる', () => {
      render(<Input id="user-input" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('id', 'user-input')
    })
  })

  describe('フォーカス管理', () => {
    it('フォーカスが正しく設定される', () => {
      render(<Input autoFocus />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveFocus()
    })

    it('Tabキーでフォーカス移動できる', () => {
      render(
        <>
          <Input placeholder="1つ目" />
          <Input placeholder="2つ目" />
        </>
      )
      const firstInput = screen.getByPlaceholderText('1つ目')
      const secondInput = screen.getByPlaceholderText('2つ目')
      
      firstInput.focus()
      expect(firstInput).toHaveFocus()
      
      fireEvent.keyDown(firstInput, { key: 'Tab' })
      expect(secondInput).toHaveFocus()
    })
  })
})