import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../button'

describe('Button Component', () => {
  describe('基本機能', () => {
    it('デフォルトのボタンをレンダリングできる', () => {
      render(<Button>ボタン</Button>)
      const button = screen.getByRole('button', { name: 'ボタン' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-primary')
    })

    it('クリックイベントが正しく動作する', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>クリック</Button>)
      
      const button = screen.getByRole('button', { name: 'クリック' })
      fireEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('disabled状態では クリックできない', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick} disabled>無効ボタン</Button>)
      
      const button = screen.getByRole('button', { name: '無効ボタン' })
      fireEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50')
    })
  })

  describe('バリアント', () => {
    it('primaryバリアントのスタイルが適用される', () => {
      render(<Button variant="default">Primary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('secondaryバリアントのスタイルが適用される', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')
    })

    it('outlineバリアントのスタイルが適用される', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border', 'border-input', 'bg-background')
    })

    it('destructiveバリアントのスタイルが適用される', () => {
      render(<Button variant="destructive">Destructive</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground')
    })

    it('ghostバリアントのスタイルが適用される', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground')
    })

    it('linkバリアントのスタイルが適用される', () => {
      render(<Button variant="link">Link</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-primary', 'underline-offset-4')
    })
  })

  describe('サイズ', () => {
    it('デフォルトサイズが適用される', () => {
      render(<Button>Default Size</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'px-4', 'py-2')
    })

    it('smallサイズが適用される', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9', 'px-3')
    })

    it('largeサイズが適用される', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-11', 'px-8')
    })

    it('iconサイズが適用される', () => {
      render(<Button size="icon">Icon</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'w-10')
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なrole属性を持つ', () => {
      render(<Button>アクセシブル</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('カスタムtype属性が設定される', () => {
      render(<Button type="submit">送信</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('フォーカス時に適切なアウトラインが表示される', () => {
      render(<Button>フォーカス</Button>)
      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('aria-labelが設定できる', () => {
      render(<Button aria-label="詳細情報">ℹ</Button>)
      const button = screen.getByRole('button', { name: '詳細情報' })
      expect(button).toBeInTheDocument()
    })
  })

  describe('asChild プロップ', () => {
    it('asChild=trueの場合、子要素をボタンとしてレンダリングする', () => {
      render(
        <Button asChild>
          <a href="/test">リンクボタン</a>
        </Button>
      )
      const link = screen.getByRole('link', { name: 'リンクボタン' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveClass('bg-primary')  // ボタンのスタイルが適用される
      expect(link).toHaveAttribute('href', '/test')
    })
  })

  describe('カスタムクラス名', () => {
    it('カスタムクラス名がマージされる', () => {
      render(<Button className="custom-class">カスタム</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class', 'bg-primary')
    })
  })
})