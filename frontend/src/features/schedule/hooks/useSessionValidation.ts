'use client'

import { useCallback } from 'react'
import { Session, SessionCreateData, SessionUpdateData, ValidationResult, ValidationErrors } from '../../../../types/session'
import { validateSessionTimes, checkSessionConflicts, getSessionDuration } from '../utils/sessionHelpers'

interface UseSessionValidationConfig {
  sessions: Session[]
  venues: Array<{ id: string; name: string; capacity?: number }>
  instructors: Array<{ id: string; name: string }>
  businessHours: {
    start: { hour: number; minute: number }
    end: { hour: number; minute: number }
  }
}

interface UseSessionValidationResult {
  validateCreateSession: (data: SessionCreateData) => ValidationResult
  validateUpdateSession: (id: string, data: SessionUpdateData) => ValidationResult
  validateMoveSession: (id: string, newStart: Date, newEnd: Date) => ValidationResult
  errors: ValidationErrors | null
}

export const useSessionValidation = (config: UseSessionValidationConfig): UseSessionValidationResult => {
  const { sessions, venues, instructors, businessHours } = config

  const validateBusinessHours = useCallback((start: Date, end: Date): ValidationErrors => {
    const errors: ValidationErrors = {}

    const startHour = start.getHours()
    const startMinute = start.getMinutes()
    const endHour = end.getHours()
    const endMinute = end.getMinutes()

    const startTime = startHour * 60 + startMinute
    const endTime = endHour * 60 + endMinute
    const businessStartTime = businessHours.start.hour * 60 + businessHours.start.minute
    const businessEndTime = businessHours.end.hour * 60 + businessHours.end.minute

    if (startTime < businessStartTime) {
      errors.businessHours = `営業時間外です。開始時刻は${businessHours.start.hour.toString().padStart(2, '0')}:${businessHours.start.minute.toString().padStart(2, '0')}以降にしてください。`
    }

    if (endTime > businessEndTime) {
      errors.businessHours = `営業時間外です。終了時刻は${businessHours.end.hour.toString().padStart(2, '0')}:${businessHours.end.minute.toString().padStart(2, '0')}以前にしてください。`
    }

    return errors
  }, [businessHours])

  const validateVenueAvailability = useCallback((
    venueId: string,
    start: Date,
    end: Date,
    excludeSessionId?: string
  ): ValidationErrors => {
    const errors: ValidationErrors = {}

    // 会場が存在するかチェック
    const venue = venues.find(v => v.id === venueId)
    if (!venue) {
      errors.venue = '指定された会場が見つかりません。'
      return errors
    }

    // 同じ会場で時間が重複するセッションがないかチェック
    const conflictingSessions = sessions.filter(session => {
      if (excludeSessionId && session.id === excludeSessionId) {
        return false
      }
      return session.venueId === venueId && 
             session.start < end && 
             start < session.end
    })

    if (conflictingSessions.length > 0) {
      const conflictTimes = conflictingSessions.map(session => 
        `${session.start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}-${session.end.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`
      ).join(', ')
      
      errors.venue = `会場「${venue.name}」は指定時間に他のセッションで使用されています。(${conflictTimes})`
    }

    return errors
  }, [venues, sessions])

  const validateInstructorAvailability = useCallback((
    instructorId: string | undefined,
    start: Date,
    end: Date,
    excludeSessionId?: string
  ): ValidationErrors => {
    const errors: ValidationErrors = {}

    if (!instructorId) {
      return errors // 指導者が指定されていない場合はスキップ
    }

    // 指導者が存在するかチェック
    const instructor = instructors.find(i => i.id === instructorId)
    if (!instructor) {
      errors.instructor = '指定された指導者が見つかりません。'
      return errors
    }

    // 同じ指導者で時間が重複するセッションがないかチェック
    const conflictingSessions = sessions.filter(session => {
      if (excludeSessionId && session.id === excludeSessionId) {
        return false
      }
      return session.instructorId === instructorId && 
             session.start < end && 
             start < session.end
    })

    if (conflictingSessions.length > 0) {
      const conflictTimes = conflictingSessions.map(session => 
        `${session.start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}-${session.end.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`
      ).join(', ')
      
      errors.instructor = `指導者「${instructor.name}」は指定時間に他のセッションを担当しています。(${conflictTimes})`
    }

    return errors
  }, [instructors, sessions])

  const validateCreateSession = useCallback((data: SessionCreateData): ValidationResult => {
    let allErrors: ValidationErrors = {}

    // 基本的な時間検証
    const timeValidation = validateSessionTimes(data.start, data.end)
    if (!timeValidation.isValid) {
      allErrors = { ...allErrors, ...timeValidation.errors }
    }

    // 営業時間チェック
    const businessHoursErrors = validateBusinessHours(data.start, data.end)
    allErrors = { ...allErrors, ...businessHoursErrors }

    // 会場の可用性チェック
    const venueErrors = validateVenueAvailability(data.venueId, data.start, data.end)
    allErrors = { ...allErrors, ...venueErrors }

    // 指導者の可用性チェック
    const instructorErrors = validateInstructorAvailability(data.instructorId, data.start, data.end)
    allErrors = { ...allErrors, ...instructorErrors }

    // タイトルの検証
    if (!data.title.trim()) {
      allErrors.title = 'タイトルを入力してください。'
    } else if (data.title.length > 100) {
      allErrors.title = 'タイトルは100文字以内で入力してください。'
    }

    // パートIDの検証
    if (!data.partId || data.partId <= 0) {
      allErrors.partId = 'パートを選択してください。'
    }

    return {
      isValid: Object.keys(allErrors).length === 0,
      errors: allErrors
    }
  }, [validateBusinessHours, validateVenueAvailability, validateInstructorAvailability])

  const validateUpdateSession = useCallback((id: string, data: SessionUpdateData): ValidationResult => {
    let allErrors: ValidationErrors = {}

    // セッションが存在するかチェック
    const existingSession = sessions.find(s => s.id === id)
    if (!existingSession) {
      allErrors.session = '更新対象のセッションが見つかりません。'
      return { isValid: false, errors: allErrors }
    }

    // 更新される値を取得（既存の値をデフォルトとして使用）
    const start = data.start || existingSession.start
    const end = data.end || existingSession.end
    const title = data.title !== undefined ? data.title : existingSession.title
    const partId = data.partId !== undefined ? data.partId : existingSession.partId
    const venueId = data.venueId || existingSession.venueId
    const instructorId = data.instructorId !== undefined ? data.instructorId : existingSession.instructorId

    // 時間が更新される場合の検証
    if (data.start || data.end) {
      const timeValidation = validateSessionTimes(start, end)
      if (!timeValidation.isValid) {
        allErrors = { ...allErrors, ...timeValidation.errors }
      }

      const businessHoursErrors = validateBusinessHours(start, end)
      allErrors = { ...allErrors, ...businessHoursErrors }
    }

    // 会場が更新される場合の検証
    if (data.venueId || data.start || data.end) {
      const venueErrors = validateVenueAvailability(venueId, start, end, id)
      allErrors = { ...allErrors, ...venueErrors }
    }

    // 指導者が更新される場合の検証
    if (data.instructorId !== undefined || data.start || data.end) {
      const instructorErrors = validateInstructorAvailability(instructorId, start, end, id)
      allErrors = { ...allErrors, ...instructorErrors }
    }

    // タイトルが更新される場合の検証
    if (data.title !== undefined) {
      if (!title.trim()) {
        allErrors.title = 'タイトルを入力してください。'
      } else if (title.length > 100) {
        allErrors.title = 'タイトルは100文字以内で入力してください。'
      }
    }

    // パートが更新される場合の検証
    if (data.partId !== undefined) {
      if (!partId || partId <= 0) {
        allErrors.partId = 'パートを選択してください。'
      }
    }

    return {
      isValid: Object.keys(allErrors).length === 0,
      errors: allErrors
    }
  }, [sessions, validateBusinessHours, validateVenueAvailability, validateInstructorAvailability])

  const validateMoveSession = useCallback((id: string, newStart: Date, newEnd: Date): ValidationResult => {
    let allErrors: ValidationErrors = {}

    // セッションが存在するかチェック
    const existingSession = sessions.find(s => s.id === id)
    if (!existingSession) {
      allErrors.session = '移動対象のセッションが見つかりません。'
      return { isValid: false, errors: allErrors }
    }

    // 基本的な時間検証
    const timeValidation = validateSessionTimes(newStart, newEnd)
    if (!timeValidation.isValid) {
      allErrors = { ...allErrors, ...timeValidation.errors }
    }

    // 営業時間チェック
    const businessHoursErrors = validateBusinessHours(newStart, newEnd)
    allErrors = { ...allErrors, ...businessHoursErrors }

    // 会場の可用性チェック（現在のセッションは除外）
    const venueErrors = validateVenueAvailability(existingSession.venueId, newStart, newEnd, id)
    allErrors = { ...allErrors, ...venueErrors }

    // 指導者の可用性チェック（現在のセッションは除外）
    const instructorErrors = validateInstructorAvailability(existingSession.instructorId, newStart, newEnd, id)
    allErrors = { ...allErrors, ...instructorErrors }

    return {
      isValid: Object.keys(allErrors).length === 0,
      errors: allErrors
    }
  }, [sessions, validateBusinessHours, validateVenueAvailability, validateInstructorAvailability])

  return {
    validateCreateSession,
    validateUpdateSession,
    validateMoveSession,
    errors: null // このフックでは常にnull（各関数が個別にエラーを返す）
  }
}