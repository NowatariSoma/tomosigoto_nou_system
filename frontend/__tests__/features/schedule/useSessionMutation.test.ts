/**
 * useSessionMutation Hook Test
 * TDD テスト - セッション変更カスタムフックのテスト
 */

import { renderHook, act } from '@testing-library/react'
import { useSessionMutation } from '../../hooks/schedule/useSessionMutation'
import { SessionCreateData, SessionUpdateData } from '../../../types/session'

// Supabaseクライアントのモック
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }
}))

import { supabase } from '../../../lib/supabase'

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('useSessionMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('初期状態', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useSessionMutation())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(typeof result.current.createSession).toBe('function')
      expect(typeof result.current.updateSession).toBe('function')
      expect(typeof result.current.deleteSession).toBe('function')
    })
  })

  describe('createSession', () => {
    it('should create session successfully', async () => {
      const mockResponse = {
        id: 'session-1',
        title: 'テストセッション',
        start: '2024-01-15T09:00:00.000Z',
        end: '2024-01-15T10:00:00.000Z',
        part_id: 1,
        instructor_id: 'instructor-1',
        venue_id: 'venue-1',
        description: 'テスト説明',
        status: 'scheduled',
        created_at: '2024-01-15T08:00:00.000Z',
        updated_at: '2024-01-15T08:00:00.000Z',
        parts: { id: 1, name: 'パート1' },
        venues: { id: 'venue-1', name: '会場1' },
        instructors: { id: 'instructor-1', name: '指導者1' }
      }

      // モックチェーンの設定
      const mockSingle = jest.fn().mockResolvedValue({ data: mockResponse, error: null })
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect })
      mockSupabase.from.mockReturnValue({ insert: mockInsert } as any)

      const { result } = renderHook(() => useSessionMutation())

      const createData: SessionCreateData = {
        title: 'テストセッション',
        start: new Date('2024-01-15T09:00:00'),
        end: new Date('2024-01-15T10:00:00'),
        partId: 1,
        instructorId: 'instructor-1',
        venueId: 'venue-1',
        description: 'テスト説明'
      }

      let createdSession
      await act(async () => {
        createdSession = await result.current.createSession(createData)
      })

      expect(createdSession).toEqual({
        id: 'session-1',
        title: 'テストセッション',
        start: new Date('2024-01-15T09:00:00.000Z'),
        end: new Date('2024-01-15T10:00:00.000Z'),
        partId: 1,
        partName: 'パート1',
        instructorId: 'instructor-1',
        instructorName: '指導者1',
        venueId: 'venue-1',
        venueName: '会場1',
        description: 'テスト説明',
        status: 'scheduled',
        color: '#3B82F6',
        createdAt: new Date('2024-01-15T08:00:00.000Z'),
        updatedAt: new Date('2024-01-15T08:00:00.000Z')
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle create session error', async () => {
      const mockError = { message: 'Database error' }
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError })
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect })
      mockSupabase.from.mockReturnValue({ insert: mockInsert } as any)

      const { result } = renderHook(() => useSessionMutation())

      const createData: SessionCreateData = {
        title: 'テストセッション',
        start: new Date('2024-01-15T09:00:00'),
        end: new Date('2024-01-15T10:00:00'),
        partId: 1,
        venueId: 'venue-1'
      }

      await act(async () => {
        try {
          await result.current.createSession(createData)
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toContain('セッション作成に失敗しました')
        }
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeInstanceOf(Error)
    })

    it('should set loading state during create', async () => {
      let resolvePromise: Function
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      const mockSingle = jest.fn().mockReturnValue(mockPromise)
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect })
      mockSupabase.from.mockReturnValue({ insert: mockInsert } as any)

      const { result } = renderHook(() => useSessionMutation())

      const createData: SessionCreateData = {
        title: 'テストセッション',
        start: new Date('2024-01-15T09:00:00'),
        end: new Date('2024-01-15T10:00:00'),
        partId: 1,
        venueId: 'venue-1'
      }

      let createPromise: Promise<any>
      act(() => {
        createPromise = result.current.createSession(createData)
      })

      // ローディング状態を確認
      expect(result.current.isLoading).toBe(true)

      // プロミスを解決
      act(() => {
        resolvePromise!({ data: null, error: { message: 'test' } })
      })

      await act(async () => {
        try {
          await createPromise!
        } catch (error) {
          // エラーは期待される
        }
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('updateSession', () => {
    it('should update session successfully', async () => {
      const mockResponse = {
        id: 'session-1',
        title: '更新されたセッション',
        start: '2024-01-15T10:00:00.000Z',
        end: '2024-01-15T11:00:00.000Z',
        part_id: 2,
        instructor_id: 'instructor-2',
        venue_id: 'venue-2',
        description: '更新された説明',
        status: 'in-progress',
        created_at: '2024-01-15T08:00:00.000Z',
        updated_at: '2024-01-15T09:00:00.000Z',
        parts: { id: 2, name: 'パート2' },
        venues: { id: 'venue-2', name: '会場2' },
        instructors: { id: 'instructor-2', name: '指導者2' }
      }

      const mockSingle = jest.fn().mockResolvedValue({ data: mockResponse, error: null })
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect })
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
      mockSupabase.from.mockReturnValue({ update: mockUpdate } as any)

      const { result } = renderHook(() => useSessionMutation())

      const updateData: Partial<SessionUpdateData> = {
        title: '更新されたセッション',
        start: new Date('2024-01-15T10:00:00'),
        status: 'in-progress'
      }

      let updatedSession
      await act(async () => {
        updatedSession = await result.current.updateSession('session-1', updateData)
      })

      expect(updatedSession).toEqual({
        id: 'session-1',
        title: '更新されたセッション',
        start: new Date('2024-01-15T10:00:00.000Z'),
        end: new Date('2024-01-15T11:00:00.000Z'),
        partId: 2,
        partName: 'パート2',
        instructorId: 'instructor-2',
        instructorName: '指導者2',
        venueId: 'venue-2',
        venueName: '会場2',
        description: '更新された説明',
        status: 'in-progress',
        color: '#EF4444',
        createdAt: new Date('2024-01-15T08:00:00.000Z'),
        updatedAt: new Date('2024-01-15T09:00:00.000Z')
      })
    })

    it('should handle update session error', async () => {
      const mockError = { message: 'Update failed' }
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError })
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect })
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
      mockSupabase.from.mockReturnValue({ update: mockUpdate } as any)

      const { result } = renderHook(() => useSessionMutation())

      await act(async () => {
        try {
          await result.current.updateSession('session-1', { title: '更新' })
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toContain('セッション更新に失敗しました')
        }
      })

      expect(result.current.error).toBeInstanceOf(Error)
    })
  })

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null })
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq })
      mockSupabase.from.mockReturnValue({ delete: mockDelete } as any)

      const { result } = renderHook(() => useSessionMutation())

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.deleteSession('session-1')
      })

      expect(deleteResult).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle delete session error', async () => {
      const mockError = { message: 'Delete failed' }
      const mockEq = jest.fn().mockResolvedValue({ error: mockError })
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq })
      mockSupabase.from.mockReturnValue({ delete: mockDelete } as any)

      const { result } = renderHook(() => useSessionMutation())

      await act(async () => {
        try {
          await result.current.deleteSession('session-1')
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toContain('セッション削除に失敗しました')
        }
      })

      expect(result.current.error).toBeInstanceOf(Error)
    })
  })
})