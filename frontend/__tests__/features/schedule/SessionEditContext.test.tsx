/**
 * SessionEditContext Test
 * TDD テスト - セッション編集コンテキストのテスト
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { SessionEditProvider, useSessionEdit } from '../../../src/features/schedule/context/SessionEditContext'
import { Position } from '../../../types/session'

// テストヘルパー: プロバイダーでラップしたカスタムフック
const createWrapper = () => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <SessionEditProvider>{children}</SessionEditProvider>
  )
  return Wrapper
}

describe('SessionEditContext', () => {
  describe('初期状態', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useSessionEdit(), {
        wrapper: createWrapper(),
      })

      expect(result.current.selectedSessionId).toBeNull()
      expect(result.current.draggingSessionId).toBeNull()
      expect(result.current.editingSessionId).toBeNull()
      expect(result.current.isQuickCreateMenuOpen).toBe(false)
      expect(result.current.quickCreatePosition).toBeNull()
    })
  })

  describe('selectSession', () => {
    it('should select a session', () => {
      const { result } = renderHook(() => useSessionEdit(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.selectSession('session-1')
      })

      expect(result.current.selectedSessionId).toBe('session-1')
    })

    it('should close quick create menu when selecting session', () => {
      const { result } = renderHook(() => useSessionEdit(), {
        wrapper: createWrapper(),
      })

      const position: Position = {
        x: 100,
        y: 200,
        date: new Date('2024-01-15'),
        time: new Date('2024-01-15T09:00:00')
      }

      act(() => {
        result.current.openQuickCreateMenu(position)
      })

      expect(result.current.isQuickCreateMenuOpen).toBe(true)

      act(() => {
        result.current.selectSession('session-1')
      })

      expect(result.current.selectedSessionId).toBe('session-1')
      expect(result.current.isQuickCreateMenuOpen).toBe(false)
      expect(result.current.quickCreatePosition).toBeNull()
    })
  })

  describe('startDragSession', () => {
    it('should start dragging a session', () => {
      const { result } = renderHook(() => useSessionEdit(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.startDragSession('session-1')
      })

      expect(result.current.draggingSessionId).toBe('session-1')
      expect(result.current.selectedSessionId).toBe('session-1')
    })

    it('should close quick create menu when starting drag', () => {
      const { result } = renderHook(() => useSessionEdit(), {
        wrapper: createWrapper(),
      })

      const position: Position = {
        x: 100,
        y: 200,
        date: new Date('2024-01-15'),
        time: new Date('2024-01-15T09:00:00')
      }

      act(() => {
        result.current.openQuickCreateMenu(position)
      })

      expect(result.current.isQuickCreateMenuOpen).toBe(true)

      act(() => {
        result.current.startDragSession('session-1')
      })

      expect(result.current.draggingSessionId).toBe('session-1')
      expect(result.current.isQuickCreateMenuOpen).toBe(false)
    })
  })

  describe('endDragSession', () => {
    it('should end dragging session', () => {
      const { result } = renderHook(() => useSessionEdit(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.startDragSession('session-1')
      })

      expect(result.current.draggingSessionId).toBe('session-1')

      act(() => {
        result.current.endDragSession()
      })

      expect(result.current.draggingSessionId).toBeNull()
      expect(result.current.selectedSessionId).toBe('session-1') // should remain selected
    })
  })

  describe('openSessionEdit', () => {
    it('should open session edit modal', () => {
      const { result } = renderHook(() => useSessionEdit(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.openSessionEdit('session-1')
      })

      expect(result.current.editingSessionId).toBe('session-1')
    })

    it('should close quick create menu when opening edit', () => {
      const { result } = renderHook(() => useSessionEdit(), {
        wrapper: createWrapper(),
      })

      const position: Position = {
        x: 100,
        y: 200,
        date: new Date('2024-01-15'),
        time: new Date('2024-01-15T09:00:00')
      }

      act(() => {
        result.current.openQuickCreateMenu(position)
      })

      expect(result.current.isQuickCreateMenuOpen).toBe(true)

      act(() => {
        result.current.openSessionEdit('session-1')
      })

      expect(result.current.editingSessionId).toBe('session-1')
      expect(result.current.isQuickCreateMenuOpen).toBe(false)
    })
  })

  describe('openQuickCreateMenu', () => {
    it('should open quick create menu with position', () => {
      const { result } = renderHook(() => useSessionEdit(), {
        wrapper: createWrapper(),
      })

      const position: Position = {
        x: 100,
        y: 200,
        date: new Date('2024-01-15'),
        time: new Date('2024-01-15T09:00:00')
      }

      act(() => {
        result.current.openQuickCreateMenu(position)
      })

      expect(result.current.isQuickCreateMenuOpen).toBe(true)
      expect(result.current.quickCreatePosition).toEqual(position)
    })

    it('should clear selected and editing sessions when opening quick create', () => {
      const { result } = renderHook(() => useSessionEdit(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.selectSession('session-1')
        result.current.openSessionEdit('session-2')
      })

      expect(result.current.selectedSessionId).toBe('session-1')
      expect(result.current.editingSessionId).toBe('session-2')

      const position: Position = {
        x: 100,
        y: 200,
        date: new Date('2024-01-15'),
        time: new Date('2024-01-15T09:00:00')
      }

      act(() => {
        result.current.openQuickCreateMenu(position)
      })

      expect(result.current.selectedSessionId).toBeNull()
      expect(result.current.editingSessionId).toBeNull()
      expect(result.current.isQuickCreateMenuOpen).toBe(true)
    })
  })

  describe('closeAllMenus', () => {
    it('should close all menus and clear selections', () => {
      const { result } = renderHook(() => useSessionEdit(), {
        wrapper: createWrapper(),
      })

      const position: Position = {
        x: 100,
        y: 200,
        date: new Date('2024-01-15'),
        time: new Date('2024-01-15T09:00:00')
      }

      act(() => {
        result.current.selectSession('session-1')
        result.current.openSessionEdit('session-2')
        result.current.openQuickCreateMenu(position)
      })

      act(() => {
        result.current.closeAllMenus()
      })

      expect(result.current.selectedSessionId).toBeNull()
      expect(result.current.editingSessionId).toBeNull()
      expect(result.current.isQuickCreateMenuOpen).toBe(false)
      expect(result.current.quickCreatePosition).toBeNull()
    })
  })

  describe('useSessionEdit hook error handling', () => {
    it('should throw error when used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        renderHook(() => useSessionEdit())
      }).toThrow('useSessionEdit must be used within a SessionEditProvider')
      
      consoleError.mockRestore()
    })
  })
})