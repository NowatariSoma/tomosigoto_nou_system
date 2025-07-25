import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../modal'

describe('Modal Component', () => {
  describe('基本機能', () => {
    it('モーダルが表示される', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          モーダルコンテンツ
        </Modal>
      )
      expect(screen.getByText('モーダルコンテンツ')).toBeInTheDocument()
    })

    it('isOpen=falseの場合、モーダルが非表示になる', () => {
      render(
        <Modal isOpen={false} onClose={jest.fn()}>
          非表示コンテンツ
        </Modal>
      )
      expect(screen.queryByText('非表示コンテンツ')).not.toBeInTheDocument()
    })

    it('onCloseが呼ばれる', () => {
      const handleClose = jest.fn()
      render(
        <Modal isOpen={true} onClose={handleClose}>
          <ModalHeader>
            <button onClick={handleClose}>閉じる</button>
          </ModalHeader>
        </Modal>
      )
      
      const closeButton = screen.getByText('閉じる')
      fireEvent.click(closeButton)
      
      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('オーバーレイクリック', () => {
    it('デフォルトでオーバーレイクリックで閉じる', () => {
      const handleClose = jest.fn()
      render(
        <Modal isOpen={true} onClose={handleClose}>
          モーダル内容
        </Modal>
      )
      
      // オーバーレイをクリック（モーダル外部）
      const overlay = screen.getByRole('dialog').parentElement
      fireEvent.click(overlay!)
      
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('closeOnOverlayClick=falseの場合、オーバーレイクリックで閉じない', () => {
      const handleClose = jest.fn()
      render(
        <Modal isOpen={true} onClose={handleClose} closeOnOverlayClick={false}>
          モーダル内容
        </Modal>
      )
      
      const overlay = screen.getByRole('dialog').parentElement
      fireEvent.click(overlay!)
      
      expect(handleClose).not.toHaveBeenCalled()
    })
  })

  describe('Escapeキー', () => {
    it('デフォルトでEscapeキーで閉じる', async () => {
      const user = userEvent.setup()
      const handleClose = jest.fn()
      render(
        <Modal isOpen={true} onClose={handleClose}>
          モーダル内容
        </Modal>
      )
      
      await user.keyboard('{Escape}')
      
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('closeOnEscape=falseの場合、Escapeキーで閉じない', async () => {
      const user = userEvent.setup()
      const handleClose = jest.fn()
      render(
        <Modal isOpen={true} onClose={handleClose} closeOnEscape={false}>
          モーダル内容
        </Modal>
      )
      
      await user.keyboard('{Escape}')
      
      expect(handleClose).not.toHaveBeenCalled()
    })
  })

  describe('サイズバリアント', () => {
    it('デフォルトサイズが適用される', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          デフォルト
        </Modal>
      )
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveClass('max-w-md')  // デフォルトサイズ
    })

    it('smサイズが適用される', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} size="sm">
          Small
        </Modal>
      )
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveClass('max-w-sm')
    })

    it('lgサイズが適用される', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} size="lg">
          Large
        </Modal>
      )
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveClass('max-w-lg')
    })

    it('xlサイズが適用される', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} size="xl">
          Extra Large
        </Modal>
      )
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveClass('max-w-xl')
    })
  })

  describe('タイトル表示', () => {
    it('タイトルが表示される', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} title="テストタイトル">
          コンテンツ
        </Modal>
      )
      expect(screen.getByText('テストタイトル')).toBeInTheDocument()
    })

    it('タイトルなしでも正常に動作する', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          タイトルなし
        </Modal>
      )
      expect(screen.getByText('タイトルなし')).toBeInTheDocument()
    })
  })

  describe('フォーカス管理', () => {
    it('モーダル表示時にフォーカスがトラップされる', async () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <button>ボタン1</button>
          <button>ボタン2</button>
        </Modal>
      )
      
      const button1 = screen.getByText('ボタン1')
      const button2 = screen.getByText('ボタン2')
      
      // 最初のフォーカス可能要素にフォーカスが当たる
      await waitFor(() => {
        expect(button1).toHaveFocus()
      })
      
      // Tabキーでフォーカス移動
      fireEvent.keyDown(button1, { key: 'Tab' })
      expect(button2).toHaveFocus()
    })

    it('モーダル外部の要素にはフォーカスが移動しない', () => {
      render(
        <>
          <button>外部ボタン</button>
          <Modal isOpen={true} onClose={jest.fn()}>
            <button>内部ボタン</button>
          </Modal>
        </>
      )
      
      const externalButton = screen.getByText('外部ボタン')
      const internalButton = screen.getByText('内部ボタン')
      
      // 外部ボタンにはフォーカスが移動しない
      expect(externalButton).not.toHaveFocus()
      expect(internalButton).toHaveFocus()
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なrole属性を持つ', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          アクセシブル
        </Modal>
      )
      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()
    })

    it('aria-modal属性が設定される', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          aria-modal
        </Modal>
      )
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveAttribute('aria-modal', 'true')
    })

    it('タイトルがaria-labelledbyで参照される', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} title="タイトル">
          コンテンツ
        </Modal>
      )
      const modal = screen.getByRole('dialog')
      const title = screen.getByText('タイトル')
      
      expect(modal).toHaveAttribute('aria-labelledby', expect.stringContaining(title.id))
    })
  })

  describe('ポータル機能', () => {
    it('document.bodyに直接レンダリングされる', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          ポータル
        </Modal>
      )
      
      // モーダルがbodyの直下にレンダリングされることを確認
      const modal = screen.getByRole('dialog')
      expect(modal.parentElement?.parentElement).toBe(document.body)
    })
  })
})

describe('ModalHeader Component', () => {
  it('ヘッダーが正しくレンダリングされる', () => {
    render(<ModalHeader>ヘッダー内容</ModalHeader>)
    expect(screen.getByText('ヘッダー内容')).toBeInTheDocument()
  })

  it('適切なスタイルが適用される', () => {
    render(<ModalHeader>スタイル</ModalHeader>)
    const header = screen.getByText('スタイル').parentElement
    expect(header).toHaveClass('flex', 'items-center', 'justify-between')
  })
})

describe('ModalBody Component', () => {
  it('ボディが正しくレンダリングされる', () => {
    render(<ModalBody>ボディ内容</ModalBody>)
    expect(screen.getByText('ボディ内容')).toBeInTheDocument()
  })

  it('適切なスタイルが適用される', () => {
    render(<ModalBody>スタイル</ModalBody>)
    const body = screen.getByText('スタイル').parentElement
    expect(body).toHaveClass('flex-1', 'py-4')
  })
})

describe('ModalFooter Component', () => {
  it('フッターが正しくレンダリングされる', () => {
    render(<ModalFooter>フッター内容</ModalFooter>)
    expect(screen.getByText('フッター内容')).toBeInTheDocument()
  })

  it('適切なスタイルが適用される', () => {
    render(<ModalFooter>スタイル</ModalFooter>)
    const footer = screen.getByText('スタイル').parentElement
    expect(footer).toHaveClass('flex', 'justify-end', 'gap-2')
  })
})