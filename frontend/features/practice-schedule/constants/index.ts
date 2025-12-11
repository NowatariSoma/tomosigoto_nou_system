// API関連の定数
export const API_ENDPOINTS = {
  PRACTICE_SCHEDULES: '/practice_schedules/',
  VENUES: '/venues/',
} as const;

// 時間関連の定数
export const TIME_SLOTS = {
  START_HOUR: 6,
  END_HOUR: 23,
  INTERVAL_MINUTES: 30,
} as const;

// フォーム初期値
export const INITIAL_PRACTICE_SCHEDULE_FORM = {
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  venueId: '',
  title: '',
  description: '',
  // 複数部屋選択対応
  venueIds: [] as string[],
  selectedVenues: [] as any[],
  // ステージ（舞台）選択対応
  stageId: '',
};

// UI表示用テキスト
export const UI_TEXT = {
  LOADING_TEXT: '読み込み中...',
  NO_SCHEDULE_DATA: '練習予定がありません',
  NO_VENUE_DATA: '会場データがありません',
  CREATE_SCHEDULE: '練習予定を作成',
  UPDATE_SCHEDULE: '練習予定を更新',
  DELETE_SCHEDULE: '練習予定を削除',
  SAVE: '保存',
  CANCEL: 'キャンセル',
  DATE: '日付',
  START_TIME: '開始時間',
  END_TIME: '終了時間',
  VENUE: '会場',
  TITLE: 'タイトル',
  DESCRIPTION: '説明',
  REQUIRED_FIELD: '必須項目',
  STAGE: '舞台',
  NO_STAGE_DATA: '舞台データがありません',
  SELECT_STAGE: '舞台を選択してください',
  NO_STAGE_SELECTED: '舞台未選択',
} as const;

// バリデーション関連
export const VALIDATION = {
  MIN_DESCRIPTION_LENGTH: 0,
  MAX_DESCRIPTION_LENGTH: 500,
  TIME_FORMAT: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/,
} as const;
