// API関連の定数
export const API_ENDPOINTS = {
  PRACTICE_SLOTS: '/practice_schedules',
  SESSION_INSTRUCTORS: '/session-instructors',
} as const;

// 日時フォーマット用
export const DATE_FORMAT = {
  DISPLAY_DATE: 'YYYY年MM月DD日 (ddd)',
  DISPLAY_TIME: 'HH:mm',
  API_DATE: 'YYYY-MM-DD',
} as const;