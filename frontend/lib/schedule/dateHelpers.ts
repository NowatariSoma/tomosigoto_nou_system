/**
 * Date Helper Functions
 * 日付操作に関するヘルパー関数
 */

export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

export const formatTimeForInput = (date: Date): string => {
  return date.toTimeString().split(' ')[0].substring(0, 5)
}

export const formatDateTimeForInput = (date: Date): string => {
  const dateStr = formatDateForInput(date)
  const timeStr = formatTimeForInput(date)
  return `${dateStr}T${timeStr}`
}

export const parseDateTime = (dateStr: string, timeStr: string): Date => {
  return new Date(`${dateStr}T${timeStr}`)
}

export const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

export const addHours = (date: Date, hours: number): Date => {
  return addMinutes(date, hours * 60)
}

export const startOfDay = (date: Date): Date => {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

export const endOfDay = (date: Date): Date => {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.toDateString() === date2.toDateString()
}

export const formatJapaneseDate = (date: Date): string => {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

export const formatJapaneseTime = (date: Date): string => {
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

export const formatJapaneseDateTime = (date: Date): string => {
  return `${formatJapaneseDate(date)} ${formatJapaneseTime(date)}`
}