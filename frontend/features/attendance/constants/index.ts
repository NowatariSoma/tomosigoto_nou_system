// API関連の定数
export const API_ENDPOINTS = {
  ATTENDANCE: '/attendance/',
  AUTH: '/auth/',
  PRACTICE_SCHEDULES: '/practice_schedules/',
} as const;

// 出席ステータス
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  UNDECIDED: 'undecided',
} as const;

export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];

// 出席ステータス表示用
export const ATTENDANCE_STATUS_LABELS = {
  [ATTENDANCE_STATUS.PRESENT]: '出席',
  [ATTENDANCE_STATUS.ABSENT]: '無断欠席',
  [ATTENDANCE_STATUS.LATE]: '遅刻',
  [ATTENDANCE_STATUS.UNDECIDED]: '公欠',
} as const;

// 出席ステータス色
export const ATTENDANCE_STATUS_COLORS = {
  [ATTENDANCE_STATUS.PRESENT]: 'text-green-600 bg-green-50',
  [ATTENDANCE_STATUS.ABSENT]: 'text-red-600 bg-red-50',
  [ATTENDANCE_STATUS.LATE]: 'text-yellow-600 bg-yellow-50',
  [ATTENDANCE_STATUS.UNDECIDED]: 'text-gray-600 bg-gray-50',
} as const;

// フォーム初期値
export const INITIAL_ATTENDANCE_FORM = {
  practice_schedule_id: '',
  status: ATTENDANCE_STATUS.PRESENT,
  notes: '',
} as const;

// UI表示用テキスト
export const UI_TEXT = {
  LOADING_TEXT: '読み込み中...',
  NO_ATTENDANCE_DATA: '出席記録がありません',
  NO_PRACTICE_DATA: '練習予定がありません',
  LOGIN_REQUIRED: 'ログインが必要です',
  ATTENDANCE_REGISTRATION: '出席登録',
  ATTENDANCE_HISTORY: '出席履歴',
  LOGIN: 'ログイン',
  LOGOUT: 'ログアウト',
  SAVE: '保存',
  CANCEL: 'キャンセル',
  STATUS: '出席状況',
  NOTES: '備考',
  PRACTICE: '練習',
  DATE: '日付',
  TIME: '時間',
  VENUE: '会場',
  REQUIRED_FIELD: '必須項目',
} as const;

// バリデーション関連
export const VALIDATION = {
  MIN_NOTES_LENGTH: 0,
  MAX_NOTES_LENGTH: 500,
} as const;
