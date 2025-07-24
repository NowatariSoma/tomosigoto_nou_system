/**
 * Session Helpers Test
 * TDD テスト - SessionHelpers ユーティリティ関数のテスト
 */

import {
  formatSessionTime,
  formatSessionDate,
  getSessionDuration,
  isSessionOverlapping,
  validateSessionTimes,
  checkSessionConflicts,
  snapToGrid,
  calculateNewSessionTime,
  getSessionColorByPart
} from '../../../src/features/schedule/utils/sessionHelpers'

import { Session } from '../../../types/session'

describe('sessionHelpers', () => {
  describe('formatSessionTime', () => {
    it('should format session time in Japanese format', () => {
      const start = new Date('2024-01-15T09:00:00')
      const end = new Date('2024-01-15T10:30:00')
      
      const result = formatSessionTime(start, end)
      expect(result).toBe('09:00 - 10:30')
    })
  })

  describe('formatSessionDate', () => {
    it('should format date in Japanese format', () => {
      const date = new Date('2024-01-15T09:00:00')
      
      const result = formatSessionDate(date)
      expect(result).toContain('2024年')
      expect(result).toContain('1月')
      expect(result).toContain('15日')
    })
  })

  describe('getSessionDuration', () => {
    it('should calculate duration in minutes', () => {
      const start = new Date('2024-01-15T09:00:00')
      const end = new Date('2024-01-15T10:30:00')
      
      const result = getSessionDuration(start, end)
      expect(result).toBe(90)
    })
  })

  describe('isSessionOverlapping', () => {
    it('should detect overlapping sessions', () => {
      const session1 = {
        start: new Date('2024-01-15T09:00:00'),
        end: new Date('2024-01-15T10:00:00')
      }
      const session2 = {
        start: new Date('2024-01-15T09:30:00'),
        end: new Date('2024-01-15T10:30:00')
      }
      
      const result = isSessionOverlapping(session1, session2)
      expect(result).toBe(true)
    })

    it('should detect non-overlapping sessions', () => {
      const session1 = {
        start: new Date('2024-01-15T09:00:00'),
        end: new Date('2024-01-15T10:00:00')
      }
      const session2 = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00')
      }
      
      const result = isSessionOverlapping(session1, session2)
      expect(result).toBe(false)
    })
  })

  describe('validateSessionTimes', () => {
    it('should validate correct session times', () => {
      const start = new Date('2024-01-15T09:00:00')
      const end = new Date('2024-01-15T10:00:00')
      
      const result = validateSessionTimes(start, end)
      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('should invalidate when start is after end', () => {
      const start = new Date('2024-01-15T10:00:00')
      const end = new Date('2024-01-15T09:00:00')
      
      const result = validateSessionTimes(start, end)
      expect(result.isValid).toBe(false)
      expect(result.errors.time).toBeDefined()
    })

    it('should invalidate sessions shorter than 30 minutes', () => {
      const start = new Date('2024-01-15T09:00:00')
      const end = new Date('2024-01-15T09:15:00')
      
      const result = validateSessionTimes(start, end)
      expect(result.isValid).toBe(false)
      expect(result.errors.duration).toBeDefined()
    })
  })

  describe('checkSessionConflicts', () => {
    const existingSessions: Session[] = [
      {
        id: '1',
        title: 'セッション1',
        start: new Date('2024-01-15T09:00:00'),
        end: new Date('2024-01-15T10:00:00'),
        partId: 1,
        partName: 'パート1',
        venueId: 'venue1',
        venueName: '会場1',
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    it('should find conflicting sessions', () => {
      const newSession = {
        start: new Date('2024-01-15T09:30:00'),
        end: new Date('2024-01-15T10:30:00')
      }
      
      const conflicts = checkSessionConflicts(newSession, existingSessions)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].id).toBe('1')
    })

    it('should exclude specified session from conflict check', () => {
      const newSession = {
        start: new Date('2024-01-15T09:30:00'),
        end: new Date('2024-01-15T10:30:00')
      }
      
      const conflicts = checkSessionConflicts(newSession, existingSessions, '1')
      expect(conflicts).toHaveLength(0)
    })
  })

  describe('snapToGrid', () => {
    it('should snap time to 30-minute grid', () => {
      const time = new Date('2024-01-15T09:23:00')
      
      const result = snapToGrid(time, 30)
      expect(result.getMinutes()).toBe(30)
    })

    it('should snap time to 15-minute grid', () => {
      const time = new Date('2024-01-15T09:23:00')
      
      const result = snapToGrid(time, 15)
      expect(result.getMinutes()).toBe(15)
    })
  })

  describe('calculateNewSessionTime', () => {
    it('should calculate new session time based on drag offset', () => {
      const originalStart = new Date('2024-01-15T09:00:00')
      const originalEnd = new Date('2024-01-15T10:00:00')
      const dragOffset = { x: 0, y: 60 }
      const gridConfig = { cellHeight: 60, minutesPerCell: 30 }
      
      const result = calculateNewSessionTime(originalStart, originalEnd, dragOffset, gridConfig)
      expect(result.start.getMinutes()).toBe(30) // 09:30
      expect(result.end.getMinutes()).toBe(30)   // 10:30
    })
  })

  describe('getSessionColorByPart', () => {
    it('should return consistent colors for part IDs', () => {
      const color1 = getSessionColorByPart(1)
      const color2 = getSessionColorByPart(1)
      
      expect(color1).toBe(color2)
      expect(color1).toMatch(/^#[0-9A-F]{6}$/i)
    })

    it('should return different colors for different parts', () => {
      const color1 = getSessionColorByPart(1)
      const color2 = getSessionColorByPart(2)
      
      expect(color1).not.toBe(color2)
    })
  })
})