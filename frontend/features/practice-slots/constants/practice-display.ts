// 練習表表示用の定数

// API関連の定数
export const API_ENDPOINTS = {
  PRACTICE_SCHEDULES: '/api/practice-slots',
  PRACTICE_SCHEDULE_DISPLAY: (id: string) => `/api/practice-slots/${id}/display`,
} as const;

// スケジュールタイプ
export const SCHEDULE_TYPE = {
  REGULAR: 'regular',
  SPECIAL: 'special',
  DRESS_REHEARSAL: 'dress_rehearsal',
  PERFORMANCE: 'performance',
} as const;

export type ScheduleType = typeof SCHEDULE_TYPE[keyof typeof SCHEDULE_TYPE];

// ステータス
export const SCHEDULE_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  DRAFT: 'draft',
} as const;

export type ScheduleStatus = typeof SCHEDULE_STATUS[keyof typeof SCHEDULE_STATUS];

// UI表示用テキスト
export const UI_TEXT = {
  LOADING_TEXT: '読み込み中...',
  NO_SCHEDULE_DATA: '練習スケジュールデータがありません',
  NO_SESSIONS: 'セッションがありません',
  NO_VENUES: '利用可能会場がありません',
  NO_INSTRUCTORS: '指導者が指定されていません',
  PREFERRED_VENUE: '優先会場',
  PART_NOT_SPECIFIED: '部署未指定',
  VENUE_NOT_SPECIFIED: '会場未指定',
} as const;

// 日時フォーマット用
export const DATE_FORMAT = {
  DISPLAY_DATE: 'YYYY年MM月DD日 (ddd)',
  DISPLAY_TIME: 'HH:mm',
  API_DATE: 'YYYY-MM-DD',
} as const;

// スケジュールタイプ表示名
export const SCHEDULE_TYPE_LABELS = {
  [SCHEDULE_TYPE.REGULAR]: '通常練習',
  [SCHEDULE_TYPE.SPECIAL]: '特別練習',
  [SCHEDULE_TYPE.DRESS_REHEARSAL]: 'ゲネプロ',
  [SCHEDULE_TYPE.PERFORMANCE]: '公演',
} as const;

// ステータス表示名
export const SCHEDULE_STATUS_LABELS = {
  [SCHEDULE_STATUS.ACTIVE]: '実施予定',
  [SCHEDULE_STATUS.CANCELLED]: '中止',
  [SCHEDULE_STATUS.COMPLETED]: '完了',
  [SCHEDULE_STATUS.DRAFT]: '下書き',
} as const;