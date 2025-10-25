// API関連の定数
export const API_ENDPOINTS = {
  PRACTICE_SCHEDULES: '/practice_schedules/',
  SESSIONS: '/practice_schedules/sessions',
  VENUES: '/venues/',
  PRACTICE_SCHEDULE_DETAILS: '/practice_schedules/',
} as const;

// 時間関連の定数
export const TIME_SLOTS = {
  START_HOUR: 6,
  END_HOUR: 23,
  INTERVAL_MINUTES: 30,
} as const;

// ドラッグ&ドロップ関連の定数
export const DRAG_TYPES = {
  SESSION: 'session',
} as const;

// UI表示用テキスト
export const UI_TEXT = {
  LOADING_TEXT: '読み込み中...',
  NO_SCHEDULE_DATA: '練習予定がありません',
  NO_SESSION_DATA: 'セッションがありません',
  CREATE_SESSION: 'セッションを作成',
  UPDATE_SESSION: 'セッションを更新',
  DELETE_SESSION: 'セッションを削除',
  SAVE: '保存',
  CANCEL: 'キャンセル',
  ADD_SESSION: 'セッションを追加',
  EDIT_MODE: '編集モード',
  VIEW_MODE: '表示モード',
  SESSION_TITLE: 'セッション名',
  PART_NAME: 'パート名',
  INSTRUCTOR: '指導者',
  VENUE: '会場',
  TIME: '時間',
  PRIORITY: '優先度',
  NOTES: '備考',
  REQUIRED_FIELD: '必須項目',
} as const;

// バリデーション関連
export const VALIDATION = {
  MIN_TITLE_LENGTH: 1,
  MAX_TITLE_LENGTH: 100,
  MIN_PART_NAME_LENGTH: 1,
  MAX_PART_NAME_LENGTH: 50,
  MAX_NOTES_LENGTH: 500,
} as const;

// セッション編集用の初期値
export const INITIAL_SESSION_FORM = {
  title: '',
  part_id: '',
  instructor_ids: [] as string[],
  venue_id: '',
  time_slot: '',
  priority: 0,
  notes: '',
};
