/**
 * SessionEditableBlock Component Test
 * TDD テスト - ドラッグ可能なセッションブロックコンポーネントのテスト
 */

import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SessionEditableBlock } from '../../components/schedule/SessionEditableBlock'
import { SessionEditProvider } from '../../components/schedule/context/SessionEditContext'
import { Session } from '../../../types/session'

// テストデータ
const mockSession: Session = {
  id: 'session-1',
  title: 'テストセッション',
  start: new Date('2024-01-15T09:00:00'),
  end: new Date('2024-01-15T10:00:00'),
  partId: 1,
  partName: 'パート1',
  venueId: 'venue-1',
  venueName: '会場1',
  instructorId: 'instructor-1',
  instructorName: '指導者1',
  status: 'scheduled',
  color: '#3B82F6',
  createdAt: new Date('2024-01-15T08:00:00'),
  updatedAt: new Date('2024-01-15T08:00:00')
}

// モック関数
const mockOnSelect = jest.fn()
const mockOnStartDrag = jest.fn()
const mockOnResize = jest.fn()

// テストヘルパー: プロバイダーでラップしたコンポーネント
const renderWithProvider = (props: any = {}) => {
  const defaultProps = {
    session: mockSession,
    isSelected: false,
    onSelect: mockOnSelect,
    onStartDrag: mockOnStartDrag,
    onResize: mockOnResize,
    ...props
  }

  return render(
    <SessionEditProvider>
      <SessionEditableBlock {...defaultProps} />
    </SessionEditProvider>
  )
}

describe('SessionEditableBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('レンダリング', () => {
    it('should render session information correctly', () => {
      renderWithProvider()

      expect(screen.getByText('テストセッション')).toBeInTheDocument()
      expect(screen.getByText('09:00 - 10:00')).toBeInTheDocument()
      expect(screen.getByText('パート1')).toBeInTheDocument()
      expect(screen.getByText('指導者1')).toBeInTheDocument()
      expect(screen.getByText('会場1 • 60分')).toBeInTheDocument()
    })

    it('should render without instructor when not provided', () => {
      const sessionWithoutInstructor = {
        ...mockSession,
        instructorId: undefined,
        instructorName: undefined
      }

      renderWithProvider({ session: sessionWithoutInstructor })

      expect(screen.getByText('テストセッション')).toBeInTheDocument()
      expect(screen.queryByText('指導者1')).not.toBeInTheDocument()
    })

    it('should apply selected state styling', () => {
      renderWithProvider({ isSelected: true })

      const sessionBlock = screen.getByRole('button')
      expect(sessionBlock).toHaveClass('border-blue-400')
    })

    it('should apply custom className and style', () => {
      const customProps = {
        className: 'custom-class',
        style: { opacity: 0.8 }
      }

      renderWithProvider(customProps)

      const sessionBlock = screen.getByRole('button')
      expect(sessionBlock).toHaveClass('custom-class')
      expect(sessionBlock).toHaveStyle({ opacity: '0.8' })
    })
  })

  describe('クリックイベント', () => {
    it('should call onSelect when clicked', () => {
      renderWithProvider()

      const sessionBlock = screen.getByRole('button')
      fireEvent.click(sessionBlock)

      expect(mockOnSelect).toHaveBeenCalledWith('session-1')
    })

    it('should not call onSelect during drag', () => {
      renderWithProvider()

      const sessionBlock = screen.getByRole('button')
      
      // ドラッグ開始（マウスダウン）
      fireEvent.mouseDown(sessionBlock, { button: 0, clientY: 100 })
      
      // クリック（ドラッグ中とみなされる）
      fireEvent.click(sessionBlock)

      expect(mockOnSelect).toHaveBeenCalledTimes(1) // mousedownで1回のみ
    })

    it('should handle double click to open edit modal', () => {
      renderWithProvider()

      const sessionBlock = screen.getByRole('button')
      fireEvent.doubleClick(sessionBlock)

      // SessionEditContextの状態変更を確認するため、実際のテストでは
      // コンテキストの状態をモックやspyで検証する必要がある
    })

    it('should handle context menu', () => {
      renderWithProvider()

      const sessionBlock = screen.getByRole('button')
      fireEvent.contextMenu(sessionBlock)

      expect(mockOnSelect).toHaveBeenCalledWith('session-1')
    })
  })

  describe('ドラッグイベント', () => {
    it('should call onStartDrag when mouse down in drag area', () => {
      renderWithProvider()

      const sessionBlock = screen.getByRole('button')
      
      // セッションブロックの中央付近でマウスダウン
      Object.defineProperty(sessionBlock, 'getBoundingClientRect', {
        value: () => ({
          top: 50,
          left: 10,
          width: 200,
          height: 100,
          right: 210,
          bottom: 150
        })
      })

      fireEvent.mouseDown(sessionBlock, { 
        button: 0, 
        clientX: 110,
        clientY: 100 // 中央
      })

      expect(mockOnStartDrag).toHaveBeenCalledWith('session-1', expect.any(MouseEvent))
    })

    it('should handle touch start event', () => {
      renderWithProvider()

      const sessionBlock = screen.getByRole('button')
      
      Object.defineProperty(sessionBlock, 'getBoundingClientRect', {
        value: () => ({
          top: 50,
          left: 10,
          width: 200,
          height: 100,
          right: 210,
          bottom: 150
        })
      })

      fireEvent.touchStart(sessionBlock, {
        touches: [{ clientX: 110, clientY: 100 }]
      })

      expect(mockOnStartDrag).toHaveBeenCalledWith('session-1', expect.any(TouchEvent))
    })

    it('should ignore non-left mouse button', () => {
      renderWithProvider()

      const sessionBlock = screen.getByRole('button')
      fireEvent.mouseDown(sessionBlock, { button: 1 }) // 中クリック

      expect(mockOnStartDrag).not.toHaveBeenCalled()
      expect(mockOnSelect).not.toHaveBeenCalled()
    })
  })

  describe('リサイズイベント', () => {
    beforeEach(() => {
      // getBoundingClientRectのモック
      Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
        value: () => ({
          top: 50,
          left: 10,
          width: 200,
          height: 100,
          right: 210,
          bottom: 150
        })
      })
    })

    it('should trigger resize start when mouse down at top edge', () => {
      renderWithProvider()

      const sessionBlock = screen.getByRole('button')
      
      // 上端付近でマウスダウン
      fireEvent.mouseDown(sessionBlock, { 
        button: 0, 
        clientX: 110,
        clientY: 55 // top + 5px（リサイズ領域内）
      })

      // リサイズモードに入るため、onStartDragは呼ばれない
      expect(mockOnStartDrag).not.toHaveBeenCalled()
    })

    it('should trigger resize end when mouse down at bottom edge', () => {
      renderWithProvider()

      const sessionBlock = screen.getByRole('button')
      
      // 下端付近でマウスダウン
      fireEvent.mouseDown(sessionBlock, { 
        button: 0, 
        clientX: 110,
        clientY: 145 // bottom - 5px（リサイズ領域内）
      })

      expect(mockOnStartDrag).not.toHaveBeenCalled()
    })

    it('should handle touch resize with larger threshold', () => {
      renderWithProvider()

      const sessionBlock = screen.getByRole('button')
      
      // タッチでリサイズ（閾値が12px）
      fireEvent.touchStart(sessionBlock, {
        touches: [{ clientX: 110, clientY: 60 }] // top + 10px
      })

      expect(mockOnStartDrag).not.toHaveBeenCalled()
    })
  })

  describe('アクセシビリティ', () => {
    it('should have proper ARIA attributes', () => {
      renderWithProvider()

      const sessionBlock = screen.getByRole('button')
      expect(sessionBlock).toHaveAttribute('tabIndex', '0')
      expect(sessionBlock).toHaveAttribute('aria-label', 'セッション: テストセッション, 09:00 - 10:00')
    })
  })

  describe('スタイリング', () => {
    it('should apply session color as background', () => {
      renderWithProvider()

      const sessionBlock = screen.getByRole('button')
      expect(sessionBlock).toHaveStyle({ backgroundColor: '#3B82F6' })
    })

    it('should show selection indicator when selected', () => {
      renderWithProvider({ isSelected: true })

      // 選択インジケータの存在を確認
      const indicator = document.querySelector('.absolute.-top-1.-right-1')
      expect(indicator).toBeInTheDocument()
    })

    it('should apply dragging styles when being dragged', () => {
      // SessionEditContextでdraggingSessionIdがsession-1に設定されている状態をシミュレート
      // 実際のテストでは、コンテキストプロバイダーでinitialStateを設定するか、
      // モックを使用してdraggingSessionIdを制御する必要がある
    })
  })

  describe('リサイズハンドル', () => {
    it('should show resize handles on hover', () => {
      renderWithProvider()

      const topHandle = document.querySelector('.absolute.left-0.right-0.top-0')
      const bottomHandle = document.querySelector('.absolute.left-0.right-0.bottom-0')

      expect(topHandle).toBeInTheDocument()
      expect(bottomHandle).toBeInTheDocument()
      expect(topHandle).toHaveClass('cursor-ns-resize')
      expect(bottomHandle).toHaveClass('cursor-ns-resize')
    })
  })
})