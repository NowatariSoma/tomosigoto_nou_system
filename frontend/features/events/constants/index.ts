// API関連の定数
export const API_ENDPOINTS = {
  EVENTS: '/events/',
} as const;

// UI表示用テキスト
export const UI_TEXT = {
  LOADING_TEXT: '読み込み中...',
  NO_EVENT_DATA: 'イベントデータがありません',
  NO_ROUND_DATA: 'ラウンドデータがありません',
  CREATE_EVENT: 'イベントを作成',
  UPDATE_EVENT: 'イベントを更新',
  DELETE_EVENT: 'イベントを削除',
  CREATE_ROUND: 'ラウンドを作成',
  UPDATE_ROUND: 'ラウンドを更新',
  DELETE_ROUND: 'ラウンドを削除',
  SAVE: '保存',
  CANCEL: 'キャンセル',
  EVENT_ID: 'イベントID',
  TITLE: 'タイトル',
  DESCRIPTION: '説明',
  EVENT_DATE: 'イベント日',
  START_TIME: '開始時間',
  END_TIME: '終了時間',
  LOCATION: '場所',
  STATUS: 'ステータス',
  ROUND_NUMBER: 'ラウンド番号',
  ROUND_NAME: 'ラウンド名',
  REQUIRED_FIELD: '必須項目',
} as const;

// ステータス関連
export const EVENT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const ROUND_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
