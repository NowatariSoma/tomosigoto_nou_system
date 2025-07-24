/**
 * useSessionValidation Hook Test
 * TDD テスト - セッション検証カスタムフックのテスト
 */

import { renderHook } from '@testing-library/react'
import { useSessionValidation } from '../../../src/features/schedule/hooks/useSessionValidation'
import { Session, SessionCreateData, SessionUpdateData } from '../../../types/session'

const mockSessions: Session[] = [
  {
    id: 'session-1',
    title: '既存セッション1',
    start: new Date('2024-01-15T09:00:00'),
    end: new Date('2024-01-15T10:00:00'),
    partId: 1,
    partName: 'パート1',
    venueId: 'venue-1',
    venueName: '会場1',
    instructorId: 'instructor-1',
    instructorName: '指導者1',
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'session-2',
    title: '既存セッション2',
    start: new Date('2024-01-15T14:00:00'),
    end: new Date('2024-01-15T15:30:00'),
    partId: 2,
    partName: 'パート2',
    venueId: 'venue-2',
    venueName: '会場2',
    instructorId: 'instructor-2',
    instructorName: '指導者2',
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const mockVenues = [
  { id: 'venue-1', name: '会場1', capacity: 20 },
  { id: 'venue-2', name: '会場2', capacity: 30 }
]

const mockInstructors = [
  { id: 'instructor-1', name: '指導者1' },
  { id: 'instructor-2', name: '指導者2' }
]

const mockBusinessHours = {
  start: { hour: 8, minute: 0 },
  end: { hour: 22, minute: 0 }
}

const defaultConfig = {
  sessions: mockSessions,
  venues: mockVenues,
  instructors: mockInstructors,
  businessHours: mockBusinessHours
}

describe('useSessionValidation', () => {
  describe('validateCreateSession', () => {
    it('should validate correct session data', () => {
      const { result } = renderHook(() => useSessionValidation(defaultConfig))

      const createData: SessionCreateData = {
        title: '新しいセッション',
        start: new Date('2024-01-15T11:00:00'),
        end: new Date('2024-01-15T12:00:00'),
        partId: 1,
        venueId: 'venue-1',
        instructorId: 'instructor-1'
      }

      const validation = result.current.validateCreateSession(createData)

      expect(validation.isValid).toBe(true)
      expect(Object.keys(validation.errors)).toHaveLength(0)
    })

    it('should invalidate empty title', () => {
      const { result } = renderHook(() => useSessionValidation(defaultConfig))

      const createData: SessionCreateData = {
        title: '',
        start: new Date('2024-01-15T11:00:00'),
        end: new Date('2024-01-15T12:00:00'),
        partId: 1,
        venueId: 'venue-1'
      }

      const validation = result.current.validateCreateSession(createData)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.title).toBe('タイトルを入力してください。')
    })

    it('should invalidate long title', () => {
      const { result } = renderHook(() => useSessionValidation(defaultConfig))

      const longTitle = 'a'.repeat(101)
      const createData: SessionCreateData = {
        title: longTitle,
        start: new Date('2024-01-15T11:00:00'),
        end: new Date('2024-01-15T12:00:00'),
        partId: 1,
        venueId: 'venue-1'
      }

      const validation = result.current.validateCreateSession(createData)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.title).toBe('タイトルは100文字以内で入力してください。')
    })

    it('should invalidate invalid part ID', () => {
      const { result } = renderHook(() => useSessionValidation(defaultConfig))

      const createData: SessionCreateData = {
        title: 'テストセッション',
        start: new Date('2024-01-15T11:00:00'),
        end: new Date('2024-01-15T12:00:00'),
        partId: 0,
        venueId: 'venue-1'
      }

      const validation = result.current.validateCreateSession(createData)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.partId).toBe('パートを選択してください。')
    })

    it('should invalidate time outside business hours', () => {
      const { result } = renderHook(() => useSessionValidation(defaultConfig))

      const createData: SessionCreateData = {
        title: 'テストセッション',
        start: new Date('2024-01-15T07:00:00'), // 営業時間前
        end: new Date('2024-01-15T08:00:00'),
        partId: 1,
        venueId: 'venue-1'
      }

      const validation = result.current.validateCreateSession(createData)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.businessHours).toContain('営業時間外です')
    })

    it('should invalidate venue conflict', () => {
      const { result } = renderHook(() => useSessionValidation(defaultConfig))

      // 既存セッション session-1 と同じ会場・時間で重複
      const createData: SessionCreateData = {
        title: 'テストセッション',
        start: new Date('2024-01-15T09:30:00'),
        end: new Date('2024-01-15T10:30:00'),
        partId: 1,
        venueId: 'venue-1' // session-1と同じ会場
      }

      const validation = result.current.validateCreateSession(createData)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.venue).toContain('会場「会場1」は指定時間に他のセッションで使用されています')
    })

    it('should invalidate instructor conflict', () => {
      const { result } = renderHook(() => useSessionValidation(defaultConfig))

      // 既存セッション session-1 と同じ指導者・時間で重複
      const createData: SessionCreateData = {
        title: 'テストセッション',
        start: new Date('2024-01-15T09:30:00'),
        end: new Date('2024-01-15T10:30:00'),
        partId: 1,
        venueId: 'venue-2', // 違う会場
        instructorId: 'instructor-1' // session-1と同じ指導者
      }

      const validation = result.current.validateCreateSession(createData)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.instructor).toContain('指導者「指導者1」は指定時間に他のセッションを担当しています')
    })

    it('should invalidate non-existent venue', () => {
      const { result } = renderHook(() => useSessionValidation(defaultConfig))

      const createData: SessionCreateData = {
        title: 'テストセッション',
        start: new Date('2024-01-15T11:00:00'),
        end: new Date('2024-01-15T12:00:00'),
        partId: 1,
        venueId: 'non-existent-venue'
      }

      const validation = result.current.validateCreateSession(createData)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.venue).toBe('指定された会場が見つかりません。')
    })

    it('should invalidate non-existent instructor', () => {
      const { result } = renderHook(() => useSessionValidation(defaultConfig))

      const createData: SessionCreateData = {
        title: 'テストセッション',
        start: new Date('2024-01-15T11:00:00'),
        end: new Date('2024-01-15T12:00:00'),
        partId: 1,
        venueId: 'venue-1',
        instructorId: 'non-existent-instructor'
      }

      const validation = result.current.validateCreateSession(createData)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.instructor).toBe('指定された指導者が見つかりません。')
    })
  })

  describe('validateUpdateSession', () => {
    it('should validate correct update data', () => {
      const { result } = renderHook(() => useSessionValidation(defaultConfig))

      const updateData: SessionUpdateData = {
        title: '更新されたタイトル',
        start: new Date('2024-01-15T11:00:00'),
        end: new Date('2024-01-15T12:00:00')
      }

      const validation = result.current.validateUpdateSession('session-1', updateData)

      expect(validation.isValid).toBe(true)
      expect(Object.keys(validation.errors)).toHaveLength(0)
    })

    it('should invalidate non-existent session', () => {
      const { result } = renderHook(() => useSessionValidation(defaultConfig))

      const updateData: SessionUpdateData = {
        title: '更新されたタイトル'
      }

      const validation = result.current.validateUpdateSession('non-existent-session', updateData)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.session).toBe('更新対象のセッションが見つかりません。')
    })

    it('should exclude current session from conflict check', () => {
      const { result } = renderHook(() => useSessionValidation(defaultConfig))

      // session-1の時間を少し変更（他のセッションと重複しない）
      const updateData: SessionUpdateData = {
        start: new Date('2024-01-15T08:30:00'),
        end: new Date('2024-01-15T09:30:00')
      }

      const validation = result.current.validateUpdateSession('session-1', updateData)

      expect(validation.isValid).toBe(true)
    })

    it('should validate partial updates', () => {
      const { result } = renderHook(() => useSessionValidation(defaultConfig))

      // タイトルのみ更新
      const updateData: SessionUpdateData = {
        title: '新しいタイトル'
      }

      const validation = result.current.validateUpdateSession('session-1', updateData)

      expect(validation.isValid).toBe(true)
    })
  })

  describe('validateMoveSession', () => {
    it('should validate correct move', () => {
      const { result } = renderHook(() => useSessionValidation(defaultConfig))

      const newStart = new Date('2024-01-15T11:00:00')
      const newEnd = new Date('2024-01-15T12:00:00')

      const validation = result.current.validateMoveSession('session-1', newStart, newEnd)

      expect(validation.isValid).toBe(true)
      expect(Object.keys(validation.errors)).toHaveLength(0)
    })

    it('should invalidate move of non-existent session', () => {
      const { result } = renderHook(() => useSessionValidation(defaultConfig))

      const newStart = new Date('2024-01-15T11:00:00')
      const newEnd = new Date('2024-01-15T12:00:00')

      const validation = result.current.validateMoveSession('non-existent-session', newStart, newEnd)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.session).toBe('移動対象のセッションが見つかりません。')
    })

    it('should exclude current session from conflict check during move', () => {
      const { result } = renderHook(() => useSessionValidation(defaultConfig))

      // session-1を session-2 の時間帯に移動（会場が違うのでOK）
      const newStart = new Date('2024-01-15T14:30:00')
      const newEnd = new Date('2024-01-15T15:30:00')

      const validation = result.current.validateMoveSession('session-1', newStart, newEnd)

      // 会場が違う（session-1: venue-1, session-2: venue-2）ので有効
      expect(validation.isValid).toBe(true)
    })

    it('should invalidate move to conflicting time with same venue', () => {
      // session-1 を session-2 と同じ会場に変更してからテスト
      const sessionsWithSameVenue = [
        { ...mockSessions[0] }, // session-1
        { ...mockSessions[1], venueId: 'venue-1', venueName: '会場1' } // session-2 を同じ会場に
      ]

      const configWithSameVenue = {
        ...defaultConfig,
        sessions: sessionsWithSameVenue
      }

      const { result } = renderHook(() => useSessionValidation(configWithSameVenue))

      // session-1を session-2 の時間帯に移動（同じ会場なので競合）
      const newStart = new Date('2024-01-15T14:30:00')
      const newEnd = new Date('2024-01-15T15:30:00')

      const validation = result.current.validateMoveSession('session-1', newStart, newEnd)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.venue).toContain('会場「会場1」は指定時間に他のセッションで使用されています')
    })
  })

  describe('errors property', () => {
    it('should always return null for errors property', () => {
      const { result } = renderHook(() => useSessionValidation(defaultConfig))

      expect(result.current.errors).toBeNull()
    })
  })
})