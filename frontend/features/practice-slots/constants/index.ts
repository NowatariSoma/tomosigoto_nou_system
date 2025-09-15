// API関連の定数
export const API_ENDPOINTS = {
  VENUES: '/api/v1/practice-slots/',
  PRACTICE_SCHEDULES: '/api/practice-slots',
  PRACTICE_SCHEDULE_DISPLAY: (id: string) => `/api/practice-slots/${id}/display`,
} as const;

// 既存の constants
export * from './practice-display';