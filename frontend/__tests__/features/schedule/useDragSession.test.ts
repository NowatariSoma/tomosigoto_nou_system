/**
 * useDragSession Hook Test
 * TDD テスト - ドラッグセッションカスタムフックのテスト
 */

import { renderHook, act } from '@testing-library/react'
import { useDragSession } from '../../hooks/schedule/useDragSession'

// モック関数を作成
const mockOnSessionMove = jest.fn()

const defaultConfig = {
  onSessionMove: mockOnSessionMove,
  gridConfig: {
    cellHeight: 60,
    minutesPerCell: 30
  },
  snapMinutes: 30
}

// マウスイベントのモック
const createMouseEvent = (type: string, clientX: number, clientY: number): MouseEvent => {
  return new MouseEvent(type, {
    clientX,
    clientY,
    bubbles: true
  })
}

// タッチイベントのモック
const createTouchEvent = (type: string, clientX: number, clientY: number): TouchEvent => {
  return new TouchEvent(type, {
    touches: [{ clientX, clientY } as Touch],
    bubbles: true
  })
}

describe('useDragSession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // DOM イベントリスナーのモック
    jest.spyOn(document, 'addEventListener')
    jest.spyOn(document, 'removeEventListener')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('初期状態', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useDragSession(defaultConfig))

      expect(result.current.draggingSessionId).toBeNull()
      expect(result.current.dragPreview).toBeNull()
      expect(result.current.isDragging).toBe(false)
    })
  })

  describe('startDrag', () => {
    it('should start dragging session', () => {
      const { result } = renderHook(() => useDragSession(defaultConfig))

      const sessionStart = new Date('2024-01-15T09:00:00')
      const sessionEnd = new Date('2024-01-15T10:00:00')
      const mouseEvent = createMouseEvent('mousedown', 100, 200)

      act(() => {
        result.current.startDrag(
          'session-1',
          { x: 100, y: 200 },
          sessionStart,
          sessionEnd,
          mouseEvent
        )
      })

      expect(result.current.draggingSessionId).toBe('session-1')
      expect(result.current.isDragging).toBe(true)
      expect(result.current.dragPreview).toEqual({
        sessionId: 'session-1',
        start: sessionStart,
        end: sessionEnd
      })

      // イベントリスナーが追加されることを確認
      expect(document.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(document.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function))
    })

    it('should work with touch events', () => {
      const { result } = renderHook(() => useDragSession(defaultConfig))

      const sessionStart = new Date('2024-01-15T09:00:00')
      const sessionEnd = new Date('2024-01-15T10:00:00')
      const touchEvent = createTouchEvent('touchstart', 100, 200)

      act(() => {
        result.current.startDrag(
          'session-1',
          { x: 100, y: 200 },
          sessionStart,
          sessionEnd,
          touchEvent
        )
      })

      expect(result.current.draggingSessionId).toBe('session-1')
      expect(document.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function))
      expect(document.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function))
    })
  })

  describe('handleDrag', () => {
    it('should update drag preview during drag', () => {
      const { result } = renderHook(() => useDragSession(defaultConfig))

      const sessionStart = new Date('2024-01-15T09:00:00')
      const sessionEnd = new Date('2024-01-15T10:00:00')
      const mouseDownEvent = createMouseEvent('mousedown', 100, 200)

      // ドラッグ開始
      act(() => {
        result.current.startDrag(
          'session-1',
          { x: 100, y: 200 },
          sessionStart,
          sessionEnd,
          mouseDownEvent
        )
      })

      // ドラッグ中
      const mouseMoveEvent = createMouseEvent('mousemove', 100, 260) // Y軸に60px移動

      act(() => {
        result.current.handleDrag(mouseMoveEvent)
      })

      // プレビューが更新されることを確認
      expect(result.current.dragPreview).toBeDefined()
      expect(result.current.dragPreview?.sessionId).toBe('session-1')
      // 30分後にスナップされるため、時間が変更されていることを確認
      expect(result.current.dragPreview?.start.getTime()).toBeGreaterThan(sessionStart.getTime())
    })

    it('should handle drag when not dragging', () => {
      const { result } = renderHook(() => useDragSession(defaultConfig))

      const mouseMoveEvent = createMouseEvent('mousemove', 100, 260)

      // ドラッグしていない状態でhandleDragを呼んでもエラーが発生しないことを確認
      act(() => {
        result.current.handleDrag(mouseMoveEvent)
      })

      expect(result.current.dragPreview).toBeNull()
    })
  })

  describe('endDrag', () => {
    it('should end dragging and call onSessionMove', async () => {
      mockOnSessionMove.mockResolvedValue(true)
      const { result } = renderHook(() => useDragSession(defaultConfig))

      const sessionStart = new Date('2024-01-15T09:00:00')
      const sessionEnd = new Date('2024-01-15T10:00:00')
      const mouseDownEvent = createMouseEvent('mousedown', 100, 200)

      // ドラッグ開始
      act(() => {
        result.current.startDrag(
          'session-1',
          { x: 100, y: 200 },
          sessionStart,
          sessionEnd,
          mouseDownEvent
        )
      })

      // 十分な距離をドラッグ
      const mouseMoveEvent = createMouseEvent('mousemove', 100, 280) // Y軸に80px移動
      act(() => {
        result.current.handleDrag(mouseMoveEvent)
      })

      // ドラッグ終了
      const mouseUpEvent = createMouseEvent('mouseup', 100, 280)
      await act(async () => {
        await result.current.endDrag(mouseUpEvent)
      })

      expect(mockOnSessionMove).toHaveBeenCalledWith(
        'session-1',
        expect.any(Date),
        expect.any(Date)
      )
      expect(result.current.draggingSessionId).toBeNull()
      expect(result.current.dragPreview).toBeNull()
      expect(result.current.isDragging).toBe(false)
    })

    it('should not call onSessionMove for small drag distances', async () => {
      const { result } = renderHook(() => useDragSession(defaultConfig))

      const sessionStart = new Date('2024-01-15T09:00:00')
      const sessionEnd = new Date('2024-01-15T10:00:00')
      const mouseDownEvent = createMouseEvent('mousedown', 100, 200)

      // ドラッグ開始
      act(() => {
        result.current.startDrag(
          'session-1',
          { x: 100, y: 200 },
          sessionStart,
          sessionEnd,
          mouseDownEvent
        )
      })

      // 小さな距離をドラッグ (5px)
      const mouseMoveEvent = createMouseEvent('mousemove', 100, 205)
      act(() => {
        result.current.handleDrag(mouseMoveEvent)
      })

      // ドラッグ終了
      const mouseUpEvent = createMouseEvent('mouseup', 100, 205)
      await act(async () => {
        await result.current.endDrag(mouseUpEvent)
      })

      expect(mockOnSessionMove).not.toHaveBeenCalled()
      expect(result.current.draggingSessionId).toBeNull()
    })

    it('should handle onSessionMove failure', async () => {
      mockOnSessionMove.mockResolvedValue(false)
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const { result } = renderHook(() => useDragSession(defaultConfig))

      const sessionStart = new Date('2024-01-15T09:00:00')
      const sessionEnd = new Date('2024-01-15T10:00:00')
      const mouseDownEvent = createMouseEvent('mousedown', 100, 200)

      act(() => {
        result.current.startDrag(
          'session-1',
          { x: 100, y: 200 },
          sessionStart,
          sessionEnd,
          mouseDownEvent
        )
      })

      const mouseMoveEvent = createMouseEvent('mousemove', 100, 280)
      act(() => {
        result.current.handleDrag(mouseMoveEvent)
      })

      const mouseUpEvent = createMouseEvent('mouseup', 100, 280)
      await act(async () => {
        await result.current.endDrag(mouseUpEvent)
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Session move failed, reverting to original position'
      )
      expect(result.current.draggingSessionId).toBeNull()
      
      consoleSpy.mockRestore()
    })
  })

  describe('cancelDrag', () => {
    it('should cancel ongoing drag', () => {
      const { result } = renderHook(() => useDragSession(defaultConfig))

      const sessionStart = new Date('2024-01-15T09:00:00')
      const sessionEnd = new Date('2024-01-15T10:00:00')
      const mouseDownEvent = createMouseEvent('mousedown', 100, 200)

      // ドラッグ開始
      act(() => {
        result.current.startDrag(
          'session-1',
          { x: 100, y: 200 },
          sessionStart,
          sessionEnd,
          mouseDownEvent
        )
      })

      expect(result.current.isDragging).toBe(true)

      // ドラッグキャンセル
      act(() => {
        result.current.cancelDrag()
      })

      expect(result.current.draggingSessionId).toBeNull()
      expect(result.current.dragPreview).toBeNull()
      expect(result.current.isDragging).toBe(false)
    })

    it('should not error when canceling without active drag', () => {
      const { result } = renderHook(() => useDragSession(defaultConfig))

      // ドラッグしていない状態でキャンセルしてもエラーが発生しないことを確認
      act(() => {
        result.current.cancelDrag()
      })

      expect(result.current.draggingSessionId).toBeNull()
    })
  })
})