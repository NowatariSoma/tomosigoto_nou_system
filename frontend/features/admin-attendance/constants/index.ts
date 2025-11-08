// API関連の定数
export const API_ENDPOINTS = {
  ATTENDANCE: '/attendance/',
  USERS: '/users/',
  PRACTICE_SCHEDULES: '/practice_schedules/',
} as const;

// 出席ステータス
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  NO_SHOW: 'no_show',
} as const;

export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];

// 出席ステータス表示用
export const ATTENDANCE_STATUS_LABELS = {
  [ATTENDANCE_STATUS.PRESENT]: '出席',
  [ATTENDANCE_STATUS.ABSENT]: '欠席',
  [ATTENDANCE_STATUS.LATE]: '遅刻',
  [ATTENDANCE_STATUS.NO_SHOW]: '無断欠席',
} as const;

// 出席ステータス色
export const ATTENDANCE_STATUS_COLORS = {
  [ATTENDANCE_STATUS.PRESENT]: 'text-green-600 bg-green-50',
  [ATTENDANCE_STATUS.ABSENT]: 'text-red-600 bg-red-50',
  [ATTENDANCE_STATUS.LATE]: 'text-yellow-600 bg-yellow-50',
  [ATTENDANCE_STATUS.NO_SHOW]: 'text-red-700 bg-red-100',
} as const;

// UI表示用テキスト
export const UI_TEXT = {
  LOADING_TEXT: '読み込み中...',
  NO_ATTENDANCE_DATA: '出席記録がありません',
  NO_PRACTICE_DATA: '練習予定がありません',
  NO_USERS: 'ユーザーが登録されていません',
  ATTENDANCE_REGISTRATION: '出席登録',
  BULK_ATTENDANCE_REGISTRATION: '一括出席登録',
  ATTENDANCE_HISTORY: '出席履歴',
  ATTENDANCE_TABLE: '出席一覧',
  SAVE: '保存',
  CANCEL: 'キャンセル',
  STATUS: '出席状況',
  NOTES: '備考',
  PRACTICE: '練習',
  DATE: '日付',
  TIME: '時間',
  VENUE: '会場',
  USER_NAME: 'ユーザー名',
  AVAILABLE_FROM: '参加開始時刻',
  AVAILABLE_TO: '参加終了時刻',
  SET_UNENTERED_TO_PRESENT: '未入力を出席にする',
  BULK_SAVE: '一括保存',
  SELECT_PRACTICE: '練習を選択',
  FILTER_BY_STATUS: '出席状況でフィルタ',
  FILTER_BY_DATE: '日付範囲でフィルタ',
  START_DATE: '開始日',
  END_DATE: '終了日',
  ALL_STATUS: 'すべて',
  REQUIRED_FIELD: '必須項目',
} as const;

// バリデーション関連
export const VALIDATION = {
  MIN_NOTES_LENGTH: 0,
  MAX_NOTES_LENGTH: 500,
} as const;

