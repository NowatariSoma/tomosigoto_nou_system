import { render, screen } from '@testing-library/react'
import { Container } from '../container'

describe('Container Component', () => {
  describe('基本機能', () => {
    it('コンテナをレンダリングできる', () => {
      render(<Container>テストコンテンツ</Container>)
      const container = screen.getByText('テストコンテンツ')
      expect(container).toBeInTheDocument()
    })

    it('子要素を正しく表示する', () => {
      render(
        <Container>
          <div>子要素1</div>
          <div>子要素2</div>
        </Container>
      )
      expect(screen.getByText('子要素1')).toBeInTheDocument()
      expect(screen.getByText('子要素2')).toBeInTheDocument()
    })
  })

  describe('最大幅の設定', () => {
    it('デフォルトの最大幅が適用される', () => {
      render(<Container>デフォルト</Container>)
      const container = screen.getByText('デフォルト').parentElement
      expect(container).toHaveClass('max-w-7xl')  // デフォルト値
    })

    it('xsサイズの最大幅が適用される', () => {
      render(<Container maxWidth="xs">XS</Container>)
      const container = screen.getByText('XS').parentElement
      expect(container).toHaveClass('max-w-xs')
    })

    it('smサイズの最大幅が適用される', () => {
      render(<Container maxWidth="sm">SM</Container>)
      const container = screen.getByText('SM').parentElement
      expect(container).toHaveClass('max-w-sm')
    })

    it('mdサイズの最大幅が適用される', () => {
      render(<Container maxWidth="md">MD</Container>)
      const container = screen.getByText('MD').parentElement
      expect(container).toHaveClass('max-w-md')
    })

    it('lgサイズの最大幅が適用される', () => {
      render(<Container maxWidth="lg">LG</Container>)
      const container = screen.getByText('LG').parentElement
      expect(container).toHaveClass('max-w-lg')
    })

    it('xlサイズの最大幅が適用される', () => {
      render(<Container maxWidth="xl">XL</Container>)
      const container = screen.getByText('XL').parentElement
      expect(container).toHaveClass('max-w-xl')
    })

    it('fullサイズの最大幅が適用される', () => {
      render(<Container maxWidth="full">Full</Container>)
      const container = screen.getByText('Full').parentElement
      expect(container).toHaveClass('max-w-full')
    })
  })

  describe('パディング設定', () => {
    it('デフォルトでパディングが適用される', () => {
      render(<Container>パディング</Container>)
      const container = screen.getByText('パディング').parentElement
      expect(container).toHaveClass('px-4')  // デフォルトパディング
    })

    it('パディングを無効にできる', () => {
      render(<Container padding={false}>パディングなし</Container>)
      const container = screen.getByText('パディングなし').parentElement
      expect(container).not.toHaveClass('px-4')
    })

    it('カスタムパディングを設定できる', () => {
      render(<Container padding="px-8">カスタムパディング</Container>)
      const container = screen.getByText('カスタムパディング').parentElement
      expect(container).toHaveClass('px-8')
    })
  })

  describe('中央寄せ', () => {
    it('デフォルトで中央寄せが適用される', () => {
      render(<Container>中央寄せ</Container>)
      const container = screen.getByText('中央寄せ').parentElement
      expect(container).toHaveClass('mx-auto')
    })

    it('中央寄せを無効にできる', () => {
      render(<Container center={false}>左寄せ</Container>)
      const container = screen.getByText('左寄せ').parentElement
      expect(container).not.toHaveClass('mx-auto')
    })
  })

  describe('レスポンシブ対応', () => {
    it('レスポンシブパディングが適用される', () => {
      render(<Container>レスポンシブ</Container>)
      const container = screen.getByText('レスポンシブ').parentElement
      expect(container).toHaveClass('px-4', 'sm:px-6', 'lg:px-8')
    })

    it('レスポンシブ最大幅が適用される', () => {
      render(<Container maxWidth="lg">レスポンシブ幅</Container>)
      const container = screen.getByText('レスポンシブ幅').parentElement
      expect(container).toHaveClass('max-w-lg')
    })
  })

  describe('カスタマイズ', () => {
    it('カスタムクラス名がマージされる', () => {
      render(<Container className="custom-container">カスタム</Container>)
      const container = screen.getByText('カスタム').parentElement
      expect(container).toHaveClass('custom-container', 'mx-auto')
    })

    it('HTML属性が渡される', () => {
      render(<Container data-testid="test-container">属性テスト</Container>)
      const container = screen.getByTestId('test-container')
      expect(container).toBeInTheDocument()
    })
  })

  describe('セマンティック要素', () => {
    it('div要素としてレンダリングされる', () => {
      render(<Container>セマンティック</Container>)
      const container = screen.getByText('セマンティック').parentElement
      expect(container?.tagName).toBe('DIV')
    })

    it('適切なコンテナの役割を果たす', () => {
      render(
        <Container>
          <h1>見出し</h1>
          <p>段落</p>
        </Container>
      )
      
      const heading = screen.getByRole('heading', { level: 1 })
      const paragraph = screen.getByText('段落')
      
      expect(heading).toBeInTheDocument()
      expect(paragraph).toBeInTheDocument()
    })
  })
})