import { Session, ValidationResult, ValidationErrors } from '../../../../types/session'

export const formatSessionTime = (start: Date, end: Date): string => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
  
  return `${formatTime(start)} - ${formatTime(end)}`
}

export const formatSessionDate = (date: Date): string => {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

export const getSessionDuration = (start: Date, end: Date): number => {
  return (end.getTime() - start.getTime()) / (1000 * 60) // minutes
}

export const isSessionOverlapping = (
  session1: { start: Date; end: Date },
  session2: { start: Date; end: Date }
): boolean => {
  return session1.start < session2.end && session2.start < session1.end
}

export const validateSessionTimes = (start: Date, end: Date): ValidationResult => {
  const errors: ValidationErrors = {}
  
  if (start >= end) {
    errors.time = '開始時刻は終了時刻より前である必要があります'
  }
  
  const duration = getSessionDuration(start, end)
  if (duration < 30) {
    errors.duration = 'セッションは最低30分必要です'
  }
  
  if (duration > 8 * 60) {
    errors.duration = 'セッションは最大8時間までです'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const checkSessionConflicts = (
  newSession: { start: Date; end: Date },
  existingSessions: Session[],
  excludeSessionId?: string
): Session[] => {
  return existingSessions.filter(session => {
    if (excludeSessionId && session.id === excludeSessionId) {
      return false
    }
    return isSessionOverlapping(newSession, session)
  })
}

export const snapToGrid = (time: Date, snapMinutes: number = 30): Date => {
  const minutes = time.getMinutes()
  const snappedMinutes = Math.round(minutes / snapMinutes) * snapMinutes
  
  const snappedTime = new Date(time)
  snappedTime.setMinutes(snappedMinutes, 0, 0)
  
  return snappedTime
}

export const calculateNewSessionTime = (
  originalStart: Date,
  originalEnd: Date,
  dragOffset: { x: number; y: number },
  gridConfig: { cellHeight: number; minutesPerCell: number }
): { start: Date; end: Date } => {
  const duration = getSessionDuration(originalStart, originalEnd)
  const minutesOffset = Math.round((dragOffset.y / gridConfig.cellHeight) * gridConfig.minutesPerCell)
  
  const newStart = new Date(originalStart.getTime() + minutesOffset * 60 * 1000)
  const newEnd = new Date(newStart.getTime() + duration * 60 * 1000)
  
  return {
    start: snapToGrid(newStart),
    end: snapToGrid(newEnd)
  }
}

export const getSessionColorByPart = (partId: number): string => {
  const colors = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // amber
    '#8B5CF6', // violet
    '#F97316', // orange
    '#06B6D4', // cyan
    '#84CC16'  // lime
  ]
  
  return colors[partId % colors.length] || colors[0]
}